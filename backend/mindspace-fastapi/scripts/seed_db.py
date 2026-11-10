"""
Database seeder script for Admin, Supervisor, and Safety modules.
Loads seed data and inserts into PostgreSQL database.

Usage:
    python scripts/seed_db.py
    python scripts/seed_db.py --clear  (clears existing data first)
    python scripts/seed_db.py --verbose
"""

import sys
import os
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, List, Any
import argparse
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

try:
    from sqlalchemy import create_engine, text
    from sqlalchemy.orm import sessionmaker
    import psycopg2
except ImportError:
    logger.error("Required packages not found. Install with: pip install sqlalchemy psycopg2-binary")
    sys.exit(1)


def get_database_url() -> str:
    """Get database URL from environment variables."""
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "postgres")
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME", "mindspace")
    
    return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"


def load_seed_data() -> Dict[str, List[Dict[str, Any]]]:
    """Load seed data from the seed module."""
    try:
        from seeds.admin_supervisor_safety_seed import get_all_seed_data
        return get_all_seed_data()
    except ImportError as e:
        logger.error(f"Failed to import seed data: {e}")
        sys.exit(1)


def execute_migration(engine, migration_file: str) -> None:
    """Execute SQL migration file."""
    try:
        with open(migration_file, "r") as f:
            sql_content = f.read()
        
        with engine.connect() as connection:
            # Split by semicolon and execute each statement
            statements = [stmt.strip() for stmt in sql_content.split(";") if stmt.strip()]
            for statement in statements:
                logger.debug(f"Executing: {statement[:60]}...")
                connection.execute(text(statement))
            connection.commit()
        
        logger.info(f"✓ Migration executed: {Path(migration_file).name}")
    except Exception as e:
        logger.error(f"✗ Migration failed: {e}")
        raise


def clear_seed_data(engine) -> None:
    """Clear existing seed data from all tables."""
    tables = [
        "admin_stats_db",
        "admin_db",
        "supervisor_stats_db",
        "supervisor_db",
        "safety_stats_db",
        "safety_db",
    ]
    
    try:
        with engine.connect() as connection:
            for table in tables:
                try:
                    logger.info(f"Clearing {table}...")
                    connection.execute(text(f"DELETE FROM {table}"))
                    connection.commit()
                except Exception as e:
                    logger.warning(f"Could not clear {table}: {e}")
    except Exception as e:
        logger.error(f"Error clearing data: {e}")


def insert_seed_data(engine, seed_data: Dict[str, List[Dict[str, Any]]]) -> None:
    """Insert seed data into database."""
    insertion_order = [
        "admin_db",
        "admin_stats_db",
        "supervisor_db",
        "supervisor_stats_db",
        "safety_db",
        "safety_stats_db",
    ]
    
    stats = {
        "inserted": 0,
        "failed": 0,
    }
    
    with engine.connect() as connection:
        for table_name in insertion_order:
            records = seed_data.get(table_name, [])
            if not records:
                continue
            
            logger.info(f"\nInserting into {table_name}: {len(records)} records")
            
            for idx, record in enumerate(records, 1):
                try:
                    # Build INSERT statement
                    columns = ", ".join(record.keys())
                    placeholders = ", ".join([f":{key}" for key in record.keys()])
                    insert_stmt = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})"
                    
                    connection.execute(text(insert_stmt), record)
                    connection.commit()
                    
                    stats["inserted"] += 1
                    email = record.get("email", record.get("id", "N/A"))
                    logger.debug(f"  [{idx}/{len(records)}] ✓ {email}")
                    
                except Exception as e:
                    stats["failed"] += 1
                    email = record.get("email", record.get("id", "N/A"))
                    logger.error(f"  [{idx}/{len(records)}] ✗ {email}: {e}")
    
    return stats


