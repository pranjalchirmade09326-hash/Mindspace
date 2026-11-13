"""
Safety Sentinel — Deterministic Non-LLM Crisis Interceptor.
Executes in <2ms before any probabilistic LLM inference.
"""
import re
from typing import Dict, Any

try:
    from src.state import MindSpaceAgentState
except ImportError:
    from agents.src.state import MindSpaceAgentState

# Deterministic regex patterns for acute crisis detection
CRISIS_PATTERNS = [
    r"\bsuicide\b",
    r"\bkill myself\b",
    r"\bend my life\b",
    r"\bwant to die\b",
    r"\bhang myself\b",
    r"\boverdose\b",
    r"\bself[- ]harm\b",
    r"\bcut myself\b",
    r"\bpoison myself\b",
    r"\bbetter off dead\b",
]

def check_crisis_text(text: str) -> bool:
    """Scans text against compiled crisis patterns."""
    normalized = text.lower()
    for pattern in CRISIS_PATTERNS:
        if re.search(pattern, normalized):
            return True
    return False

def safety_sentinel_node(state: MindSpaceAgentState) -> Dict[str, Any]:
    """Inspects the latest user message. Trips the circuit breaker if high risk."""
    messages = state.get("messages", [])
    if not messages:
        return {"is_crisis": False}
        
    last_msg = messages[-1].get("content", "")
    
    if check_crisis_text(last_msg):
        crisis_response = {
            "role": "assistant",
            "content": (
                "🚨 **Immediate Support is Available (24/7 & Confidential)**\n\n"
                "I hear how much pain you are experiencing right now, but please know you do not have to carry this alone.\n\n"
                "• **Tele-MANAS (India Govt Helpline)**: Call **14416** or **1800-891-4416** (Toll-Free, Multi-lingual)\n"
                "• **Vandrevala Foundation**: **+91 9999 666 555**\n"
                "• **Emergency Services**: Dial **112** (India) or **988** (US/Canada)\n\n"
                "Trained human professionals are available right now. Please connect with them immediately."
            ),
            "is_emergency": True
        }
        return {
            "is_crisis": True,
            "crisis_reason": "High-risk crisis pattern detected in input.",
            "messages": [crisis_response],
            "next_node": "END"
        }
        
    return {"is_crisis": False}

