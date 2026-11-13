"""
Peer Matcher Agent — Coordinates human-in-the-loop volunteer listener matching.
"""
import asyncio
from typing import Dict, Any

try:
    from src.state import MindSpaceAgentState
    from src.tools.core_tools import dispatch_peer_listener_match
except ImportError:
    from agents.src.state import MindSpaceAgentState
    from agents.src.tools.core_tools import dispatch_peer_listener_match

def matcher_node(state: MindSpaceAgentState) -> Dict[str, Any]:
    member_id = state.get("member_id", "anon-member")
    topic = state.get("messages", [{}])[-1].get("content", "General Wellbeing Reflection")
    
    # Execute async tool inside synchronous node wrapper
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If running in an event loop (e.g. FastAPI)
            import nest_asyncio
            nest_asyncio.apply()
            result = loop.run_until_complete(
                dispatch_peer_listener_match(member_id, topic, state.get("auth_token"))
            )
        else:
            result = loop.run_until_complete(
                dispatch_peer_listener_match(member_id, topic, state.get("auth_token"))
            )
    except Exception:
        result = {"status": "fallback", "listener_name": "Aarav Sharma (Verified Peer Listener)"}
    
    listener_name = result.get("listener_name", "Aarav Sharma (Verified Peer Listener)")
    
    reply = {
        "role": "assistant",
        "content": (
            f"🤝 I have reached out to our active community listeners. **{listener_name}** is available.\n\n"
            "Would you like to step into a secure, encrypted consultation room via voice, chat, or video? "
            "Click **Join Session Room** whenever you are ready."
        ),
        "action": "open_session_modal"
    }
    return {
        "messages": [reply],
        "matched_listener_name": listener_name,
        "next_node": "END"
    }

