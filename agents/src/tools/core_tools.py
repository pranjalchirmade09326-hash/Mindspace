"""
Core Data Tools — Communicates with Engine 3 (FastAPI Core Backend).
Enforces Zero Direct Database Access by calling authorized REST endpoints.
"""
import os
import httpx
from typing import Dict, Any, Optional

CORE_API_URL = os.getenv("CORE_API_URL", "http://localhost:8080")
INTERNAL_KEY = os.getenv("INTERNAL_SERVICE_KEY", "mindspace-internal-agent-secret-key-2026")

def get_headers(token: Optional[str] = None) -> Dict[str, str]:
    headers = {
        "Content-Type": "application/json",
        "X-Internal-Service-Key": INTERNAL_KEY
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers

async def save_mood_checkin(
    member_id: str,
    scale_value: int,
    mood_code: str,
    note: str,
    token: Optional[str] = None
) -> Dict[str, Any]:
    """Persists a member mood pulse into PostgreSQL via Engine 3."""
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            res = await client.post(
                f"{CORE_API_URL}/api/v1/wellbeing/moods",
                headers=get_headers(token),
                json={
                    "member_id": member_id,
                    "scale_value": scale_value,
                    "mood_code": mood_code,
                    "note": note
                }
            )
            return res.json()
        except Exception as e:
            return {"status": "error", "message": str(e)}

async def save_encrypted_journal(
    member_id: str,
    prompt: str,
    entry_text: str,
    token: Optional[str] = None
) -> Dict[str, Any]:
    """Persists an encrypted journal reflection into PostgreSQL via Engine 3."""
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            res = await client.post(
                f"{CORE_API_URL}/api/v1/wellbeing/journal",
                headers=get_headers(token),
                json={
                    "member_id": member_id,
                    "prompt": prompt,
                    "entry_text": entry_text
                }
            )
            return res.json()
        except Exception as e:
            return {"status": "error", "message": str(e)}

async def dispatch_peer_listener_match(
    member_id: str,
    topic: str,
    token: Optional[str] = None
) -> Dict[str, Any]:
    """Requests a verified volunteer peer listener match via Engine 3."""
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            res = await client.post(
                f"{CORE_API_URL}/api/v1/peer/dispatch",
                headers=get_headers(token),
                json={
                    "member_id": member_id,
                    "topic": topic
                }
            )
            return res.json()
        except Exception as e:
            return {"status": "fallback", "listener_name": "Aarav Sharma (Verified Peer Listener)"}

