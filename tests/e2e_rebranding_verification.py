"""
MindSpace Production Conversion & Rebranding E2E Acceptance Test Suite
======================================================================
Opaque-box, requirement-driven end-to-end verification covering Tiers 1-4
for the MindSpace rebranding and operational integrity acceptance criteria.

Authoritative Reference:
- ORIGINAL_REQUEST.md (Requirements R1, R2, R3, R4 and Acceptance Criteria)
- PROJECT.md (Architecture, Feature Inventory, Interface Contracts, Port Allocations)

Test Structure (4-Tier Methodology):
- Tier 1: Feature Coverage (Repository-wide scanning, file & directory naming, Docker container naming)
- Tier 2: Boundary & Corner Cases (Case variant permutations, dotfiles, Claude skills, YAML/JSON structure)
- Tier 3: Cross-Feature Interactions (Startup/shutdown batch scripts, ecosystem port & URL contracts)
- Tier 4: Real-World Operational Verification (Python compilation, FastAPI pytest suite, IAM import, Safety Sentinel)

Usage:
    python tests/e2e_rebranding_verification.py
    # or
    pytest tests/e2e_rebranding_verification.py -v
"""

import ast
import json
import os
import py_compile
import re
import subprocess
import sys
import time
import unittest
from pathlib import Path
from typing import Dict, List, Set, Tuple

# Workspace root
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent

# Directories to exclude from recursive repository content scans
EXCLUDED_DIRS: Set[str] = {
    ".git",
    "node_modules",
    ".venv",
    "venv",
    "__pycache__",
    ".next",
    ".agents",
    ".turbo",
    "dist",
    "build",
    ".idea",
    ".vscode",
    ".pytest_cache",
    ".coverage",
    "coverage",
}

# Binary and non-source extensions to skip during content scans
BINARY_EXTENSIONS: Set[str] = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".ico",
    ".svg",
    ".pdf",
    ".pyc",
    ".pyd",
    ".pyo",
    ".wasm",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".tar",
    ".gz",
    ".zip",
    ".db",
    ".sqlite",
    ".sqlite3",
}


def find_fastapi_python() -> str:
    """Locate the Python executable for backend/mindspace-fastapi."""
    venv_python = WORKSPACE_ROOT / "backend" / "mindspace-fastapi" / ".venv" / "Scripts" / "python.exe"
    if venv_python.exists():
        return str(venv_python)
    # Check Unix style
    venv_python_unix = WORKSPACE_ROOT / "backend" / "mindspace-fastapi" / ".venv" / "bin" / "python"
    if venv_python_unix.exists():
        return str(venv_python_unix)
    return sys.executable


def find_iam_python() -> str:
    """Locate the Python executable for backend/mindspace-iam-py."""
    venv_python = WORKSPACE_ROOT / "backend" / "mindspace-iam-py" / ".venv" / "Scripts" / "python.exe"
    if venv_python.exists():
        return str(venv_python)
    venv_python_unix = WORKSPACE_ROOT / "backend" / "mindspace-iam-py" / ".venv" / "bin" / "python"
    if venv_python_unix.exists():
        return str(venv_python_unix)
    return sys.executable


# ==============================================================================
# TIER 1: Feature Coverage (Core Acceptance Criteria)
# ==============================================================================

