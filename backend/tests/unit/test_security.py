import pytest
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
)

pytestmark = pytest.mark.unit


def test_password_hashing_and_verification():
    """Verify that passwords hash securely and verify correctly."""
    password = "EngineeringSecretPass2026!"
    hashed = get_password_hash(password)

    assert hashed != password, "Hash must differ from plaintext"
    assert verify_password(password, hashed) is True, "Correct password must verify"
    assert verify_password("WrongPassword123", hashed) is False, "Wrong password must fail"


def test_jwt_token_creation_and_decoding():
    """Verify that JWT access tokens encode and decode user claims properly."""
    sub_id = "user_test_456"
    token = create_access_token({"sub": sub_id})

    assert isinstance(token, str) and len(token) > 20
    payload = decode_access_token(token)
    assert payload is not None, "Payload must be decoded successfully"
    assert payload.get("sub") == sub_id, f"Expected sub claim '{sub_id}', got: {payload.get('sub')}"
    assert "exp" in payload, "Token must contain expiration timestamp"


def test_invalid_jwt_token_decoding():
    """Malformed tokens should decode to None without throwing uncaught exceptions."""
    result = decode_access_token("not.a.valid.jwt.token")
    assert result is None