def print_summary(seed_data: Dict[str, List[Dict[str, Any]]], stats: Dict[str, int]) -> None:
    """Print summary report of seed operation."""
    print("\n" + "=" * 70)
    print("SEED DATA SUMMARY".center(70))
    print("=" * 70)
    
    print("\nData Distribution:")
    print("-" * 70)
    for table_name, records in seed_data.items():
        count = len(records)
        print(f"  {table_name:<30} {count:>5} records")
    
    total_records = sum(len(r) for r in seed_data.values())
    print("-" * 70)
    print(f"  {'Total':<30} {total_records:>5} records")
    
    print("\nInsertion Results:")
    print("-" * 70)
    print(f"  Successfully inserted: {stats['inserted']} records")
    print(f"  Failed inserts:        {stats['failed']} records")
    
    if stats["failed"] == 0:
        print("\n✓ All seed data inserted successfully!")
    else:
        print(f"\n⚠ {stats['failed']} insertion(s) failed - check logs above")
    
    print("\nSample Data Overview:")
    print("-" * 70)
    print("\nAdmins (5 total):")
    for admin in seed_data.get("admin_db", []):
        status = "ACTIVE" if admin.get("is_active") else "INACTIVE"
        print(f"  - {admin['email']:<35} Role: {admin['role']:<12} [{status}]")
    
    print("\nSupervisors (5 total):")
    for sup in seed_data.get("supervisor_db", []):
        status = "ACTIVE" if sup.get("is_active") else "INACTIVE"
        exp_level = sup.get("experience_level", "N/A")
        print(f"  - {sup['email']:<35} Level: {exp_level:<6} Team: {sup.get('team_size', 0):>2} [{status}]")
    
    print("\nSafety Officers (5 total):")
    for safety in seed_data.get("safety_db", []):
        status = "ACTIVE" if safety.get("is_active") else "INACTIVE"
        risk_status = safety.get("status", "N/A")
        print(f"  - {safety['email']:<35} Status: {risk_status:<12} Risk: {safety.get('risk_score', 0):>3} [{status}]")
    
    print("\n" + "=" * 70 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Seed Admin, Supervisor, and Safety databases")
    parser.add_argument("--clear", action="store_true", help="Clear existing data before seeding")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose logging")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done without actually doing it")
    args = parser.parse_args()
    
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    
    try:
        # Get database URL
        db_url = get_database_url()
        logger.info(f"Connecting to database: {db_url.split('@')[1]}")
        
        # Create engine
        engine = create_engine(db_url)
        
        # Test connection
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("✓ Database connection successful")
        except Exception as e:
            logger.error(f"✗ Failed to connect to database: {e}")
            logger.error("Make sure PostgreSQL is running and credentials are correct")
            logger.error("Environment variables: DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME")
            sys.exit(1)
        
        if args.dry_run:
            logger.info("DRY RUN MODE - No changes will be made")
        
        # Load seed data
        logger.info("Loading seed data...")
        seed_data = load_seed_data()
        logger.info(f"✓ Loaded {sum(len(r) for r in seed_data.values())} seed records")
        
        # Run migrations
        migration_file = project_root / "migrations" / "001_create_admin_supervisor_safety_tables.sql"
        if migration_file.exists():
            logger.info(f"\nRunning migration: {migration_file.name}")
            if not args.dry_run:
                execute_migration(engine, str(migration_file))
        else:
            logger.warning(f"Migration file not found: {migration_file}")
        
        # Clear existing data if requested
        if args.clear:
            logger.info("\nClearing existing seed data...")
            if not args.dry_run:
                clear_seed_data(engine)
        
        # Insert seed data
        logger.info("\nInserting seed data...")
        if not args.dry_run:
            stats = insert_seed_data(engine, seed_data)
        else:
            stats = {
                "inserted": sum(len(r) for r in seed_data.values()),
                "failed": 0,
            }
        
        # Print summary
        print_summary(seed_data, stats)
        
        if args.dry_run:
            logger.info("Dry run completed - no changes were made")
        
        return 0 if stats["failed"] == 0 else 1
        
    except KeyboardInterrupt:
        logger.info("\n✓ Seed operation cancelled by user")
        return 1
    except Exception as e:
        logger.error(f"\n✗ Seed operation failed: {e}")
        import traceback
        if args.verbose:
            traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