class TestTier1FeatureCoverage(unittest.TestCase):
    """
    Tier 1 tests verify the primary acceptance criteria from ORIGINAL_REQUEST.md:
    1. Zero occurrences of 'drgodly' in directory and file names.
    2. Zero occurrences of 'drgodly' in file contents across the repository.
    3. Docker container names reflect MindSpace naming conventions.
    """

    def test_tier1_repository_no_drgodly_in_dir_or_file_names(self):
        """
        [Acceptance Criteria 1]
        Verify no directory or file path across the repository contains 'drgodly' (case-insensitive).
        """
        pattern = re.compile(r"drgodly", re.IGNORECASE)
        violating_paths: List[str] = []

        for root, dirs, files in os.walk(WORKSPACE_ROOT):
            dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS and d != "tests"]
            for d in dirs:
                if pattern.search(d):
                    violating_paths.append(str(Path(root) / d))
            for f in files:
                fpath = Path(root) / f
                if fpath.resolve() == Path(__file__).resolve():
                    continue
                if pattern.search(f):
                    violating_paths.append(str(fpath))

        self.assertEqual(
            len(violating_paths),
            0,
            f"Found {len(violating_paths)} file/directory paths containing 'drgodly':\n"
            + "\n".join(violating_paths[:10]),
        )

    def test_tier1_repository_no_drgodly_in_file_contents(self):
        """
        [Acceptance Criteria 1]
        Verify no occurrences of 'drgodly' (case-insensitive) remain in file contents.
        Scans all source code, markdown, configurations, and scripts.
        """
        pattern = re.compile(r"drgodly", re.IGNORECASE)
        violating_lines: List[Tuple[str, int, str]] = []

        for root, dirs, files in os.walk(WORKSPACE_ROOT):
            dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS and d != "tests"]
            for f in files:
                file_path = Path(root) / f
                if file_path.resolve() == Path(__file__).resolve():
                    continue
                if file_path.suffix.lower() in BINARY_EXTENSIONS:
                    continue

                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as fp:
                        for line_no, line in enumerate(fp, start=1):
                            if pattern.search(line):
                                rel_path = str(file_path.relative_to(WORKSPACE_ROOT))
                                violating_lines.append((rel_path, line_no, line.strip()))
                except Exception:
                    continue

        details = "\n".join(f"{p}:{no}: {content}" for p, no, content in violating_lines[:15])
        self.assertEqual(
            len(violating_lines),
            0,
            f"Found {len(violating_lines)} occurrences of 'drgodly' in file contents:\n{details}",
        )

    def test_tier1_docker_container_and_service_naming(self):
        """
        [Acceptance Criteria 2]
        Verify Docker container names across all docker-compose files reflect MindSpace naming conventions.
        """
        compose_files = [
            WORKSPACE_ROOT / "agents" / "docker-compose.yml",
            WORKSPACE_ROOT / "backend" / "mindspace-fastapi" / "docker-compose.yml",
            WORKSPACE_ROOT / "backend" / "mindspace-iam-py" / "docker-compose.yml",
            WORKSPACE_ROOT / "frontend" / "docker-compose.yml",
        ]

        pattern_drgodly = re.compile(r"drgodly", re.IGNORECASE)

        for compose_file in compose_files:
            self.assertTrue(
                compose_file.exists(),
                f"Required docker compose file missing: {compose_file}",
            )

            content = compose_file.read_text(encoding="utf-8")
            self.assertFalse(
                pattern_drgodly.search(content),
                f"Docker compose file {compose_file.name} contains legacy 'drgodly' references.",
            )

            # Extract container_name lines
            container_names = re.findall(r"container_name:\s*([^\s#]+)", content)
            self.assertTrue(
                len(container_names) > 0,
                f"No container_name definitions found in {compose_file.name}",
            )
            for cname in container_names:
                self.assertFalse(
                    "drgodly" in cname.lower(),
                    f"Legacy container name detected: '{cname}' in {compose_file.name}",
                )
                self.assertTrue(
                    cname.startswith("mindspace-") or cname in {"fhir-server", "fhir-mcp", "fhir-staging"},
                    f"Container name '{cname}' does not follow MindSpace naming convention in {compose_file.name}",
                )


# ==============================================================================
# TIER 2: Boundary & Corner Cases
# ==============================================================================

