"""
Wellbeing Companion Agent — Guides 4-7-8 breathing, journaling, and cognitive reframing.
"""
from typing import Dict, Any
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI

try:
    from src.state import MindSpaceAgentState
except ImportError:
    from agents.src.state import MindSpaceAgentState

COMPANION_PROMPT = """
You are the MindSpace AI Wellbeing Companion.
Your responsibilities:
1. Provide empathetic presence, active listening, and somatic grounding.
2. If the user feels overwhelmed, offer a structured 4-7-8 breathwork exercise:
   - Inhale through the nose for 4 seconds
   - Hold gently for 7 seconds
   - Exhale through the mouth for 8 seconds
3. Encourage reflection, self-compassion, and mindfulness.
4. Maintain strict non-clinical boundaries. Never provide medical diagnoses or prescriptions.
"""

def companion_node(state: MindSpaceAgentState) -> Dict[str, Any]:
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.4)
    history = [SystemMessage(content=COMPANION_PROMPT)]
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

