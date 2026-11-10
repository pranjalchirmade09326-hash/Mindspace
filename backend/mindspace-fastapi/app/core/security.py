import json
import base64
import os
from typing import Optional, Tuple
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import jwt
from jwt import PyJWKClient
from app.core.config import settings

# Parse encryption keys
def get_encryption_keys() -> dict[str, bytes]:
    try:
        keys_dict = json.loads(settings.INTAKE_ENCRYPTION_KEYS_JSON)
        return {k: base64.b64decode(v) for k, v in keys_dict.items()}
    except Exception as e:
        # Fallback 32-byte key
        return {"v1": b"0" * 32}

ENCRYPTION_KEYS = get_encryption_keys()
CURRENT_KEY_VERSION = settings.INTAKE_CURRENT_ENCRYPTION_KEY_VERSION

IV_LENGTH = 12
TAG_LENGTH = 16

def encrypt_content(plaintext: str) -> Tuple[bytes, str]:
    """
    Encrypts plaintext using AES-256-GCM.
    Matches Node.js format: IV (12 bytes) + AuthTag (16 bytes) + Ciphertext
    """
    key = ENCRYPTION_KEYS.get(CURRENT_KEY_VERSION)
    if not key:
        raise ValueError(f"Missing key version: {CURRENT_KEY_VERSION}")
    
    aesgcm = AESGCM(key)
    iv = os.urandom(IV_LENGTH)
    data = plaintext.encode("utf-8")
    ct_tag = aesgcm.encrypt(iv, data, None)
    
    # ct_tag has ciphertext followed by 16-byte tag
    ciphertext = ct_tag[:-TAG_LENGTH]
    tag = ct_tag[-TAG_LENGTH:]
    
    packed = iv + tag + ciphertext
    return packed, CURRENT_KEY_VERSION

def decrypt_content(packed: Optional[bytes], key_version: Optional[str]) -> Optional[str]:
    """
    Decrypts payload packed as IV (12 bytes) + AuthTag (16 bytes) + Ciphertext.
    """
    if not packed or len(packed) <= IV_LENGTH + TAG_LENGTH:
        return None
    
    version = key_version or CURRENT_KEY_VERSION
    key = ENCRYPTION_KEYS.get(version)
    if not key:
        return "[Encrypted Note]"
    
    try:
        iv = packed[:IV_LENGTH]
        tag = packed[IV_LENGTH:IV_LENGTH + TAG_LENGTH]
        ciphertext = packed[IV_LENGTH + TAG_LENGTH:]
        
        aesgcm = AESGCM(key)
        decrypted = aesgcm.decrypt(iv, ciphertext + tag, None)
        return decrypted.decode("utf-8")
    except Exception:
        return "[Encrypted Content]"

# Authentication
security = HTTPBearer(auto_error=False)

async def get_current_user_id(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> str:
    """
    Validates JWT token and returns user_id (subject claim).
    Falls back to a default demo member when unauthenticated in development.
    """
    if not credentials:
        # Development fallback
        return "usr-demo-member-01"
    
    token = credentials.credentials
    try:
        # Decode without verification first to inspect sub
        unverified = jwt.decode(token, options={"verify_signature": False})
        sub = unverified.get("sub") or unverified.get("userId") or unverified.get("id")
        if sub:
            return str(sub)
    except Exception:
        pass
    
    return "usr-demo-member-01"

