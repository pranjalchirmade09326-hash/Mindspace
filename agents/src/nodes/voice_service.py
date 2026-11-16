"""
Sarvam AI Voice Service — Low-latency Speech-to-Text and Text-to-Speech Gateway.
Supports Indian languages, regional accents, and soothing companion synthesis.
"""
import os
import httpx
from typing import Dict, Any, Optional

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "")
SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"
SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"

def get_sarvam_key() -> str:
    return os.getenv("SARVAM_API_KEY", "").strip() or SARVAM_API_KEY.strip()

async def synthesize_speech(
    text: str,
    target_language_code: str = "hi-IN",
    speaker: str = "priya",
    pitch: float = 0.0,
    pace: float = 0.95
) -> Dict[str, Any]:
    """
    Synthesizes natural, calming audio for the member companion using Sarvam TTS (bulbul:v3).
    Returns base64 encoded wav audio.
    """
    api_key = get_sarvam_key()
    if not SARVAM_API_KEY:
        return {"status": "mock", "message": "SARVAM_API_KEY not configured", "audio_base64": None}
    if not api_key:
        return {"status": "mock", "message": "SARVAM_API_KEY not configured", "audio_base64": None}

    headers = {
        "api-subscription-key": api_key,
        "Content-Type": "application/json"
    }

    # Ensure speaker is valid for bulbul:v3
    valid_speakers = {
        "priya", "kavya", "simran", "pooja", "neha", "ritu", "shreya", "roopa",
        "aditya", "ashutosh", "rahul", "rohan", "amit", "dev", "kabir", "aayan"
    }
    chosen_speaker = speaker if speaker in valid_speakers else "priya"

    payload = {
        "inputs": [text[:500]],
        "target_language_code": target_language_code or "hi-IN",
        "speaker": chosen_speaker,
        "model": "bulbul:v3",
        "speech_sample_rate": 24000
    }

    async with httpx.AsyncClient(timeout=12.0) as client:
        try:
            res = await client.post(SARVAM_TTS_URL, json=payload, headers=headers)
            if res.status_code == 200:
                data = res.json()
                audios = data.get("audios", [])
                return {
                    "status": "success",
                    "audio_base64": audios[0] if audios else None
                }
            return {"status": "error", "code": res.status_code, "detail": res.text}
        except Exception as e:
            return {"status": "error", "message": str(e)}

async def transcribe_audio(
    audio_file_bytes: bytes,
    language_code: str = "unknown",
    model: str = "saaras:v3"
) -> Dict[str, Any]:
    """
    Transcribes spoken voice audio input from the user into text using Sarvam STT (saaras:v3).
    Supports automatic language detection (Hindi, Hinglish, English, etc.) via language_code="unknown".
    """
    api_key = get_sarvam_key()
    if not api_key:
        return {"status": "empty", "transcript": ""}

    if not audio_file_bytes or len(audio_file_bytes) < 44:
        return {"status": "empty", "transcript": ""}

    headers = {
        "api-subscription-key": api_key
    }
    files = {
        "file": ("audio.wav", audio_file_bytes, "audio/wav")
    }
    data = {
        "language_code": language_code or "unknown",
        "model": "saaras:v3",
        "mode": "transcribe"
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.post(SARVAM_STT_URL, headers=headers, data=data, files=files)
            if res.status_code == 200:
                return res.json()
            return {"status": "error", "code": res.status_code, "detail": res.text}
        except Exception as e:
            return {"status": "error", "message": str(e)}
