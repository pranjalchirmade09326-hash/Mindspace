from app.core.security import encrypt_content, decrypt_content, CURRENT_KEY_VERSION, get_encryption_keys
import jwt

def test_encryption_roundtrip():
    original_text = "MindSpace confidential emotional reflection note"
    packed, key_ver = encrypt_content(original_text)
    assert packed is not None
    assert key_ver == CURRENT_KEY_VERSION
    
    decrypted = decrypt_content(packed, key_ver)
    assert decrypted == original_text

def test_decryption_invalid():
    assert decrypt_content(None, "v1") is None
    assert decrypt_content(b"too_short", "v1") is None

def test_encryption_keys():
    keys = get_encryption_keys()
    assert CURRENT_KEY_VERSION in keys
    assert len(keys[CURRENT_KEY_VERSION]) == 32

def test_token_decoding_logic():
    token = jwt.encode({"sub": "usr-custom-member-42"}, "secret", algorithm="HS256")
    unverified = jwt.decode(token, options={"verify_signature": False})
    assert unverified.get("sub") == "usr-custom-member-42"
