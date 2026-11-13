from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db

router = APIRouter(tags=["Health"])

@router.get("/")
async def root():
    return {
        "status": "ok",
        "service": "mindspace-fastapi",
        "message": "MindSpace Core FastAPI Engine is running",
        "runtime": "Python FastAPI",
        "docs": "/docs",
        "api_docs": "/api-docs",
    }

@router.get("/health")
@router.get("/health/live")
async def health_live():
    return {"status": "ok", "service": "mindspace-fastapi"}

@router.get("/health/ready")
@router.get("/health/db")
async def health_db(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "service": "mindspace-postgres",
            "message": "PostgreSQL Database is running and connected",
            "port": 5433,
        }
    except Exception as e:
        return {"status": "degraded", "service": "mindspace-postgres", "error": str(e)}
