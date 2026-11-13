"""
MindSpace Multi-Agent State Definition.
Maintains contextual data, chat message history, care tiers, and safety flags across nodes.
"""
from typing import TypedDict, Annotated, List, Optional, Dict, Any
import operator

class MindSpaceAgentState(TypedDict):
    # Session tracking
    session_id: str
    member_id: str
    auth_token: Optional[str]
    
    # Message stream (appends new messages automatically using operator.add)
    messages: Annotated[List[Dict[str, Any]], operator.add]
    
    # Stepped-Care Tier: 1 = Self-Help, 2 = Peer Listener, 3 = Clinical Telehealth
    active_tier: int
    primary_concerns: List[str]
    
    # Safety Circuit Breaker Metadata
    is_crisis: bool
    crisis_reason: Optional[str]
    
    # Peer Listener Dispatch Metadata
    matched_listener_id: Optional[str]
    matched_listener_name: Optional[str]
    
    # Routing State
    next_node: str