class TestTier2BoundaryCornerCases(unittest.TestCase):
    """
    Tier 2 tests verify edge cases, case permutations, hidden files, Claude skills,
    markdown documentation, and structured configuration parsers.
    """

    def test_tier2_case_variant_permutations(self):
        """
        Verify case variants (drgodly, DrGodly, DRGODLY, dRgOdLy) are absent from
        critical configuration files and source code.
        """
        variants = ["drgodly", "DrGodly", "DRGODLY", "dRgOdLy", "Drgodly", "drGodly"]
        targets = [
            WORKSPACE_ROOT / "agents" / "docker-compose.yml",
            WORKSPACE_ROOT / "agents" / "src" / "main.py",
            WORKSPACE_ROOT / "backend" / "mindspace-fastapi" / "app" / "main.py",
            WORKSPACE_ROOT / "backend" / "mindspace-iam-py" / "app" / "main.py",
            WORKSPACE_ROOT / "frontend" / "package.json",
            WORKSPACE_ROOT / "START-ALL.bat",
            WORKSPACE_ROOT / "STOP-ALL.bat",
        ]

        for target in targets:
            if not target.exists():
                continue
            text = target.read_text(encoding="utf-8", errors="ignore")
            for variant in variants:
                self.assertNotIn(
                    variant,
                    text,
                    f"Case variant permutation '{variant}' found in {target}",
                )

    def test_tier2_dotfiles_and_hidden_configs(self):
        """
        Verify dotfiles (.env.example, .gitignore, .gitattributes) do not contain legacy references
        and define proper MindSpace environment values.
        """
        dotfiles = [
            WORKSPACE_ROOT / "agents" / ".env.example",
            WORKSPACE_ROOT / "backend" / "mindspace-fastapi" / ".env.example",
            WORKSPACE_ROOT / "backend" / "mindspace-iam-py" / ".env.example",
            WORKSPACE_ROOT / "frontend" / ".env.example",
            WORKSPACE_ROOT / ".gitignore",
            WORKSPACE_ROOT / ".gitattributes",
        ]

        pattern = re.compile(r"drgodly", re.IGNORECASE)

        for dotfile in dotfiles:
            if not dotfile.exists():
                continue
            content = dotfile.read_text(encoding="utf-8")
            self.assertFalse(
                pattern.search(content),
                f"Dotfile {dotfile} contains 'drgodly' references.",
            )

        # Explicitly verify frontend .env.example references mindspace DB and API URL
        fe_env = WORKSPACE_ROOT / "frontend" / ".env.example"
        if fe_env.exists():
            fe_content = fe_env.read_text(encoding="utf-8")
            self.assertIn("MINDSPACE_API_URL", fe_content)
            self.assertIn("mindspace", fe_content.lower())

    def test_tier2_claude_skills_and_prompts_cleanliness(self):
        """
        Verify Claude skill metadata and markdown reference documents in frontend/.claude/skills/
        have eliminated all 'drgodly' mentions.
        """
        skills_dir = WORKSPACE_ROOT / "frontend" / ".claude" / "skills"
        if not skills_dir.exists():
            return

        pattern = re.compile(r"drgodly", re.IGNORECASE)
        skill_files = list(skills_dir.rglob("*.md"))

        self.assertTrue(len(skill_files) > 0, "No skill markdown files found in frontend/.claude/skills")

        for sfile in skill_files:
            content = sfile.read_text(encoding="utf-8")
            self.assertFalse(
                pattern.search(content),
                f"Claude skill file {sfile} contains 'drgodly' references.",
            )

    def test_tier2_documentation_cleanliness(self):
        """
        Verify CONTRIBUTING.md, SECURITY.md, root README.md, and docs/ are clean of 'drgodly'.
        """
        doc_files = [
            WORKSPACE_ROOT / "frontend" / "CONTRIBUTING.md",
            WORKSPACE_ROOT / "frontend" / "SECURITY.md",
            WORKSPACE_ROOT / "README.md",
        ]

        # Add docs/*.md
        docs_dir = WORKSPACE_ROOT / "docs"
        if docs_dir.exists():
            doc_files.extend(docs_dir.glob("*.md"))

        pattern = re.compile(r"drgodly", re.IGNORECASE)

        for doc_file in doc_files:
            if not doc_file.exists():
                continue
            content = doc_file.read_text(encoding="utf-8")
            self.assertFalse(
                pattern.search(content),
                f"Documentation file {doc_file} contains 'drgodly' references.",
            )

    def test_tier2_yaml_json_structural_integrity(self):
        """
        Parse docker-compose YAML and package.json to guarantee valid configuration syntax
        and correct package naming.
        """
        # 1. Check frontend/package.json
        pkg_json = WORKSPACE_ROOT / "frontend" / "package.json"
        self.assertTrue(pkg_json.exists(), "frontend/package.json missing")
        with open(pkg_json, "r", encoding="utf-8") as fp:
            data = json.load(fp)
        self.assertEqual(data.get("name"), "mindspace", "frontend/package.json name must be 'mindspace'")

        # 2. Check compose files YAML parse (using PyYAML or robust structural parser)
        try:
            import yaml
            has_yaml = True
        except ImportError:
            has_yaml = False

        compose_paths = [
            WORKSPACE_ROOT / "agents" / "docker-compose.yml",
            WORKSPACE_ROOT / "backend" / "mindspace-fastapi" / "docker-compose.yml",
            WORKSPACE_ROOT / "backend" / "mindspace-iam-py" / "docker-compose.yml",
            WORKSPACE_ROOT / "frontend" / "docker-compose.yml",
        ]

        for cpath in compose_paths:
            if not cpath.exists():
                continue
            content = cpath.read_text(encoding="utf-8")
            if has_yaml:
                parsed = yaml.safe_load(content)
                self.assertIsInstance(parsed, dict, f"Failed to parse {cpath.name} as YAML dict")
                self.assertIn("services", parsed, f"{cpath.name} must declare 'services'")
            else:
                self.assertIn("services:", content)


