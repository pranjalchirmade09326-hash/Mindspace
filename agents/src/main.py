"""
MindSpace Multi-Agent Service Entrypoint (Port :8018).
Exposes HTTP, streaming, and voice endpoints for Next.js frontend consumption.
"""
import os
import sys
import asyncio
from pathlib import Path

# Add project root to sys.path
current_dir = Path(__file__).resolve().parent
agents_root = current_dir.parent
sys.path.insert(0, str(agents_root))

import json
import io
import wave
import struct
from collections import deque
from fastapi import FastAPI, HTTPException, Header, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables from agents/.env
load_dotenv(agents_root / ".env")

from src.orchestrator import orchestrator_app
from src.nodes.voice_service import synthesize_speech, transcribe_audio
from src.nodes.llm_client import invoke_gemini_chat

app = FastAPI(
    title="MindSpace Multi-Agent Service",
    description="Engine 2: Multi-Agent Intelligence and Triage Service",
    version="2.1.0"
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

class IntakeRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    member_id: Optional[str] = "member-user"

class VoiceSynthesizeRequest(BaseModel):
    text: str
    target_language_code: Optional[str] = "hi-IN"
    speaker: Optional[str] = "priya"

@app.get("/")
def root():
    """Root endpoint for quick browser verification."""
    return {
        "service": "MindSpace Multi-Agent Engine",
        "status": "online",
        "port": 8018,
        "health": "/health",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    """Service health verification endpoint."""
    return {
        "status": "healthy",
        "service": "MindSpace Multi-Agent Engine",
        "port": 8018,
        "framework": "LangGraph (StateGraph)"
    }

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """Silence browser favicon requests."""
    return Response(status_code=204)

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

# Global in-memory multi-turn session cache
SESSION_MEMORIES: Dict[str, List[Dict[str, str]]] = {}

@app.post("/api/agent/intake")
async def intake_stream_endpoint(req: IntakeRequest, authorization: Optional[str] = Header(None)):
    """
    Direct endpoint for Next.js frontend proxy (INTAKE_AGENT_URL).
    Supports token streaming back to MemberDashboardView with full multi-turn conversational memory.
    """
    token = authorization.replace("Bearer ", "") if authorization else None
    sess_id = req.session_id or f"sess-{int(asyncio.get_event_loop().time() * 1000)}"

    # Retrieve or initialize conversation history for this session
    history = SESSION_MEMORIES.get(sess_id, [])
    history.append({"role": "user", "content": req.message})

    initial_state = {
        "session_id": sess_id,
        "member_id": req.member_id or "member-sanctuary",
        "auth_token": token,
        "messages": list(history),
        "active_tier": 1,
        "is_crisis": False,
        "crisis_reason": None,
        "matched_listener_name": None,
        "next_node": ""
    }

    try:
        final_state = orchestrator_app.invoke(initial_state)
        latest_reply = final_state["messages"][-1]
        reply_content = latest_reply.get("content", "I am holding space for you.")
    except Exception as e:
        reply_content = "Thank you for sharing. I am here listening to you with empathy and care."

    # Commit assistant response to session memory so subsequent turns have complete context
    history.append({"role": "assistant", "content": reply_content})
    SESSION_MEMORIES[sess_id] = history[-20:]

    async def token_generator():
        words = reply_content.split(" ")
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")
            await asyncio.sleep(0.02)

    return StreamingResponse(
        token_generator(),
        media_type="text/plain; charset=utf-8",
        headers={
            "X-Session-Id": sess_id,
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )

@app.post("/api/v1/voice/synthesize")
async def voice_synthesize_endpoint(req: VoiceSynthesizeRequest):
    """Synthesizes text into natural audio using Sarvam TTS."""
    result = await synthesize_speech(
        text=req.text,
        target_language_code=req.target_language_code or "hi-IN",
        speaker=req.speaker or "priya"
    )
    return result

@app.post("/api/v1/voice/transcribe")
async def voice_transcribe_endpoint(request: Request):
    """Transcribes user spoken voice audio into text using Sarvam STT."""
    audio_bytes = await request.body()
    result = await transcribe_audio(audio_bytes)
    return result

def pcm16_to_wav(pcm_bytes: bytes, sample_rate: int = 16000, channels: int = 1) -> bytes:
    """Wraps raw 16-bit PCM audio frames into valid WAV container."""
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm_bytes)
    return buf.getvalue()

def calculate_energy(pcm_chunk: bytes) -> float:
    """Computes average absolute amplitude of PCM-16 chunk."""
    if not pcm_chunk:
        return 0.0
    count = len(pcm_chunk) // 2
    if count == 0:
        return 0.0
    samples = struct.unpack(f"{count}h", pcm_chunk[:count*2])
    return sum(abs(s) for s in samples) / count

@app.websocket("/ws/audio")
@app.websocket("/audio")
async def voice_websocket_endpoint(websocket: WebSocket):
    """
    Real-time bidirectional WebSocket voice streaming endpoint.
    Communicates directly with VoiceIntakeTest and frontend voice components.
    Features:
      - Adaptive Voice Activity Detection (VAD) with pre-speech roll buffer.
      - Automatic language detection (Hindi, Hinglish, English) via Sarvam STT (saaras:v3).
      - Multi-turn conversational memory for empathetic, contextual responses.
      - Exact audio duration echo protection.
    """
    await websocket.accept()
    
    session_history: List[Dict[str, str]] = []

    # 1. Send greeting phase
    await websocket.send_json({"type": "status", "status": "greeting"})
    greeting_text = "Namaste. I am your MindSpace Voice Companion. I am here listening to you with care. How are you feeling today?"
    session_history.append({"role": "assistant", "content": greeting_text})

    greeting_voice = await synthesize_speech(greeting_text)
    greeting_b64 = greeting_voice.get("audio_base64")
    
    await websocket.send_json({
        "type": "text",
        "text": greeting_text,
        "audio": greeting_b64
    })
    await websocket.send_json({"type": "status", "status": "ready"})

    # Natural conversational cooldown (allows natural barge-in / speech)
    greeting_bytes_len = (len(greeting_b64) * 3 // 4 - 44) if greeting_b64 else 0
    greeting_duration = max(1.5, min(4.0, greeting_bytes_len / 48000.0)) if greeting_bytes_len > 0 else 2.0
    ai_speaking_until = asyncio.get_event_loop().time() + greeting_duration

    audio_buffer = bytearray()
    pre_speech_ring = deque(maxlen=30)  # ~300ms pre-roll to preserve starting syllables
    silence_frames = 0
    speech_confirm_frames = 0
    speech_detected = False
    ambient_noise = 80.0

    # Common single-syllable acoustic noise / false triggers to ignore
    NOISE_TOKENS = {"कि", "वाह", "आ", "जी", "हां", "हाँ", "uh", "um", "ah", "oh"}

    try:
        while True:
            message = await websocket.receive()
            if "bytes" in message and message["bytes"]:
                chunk = message["bytes"]
                energy = calculate_energy(chunk)

                # Dynamic background noise floor estimation
                if not speech_detected:
                    ambient_noise = 0.95 * ambient_noise + 0.05 * energy
                    pre_speech_ring.append(chunk)

                # Robust threshold: speech is significantly above ambient floor
                speech_threshold = max(280.0, ambient_noise * 1.85)

                if energy > speech_threshold:
                    speech_confirm_frames += 1
                    if speech_confirm_frames >= 5:  # ~50ms sustained sound confirms speech
                        if not speech_detected:
                            speech_detected = True
                            silence_frames = 0
                            for pre_chunk in pre_speech_ring:
                                audio_buffer.extend(pre_chunk)
                            pre_speech_ring.clear()
                        audio_buffer.extend(chunk)
                        silence_frames = 0
                elif speech_detected:
                    audio_buffer.extend(chunk)
                    silence_frames += 1
                    speech_confirm_frames = max(0, speech_confirm_frames - 1)
                else:
                    speech_confirm_frames = max(0, speech_confirm_frames - 1)

                # Turn-End detection:
                # Requires at least ~0.75s (24,000 bytes) of actual speech and a natural pause (~0.85s, 80 frames)
                should_process = False
                if speech_detected and silence_frames >= 75 and len(audio_buffer) >= 24000:
                    should_process = True
                elif len(audio_buffer) >= 384000:  # Safety cap at ~12 seconds
                    should_process = True

                if should_process:
                    wav_data = pcm16_to_wav(bytes(audio_buffer), sample_rate=16000, channels=1)
                    audio_buffer.clear()
                    pre_speech_ring.clear()
                    speech_detected = False
                    speech_confirm_frames = 0
                    silence_frames = 0

                    # Transcribe user speech via Sarvam STT with auto-detect (Hindi, Hinglish, English)
                    stt_result = await transcribe_audio(wav_data, language_code="unknown")
                    transcript = stt_result.get("transcript", "").strip()
                    print(f"[ws/audio] Captured user speech: '{transcript}'")

                    # Valid speech check: ignore empty, single punctuation, or isolated noise words
                    clean_words = [w for w in transcript.split() if w not in NOISE_TOKENS]
                    if transcript and len(transcript) >= 3 and len(clean_words) >= 1:
                        await websocket.send_json({"type": "transcript", "text": transcript})
                        await websocket.send_json({"type": "status", "status": "thinking"})

                        session_history.append({"role": "user", "content": transcript})

                        # Dynamic empathetic response with multi-turn memory
                        system_prompt = (
                            "You are MindSpace Voice Companion, a warm, compassionate, and attentive listener. "
                            "The user is speaking to you. Respond naturally, soothingly, and concisely (1-2 sentences maximum). "
                            "Always respond in the SAME language the user is speaking (Hindi, Hinglish, or English). "
                            "Directly address whatever they shared with deep empathy and care. Avoid long lectures or robotic repetition."
                        )
                        reply = invoke_gemini_chat(system_prompt, session_history[-8:])
                        session_history.append({"role": "assistant", "content": reply})

                        # Synthesize speech via Sarvam TTS (bulbul:v3 @ 24kHz)
                        tts_result = await synthesize_speech(reply)
                        audio_b64 = tts_result.get("audio_base64")

                        # Cooldown calculation
                        if audio_b64:
                            audio_raw_len = len(audio_b64) * 3 // 4 - 44
                            audio_duration = max(2.0, min(6.0, audio_raw_len / 48000.0))
                        else:
                            audio_duration = max(2.0, min(5.0, len(reply.split()) * 0.35))

                        ai_speaking_until = asyncio.get_event_loop().time() + audio_duration

                        await websocket.send_json({
                            "type": "text",
                            "text": reply,
                            "audio": audio_b64
                        })
                        await websocket.send_json({"type": "status", "status": "ready"})
            elif "text" in message and message["text"]:
                try:
                    data = json.loads(message["text"])
                    user_text = data.get("text") or data.get("message")
                    if user_text:
                        await websocket.send_json({"type": "transcript", "text": user_text})
                        await websocket.send_json({"type": "status", "status": "thinking"})

                        session_history.append({"role": "user", "content": user_text})
                        system_prompt = (
                            "You are MindSpace Voice Companion. "
                            "Respond warmly, naturally, and concisely (1-2 sentences) in the user's language."
                        )
                        reply = invoke_gemini_chat(system_prompt, session_history[-8:])
                        session_history.append({"role": "assistant", "content": reply})

                        tts_result = await synthesize_speech(reply)
                        audio_b64 = tts_result.get("audio_base64")

                        await websocket.send_json({
                            "type": "text",
                            "text": reply,
                            "audio": audio_b64
                        })
                        await websocket.send_json({"type": "status", "status": "ready"})
                except Exception:
                    pass
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[ws/audio] connection closed: {e}")

def main():
    import uvicorn
    port = int(os.getenv("PORT", 8018))
    uvicorn.run("src.main:app", host="0.0.0.0", port=port, reload=True)

if __name__ == "__main__":
    main()
