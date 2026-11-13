"""
MindSpace Agent Service Entrypoint (Port :8018).
Exposes HTTP and Server-Sent Events (SSE) endpoints for Next.js frontend consumption.
"""
import os
import sys
from pathlib import Path

# Add project root to sys.path so both 'src' and 'agents' imports resolve
current_dir = Path(__file__).resolve().parent
agents_root = current_dir.parent
sys.path.insert(0, str(agents_root))

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables from agents/.env
load_dotenv(agents_root / ".env")

try:
    from src.orchestrator import orchestrator_app
except ImportError:
    from agents.src.orchestrator import orchestrator_app

app = FastAPI(
    title="MindSpace Multi-Agent Service",
    description="Engine 2: Multi-Agent Intelligence and Triage Service",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    session_id: str
    member_id: str
    messages: List[Dict[str, Any]]
    active_tier: Optional[int] = 1

@app.get("/health")
def health_check():
    """Service health verification endpoint."""
    return {
        "status": "healthy",
        "service": "MindSpace Multi-Agent Engine",
        "port": 8018
    }

@app.post("/api/v1/chat")
async def chat_endpoint(req: ChatRequest, authorization: Optional[str] = Header(None)):
    """Primary chat endpoint executing the LangGraph multi-agent cycle."""
    token = authorization.replace("Bearer ", "") if authorization else None
    
    initial_state = {
        "session_id": req.session_id,
        "member_id": req.member_id,
        "auth_token": token,
        "messages": req.messages,
        "active_tier": req.active_tier or 1,
        "is_crisis": False,
        "crisis_reason": None,
        "primary_concerns": [],
        "matched_listener_id": None,
        "matched_listener_name": None,
        "next_node": ""
    }
    
    # Execute the Multi-Agent State Machine
    final_state = orchestrator_app.invoke(initial_state)
    latest_reply = final_state["messages"][-1]
    
    return {
        "session_id": req.session_id,
        "reply": latest_reply,
        "is_crisis": final_state.get("is_crisis", False),
        "matched_listener": final_state.get("matched_listener_name")
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8018))
    uvicorn.run("src.main:app", host="0.0.0.0", port=port, reload=True)