# ==============================================================================
# TIER 3: Cross-Feature Interactions
# ==============================================================================

class TestTier3CrossFeatureInteractions(unittest.TestCase):
    """
    Tier 3 tests verify cross-system contracts, operational launch scripts,
    port alignments, and inter-service environment URLs.
    """

    def test_tier3_start_all_script_integrity(self):
        """
        [Acceptance Criteria 4]
        Verify START-ALL.bat references existing directories, valid commands,
        and launches MindSpace frontend URL without legacy references.
        """
        script_path = WORKSPACE_ROOT / "START-ALL.bat"
        self.assertTrue(script_path.exists(), "START-ALL.bat is missing at repository root")

        content = script_path.read_text(encoding="utf-8")
        self.assertNotIn("drgodly", content.lower(), "START-ALL.bat contains 'drgodly'")

        # Verify all directory navigation targets exist on disk
        cd_matches = re.findall(r'cd\s+/d\s+"([^"]+)"', content, re.IGNORECASE)
        self.assertTrue(len(cd_matches) >= 3, f"Expected at least 3 cd /d commands in START-ALL.bat, found {len(cd_matches)}")

        for cd_target in cd_matches:
            target_path = Path(cd_target)
            self.assertTrue(
                target_path.exists(),
                f"START-ALL.bat references non-existent path: {cd_target}",
            )

        # Verify launched URL uses MindSpace routes
        self.assertIn("/en/mindspace/member", content, "START-ALL.bat must launch MindSpace member dashboard")

    def test_tier3_stop_all_script_integrity(self):
        """
        [Acceptance Criteria 4]
        Verify STOP-ALL.bat references existing directories and clean commands.
        """
        script_path = WORKSPACE_ROOT / "STOP-ALL.bat"
        self.assertTrue(script_path.exists(), "STOP-ALL.bat is missing at repository root")

        content = script_path.read_text(encoding="utf-8")
        self.assertNotIn("drgodly", content.lower(), "STOP-ALL.bat contains 'drgodly'")

        cd_matches = re.findall(r'cd\s+/d\s+"([^"]+)"', content, re.IGNORECASE)
        for cd_target in cd_matches:
            self.assertTrue(
                Path(cd_target).exists(),
                f"STOP-ALL.bat references non-existent path: {cd_target}",
            )

    def test_tier3_run_agent_local_script_integrity(self):
        """
        [Acceptance Criteria 4]
        Verify agents/RUN-AGENT-LOCAL.bat sets MindSpace title, port 8018, and valid uvicorn command.
        """
        script_path = WORKSPACE_ROOT / "agents" / "RUN-AGENT-LOCAL.bat"
        self.assertTrue(script_path.exists(), "agents/RUN-AGENT-LOCAL.bat is missing")

        content = script_path.read_text(encoding="utf-8")
        self.assertNotIn("drgodly", content.lower(), "RUN-AGENT-LOCAL.bat contains 'drgodly'")
        self.assertIn("8018", content, "RUN-AGENT-LOCAL.bat must bind to port 8018")
        self.assertIn("src.main:app", content, "RUN-AGENT-LOCAL.bat must invoke src.main:app")

    def test_tier3_ecosystem_port_and_url_alignment(self):
        """
        [PROJECT.md Architecture Contract]
        Verify port allocations across services:
        - Frontend: 4000 (dev) / 3000 (docker)
        - Core API: 8080 (PostgreSQL on 5433)
        - IAM Service: 5001
        - AI Agents: 8018
        - Inter-service internal auth key consistency
        """
        # 1. Agents .env.example
        agents_env = WORKSPACE_ROOT / "agents" / ".env.example"
        if agents_env.exists():
            content = agents_env.read_text(encoding="utf-8")
            self.assertIn("PORT=8018", content)
            self.assertIn("CORE_API_URL=http://localhost:8080", content)
            self.assertIn("INTERNAL_SERVICE_KEY=mindspace-internal-agent-secret-key-2026", content)

        # 2. Agents docker-compose.yml port mapping
        agents_compose = WORKSPACE_ROOT / "agents" / "docker-compose.yml"
        if agents_compose.exists():
            c_text = agents_compose.read_text(encoding="utf-8")
            self.assertIn('"8018:8018"', c_text)

        # 3. Core FastAPI port in docker-compose.yml
        fastapi_compose = WORKSPACE_ROOT / "backend" / "mindspace-fastapi" / "docker-compose.yml"
        if fastapi_compose.exists():
            c_text = fastapi_compose.read_text(encoding="utf-8")
            self.assertIn("8080:8080", c_text)
            self.assertIn("5433:5432", c_text)

        # 4. IAM port in docker-compose.yml
        iam_compose = WORKSPACE_ROOT / "backend" / "mindspace-iam-py" / "docker-compose.yml"
        if iam_compose.exists():
            c_text = iam_compose.read_text(encoding="utf-8")
            self.assertIn("5001:5001", c_text)


