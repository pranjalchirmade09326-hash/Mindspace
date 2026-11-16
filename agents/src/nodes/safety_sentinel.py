import re
from typing import Dict, Any
from src.state import MindSpaceAgentState

CRISIS_PATTERNS = [
    r"\bsuicide\b", r"\bkill myself\b", r"\bend my life\b",
    r"\bwant to die\b", r"\bhang myself\b", r"\boverdose\b", r"\bself[- ]harm\b"
]

def safety_sentinel_node(state: MindSpaceAgentState) -> Dict[str, Any]:
    messages = state.get("messages", [])
    if not messages:
        return {"is_crisis": False}
        
    last_text = messages[-1].get("content", "").lower()
    
    for pattern in CRISIS_PATTERNS:
        if re.search(pattern, last_text):
            return {
                "is_crisis": True,
                "messages": [{
                    "role": "assistant",
                    "content": "🚨 Immediate Support is Available (24/7 & Confidential)\n• Tele-MANAS: Call 14416\n• Emergency: Dial 112 or 988"
                }],
                "next_node": "END"
            }
    return {"is_crisis": False}