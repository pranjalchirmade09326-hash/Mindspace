"""
Intake Agent — Gentle conversational assessment and needs identification.
"""
from typing import Dict, Any
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI

try:
    from src.state import MindSpaceAgentState
except ImportError:
    from agents.src.state import MindSpaceAgentState

SYSTEM_PROMPT = """
You are the MindSpace Sanctuary Intake Agent.
Your responsibilities:
1. Greet the member warmly and validate their feelings without clinical diagnosis.
2. Ask 1-2 open-ended, gentle questions to understand what is weighing on their mind.
3. Keep responses concise, warm, grounded, and within 3-4 sentences.
4. If they indicate moderate-to-high emotional strain, gently ask if they would like to reflect here or connect with a trained human peer listener.
"""

def intake_node(state: MindSpaceAgentState) -> Dict[str, Any]:
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.3)
    history = [SystemMessage(content=SYSTEM_PROMPT)]
    for m in state.get("messages", []):
        if m.get("role") == "user":
            history.append(HumanMessage(content=m.get("content", "")))
        elif m.get("role") == "assistant":
            history.append(SystemMessage(content=m.get("content", "")))
            
    response = llm.invoke(history)
    return {
        "messages": [{"role": "assistant", "content": response.content}],
        "next_node": "END"
    }