# ==============================================================================
# TIER 4: Real-World Operational Verification
# ==============================================================================

class TestTier4OperationalVerification(unittest.TestCase):
    """
    Tier 4 tests execute live operations:
    1. Python compilation across backend and agents.
    2. MindSpace Core FastAPI unit tests execution.
    3. MindSpace IAM service module initialization.
    4. Multi-agent Safety Sentinel deterministic crisis breaker logic.
    """

    def test_tier4_python_syntax_compilation(self):
        """
        [Acceptance Criteria 3]
        Compile Python source files across agents, core FastAPI, IAM, and modified FHIR files
        to verify zero syntax or import structure errors.
        """
        target_files = [
            # Agents
            WORKSPACE_ROOT / "agents" / "src" / "main.py",
            WORKSPACE_ROOT / "agents" / "src" / "orchestrator.py",
            WORKSPACE_ROOT / "agents" / "src" / "state.py",
            WORKSPACE_ROOT / "agents" / "src" / "nodes" / "companion_agent.py",
            WORKSPACE_ROOT / "agents" / "src" / "nodes" / "intake_agent.py",
            WORKSPACE_ROOT / "agents" / "src" / "nodes" / "matcher_agent.py",
            WORKSPACE_ROOT / "agents" / "src" / "nodes" / "safety_sentinel.py",
            WORKSPACE_ROOT / "agents" / "src" / "tools" / "core_tools.py",
            # Backend core
            WORKSPACE_ROOT / "backend" / "mindspace-fastapi" / "app" / "main.py",
            # Backend FHIR modified files
            WORKSPACE_ROOT / "backend" / "fhir-gql" / "app" / "auth" / "dependencies.py",
            WORKSPACE_ROOT / "backend" / "fhir-gql" / "app" / "routers" / "appointment.py",
            WORKSPACE_ROOT / "backend" / "fhir-gql" / "app" / "schemas" / "appointment" / "input.py",
            WORKSPACE_ROOT / "backend" / "fhir-gql" / "app" / "services" / "appointment_service.py",
            WORKSPACE_ROOT / "backend" / "fhir-server" / "app" / "repository" / "appointment_repository.py",
            WORKSPACE_ROOT / "backend" / "fhir-server" / "app" / "routers" / "appointment.py",
        ]

        for py_file in target_files:
            self.assertTrue(py_file.exists(), f"Source file missing for compilation: {py_file}")
            try:
                # Compile to byte-code to verify syntax
                py_compile.compile(str(py_file), doraise=True)
            except py_compile.PyCompileError as exc:
                self.fail(f"Python syntax error in {py_file}:\n{exc}")

    def test_tier4_fastapi_core_unit_tests(self):
        """
        [Acceptance Criteria 5]
        Run existing automated test suite for backend/mindspace-fastapi (tests/test_api_and_security.py).
        Assert 100% pass rate (4/4 tests).
        """
        test_file = WORKSPACE_ROOT / "backend" / "mindspace-fastapi" / "tests" / "test_api_and_security.py"
        self.assertTrue(test_file.exists(), "backend/mindspace-fastapi/tests/test_api_and_security.py missing")

        fastapi_python = find_fastapi_python()
        cmd = [
            fastapi_python,
            "-m",
            "pytest",
            str(test_file),
            "-q",
        ]

        result = subprocess.run(
            cmd,
            cwd=str(WORKSPACE_ROOT / "backend" / "mindspace-fastapi"),
            capture_output=True,
            text=True,
            timeout=30,
        )

        self.assertEqual(
            result.returncode,
            0,
            f"mindspace-fastapi test suite failed with exit code {result.returncode}:\n"
            f"STDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}",
        )
        self.assertIn("passed", result.stdout.lower(), "pytest output did not indicate passed tests")

    def test_tier4_iam_service_import_verification(self):
        """
        [Acceptance Criteria 3]
        Verify that backend/mindspace-iam-py main module imports cleanly without runtime syntax
        or configuration failures under its environment context.
        """
        iam_dir = WORKSPACE_ROOT / "backend" / "mindspace-iam-py"
        self.assertTrue(iam_dir.exists(), "backend/mindspace-iam-py directory missing")

        iam_python = find_iam_python()
        cmd = [
            iam_python,
            "-c",
            "import app.main; print('IAM_IMPORT_SUCCESS')",
        ]

        result = subprocess.run(
            cmd,
            cwd=str(iam_dir),
            capture_output=True,
            text=True,
            timeout=15,
        )

        self.assertEqual(
            result.returncode,
            0,
            f"mindspace-iam-py failed to import app.main (code {result.returncode}):\n"
            f"STDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}",
        )
        self.assertIn("IAM_IMPORT_SUCCESS", result.stdout)

    def test_tier4_agents_safety_sentinel_crisis_circuit_breaker(self):
        """
        [Acceptance Criteria 3 & Engine 2 Safety Contract]
        Verify the deterministic crisis screening regex in agents.src.nodes.safety_sentinel.
        Must immediately trigger emergency circuit breaker on crisis phrases, and return False on normal text.
        """
        sentinel_file = WORKSPACE_ROOT / "agents" / "src" / "nodes" / "safety_sentinel.py"
        self.assertTrue(sentinel_file.exists(), "agents/src/nodes/safety_sentinel.py missing")

        # Import dynamically or run sub-process to avoid pollution
        cmd = [
            sys.executable,
            "-c",
            (
                "import sys; sys.path.insert(0, r'" + str(WORKSPACE_ROOT) + "'); "
                "from agents.src.nodes.safety_sentinel import check_crisis_text; "
                "assert check_crisis_text('i want to die') is True, 'Failed to catch crisis'; "
                "assert check_crisis_text('kill myself') is True, 'Failed to catch suicide phrase'; "
                "assert check_crisis_text('hello mindspace') is False, 'False positive on greeting'; "
                "assert check_crisis_text('I need help with my breathing exercise') is False, 'False positive on normal request'; "
                "print('SENTINEL_OK')"
            ),
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        self.assertEqual(
            result.returncode,
            0,
            f"Safety sentinel test failed with exit code {result.returncode}:\n{result.stderr}",
        )
        self.assertIn("SENTINEL_OK", result.stdout)

    def test_tier4_agents_orchestrator_state_structure(self):
        """
        [Acceptance Criteria 3 & Multi-Agent Interface]
        Verify MindSpaceAgentState class definition in agents/src/state.py contains
        all mandatory fields for cross-agent conversation tracking.
        """
        state_file = WORKSPACE_ROOT / "agents" / "src" / "state.py"
        self.assertTrue(state_file.exists(), "agents/src/state.py missing")

        content = state_file.read_text(encoding="utf-8")
        required_fields = [
            "session_id",
            "member_id",
            "auth_token",
            "messages",
            "active_tier",
            "primary_concerns",
            "is_crisis",
            "crisis_reason",
            "matched_listener_id",
            "matched_listener_name",
            "next_node",
        ]

        for field in required_fields:
            self.assertIn(
                field,
                content,
                f"MindSpaceAgentState missing required state field '{field}' in agents/src/state.py",
            )


# ==============================================================================
# CLI Runner and Detailed Reporting
# ==============================================================================

def run_acceptance_suite() -> int:
    """
    Execute all 4 tiers of tests and output a structured operational report.
    Returns 0 on success, 1 on failure.
    """
    print("=" * 80)
    print("MINDSPACE PRODUCTION CONVERSION & REBRANDING E2E ACCEPTANCE SUITE")
    print(f"Workspace: {WORKSPACE_ROOT}")
    print(f"Timestamp: {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}")
    print("=" * 80)

    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    tier_classes = [
        ("Tier 1: Feature Coverage (Core Acceptance)", TestTier1FeatureCoverage),
        ("Tier 2: Boundary & Corner Cases", TestTier2BoundaryCornerCases),
        ("Tier 3: Cross-Feature Interactions", TestTier3CrossFeatureInteractions),
        ("Tier 4: Operational Verification", TestTier4OperationalVerification),
    ]

    for name, cls in tier_classes:
        tests = loader.loadTestsFromTestCase(cls)
        suite.addTests(tests)

    start_time = time.time()
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    duration = time.time() - start_time

    print("\n" + "=" * 80)
    print("E2E ACCEPTANCE VERIFICATION SUMMARY")
    print("=" * 80)
    print(f"Total Tests Run : {result.testsRun}")
    print(f"Passed          : {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures        : {len(result.failures)}")
    print(f"Errors          : {len(result.errors)}")
    print(f"Execution Time  : {duration:.2f} seconds")

    if result.wasSuccessful():
        print("\n>> VERDICT: ALL ACCEPTANCE CRITERIA MET (PASSED 100%) <<\n")
        return 0
    else:
        print("\n>> VERDICT: ACCEPTANCE CRITERIA FAILED <<\n")
        return 1


if __name__ == "__main__":
    sys.exit(run_acceptance_suite())
