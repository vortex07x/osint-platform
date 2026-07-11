from unittest.mock import AsyncMock
from datetime import datetime, timedelta, timezone
from models.users import User
from auth.auth_utils import hash_password


def test_register_creates_user_and_returns_token(auth_client):
    response = auth_client.post("/auth/register", json={
        "email": "newuser@example.com",
        "password": "SecurePass123",
        "full_name": "New User"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["full_name"] == "New User"
    assert "password" not in data["user"]  # never leak password/hash


def test_register_duplicate_email_fails(auth_client):
    auth_client.post("/auth/register", json={
        "email": "dupe@example.com",
        "password": "SecurePass123"
    })
    response = auth_client.post("/auth/register", json={
        "email": "dupe@example.com",
        "password": "DifferentPass456"
    })
    assert response.status_code == 400


def test_login_success_returns_token(auth_client):
    auth_client.post("/auth/register", json={
        "email": "loginuser@example.com",
        "password": "CorrectPass123"
    })
    response = auth_client.post("/auth/login", json={
        "email": "loginuser@example.com",
        "password": "CorrectPass123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_wrong_password_fails(auth_client):
    auth_client.post("/auth/register", json={
        "email": "wrongpass@example.com",
        "password": "CorrectPass123"
    })
    response = auth_client.post("/auth/login", json={
        "email": "wrongpass@example.com",
        "password": "WrongPassword"
    })
    assert response.status_code == 401


def test_login_nonexistent_email_fails(auth_client):
    response = auth_client.post("/auth/login", json={
        "email": "doesnotexist@example.com",
        "password": "SomePassword123"
    })
    assert response.status_code == 401


def test_login_error_message_does_not_leak_which_field_was_wrong(auth_client):
    """Wrong password and nonexistent email should return the identical
    error, so an attacker can't use this endpoint to enumerate registered emails."""
    auth_client.post("/auth/register", json={
        "email": "realuser@example.com",
        "password": "CorrectPass123"
    })
    wrong_pw = auth_client.post("/auth/login", json={
        "email": "realuser@example.com",
        "password": "WrongPassword"
    })
    no_such_user = auth_client.post("/auth/login", json={
        "email": "nosuchuser@example.com",
        "password": "WrongPassword"
    })
    assert wrong_pw.json()["detail"] == no_such_user.json()["detail"]


def test_me_without_token_returns_401(auth_client):
    response = auth_client.get("/auth/me")
    assert response.status_code == 401


def test_me_with_valid_token_returns_user(auth_client):
    register_res = auth_client.post("/auth/register", json={
        "email": "meuser@example.com",
        "password": "SecurePass123"
    })
    token = register_res.json()["access_token"]

    response = auth_client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "meuser@example.com"


def test_me_with_garbage_token_returns_401(auth_client):
    response = auth_client.get("/auth/me", headers={"Authorization": "Bearer not.a.real.token"})
    assert response.status_code == 401


def test_forgot_password_nonexistent_email_returns_generic_message(auth_client, monkeypatch):
    mock_send = AsyncMock()
    monkeypatch.setattr("api.auth.send_otp_email", mock_send)

    response = auth_client.post("/auth/forgot-password", json={"email": "ghost@example.com"})
    assert response.status_code == 200
    assert "reset code has been sent" in response.json()["message"]
    mock_send.assert_not_called()  # no email exists, so no email should be sent


def test_forgot_password_existing_email_sets_otp_and_sends_email(auth_client, db_session, monkeypatch):
    mock_send = AsyncMock()
    monkeypatch.setattr("api.auth.send_otp_email", mock_send)

    auth_client.post("/auth/register", json={
        "email": "forgotme@example.com",
        "password": "OldPassword123"
    })

    response = auth_client.post("/auth/forgot-password", json={"email": "forgotme@example.com"})
    assert response.status_code == 200
    mock_send.assert_called_once()

    user = db_session.query(User).filter(User.email == "forgotme@example.com").first()
    assert user.reset_otp is not None
    assert user.reset_otp_expires_at is not None


def test_reset_password_with_correct_otp_succeeds(auth_client, db_session, monkeypatch):
    monkeypatch.setattr("api.auth.send_otp_email", AsyncMock())

    auth_client.post("/auth/register", json={
        "email": "resetme@example.com",
        "password": "OldPassword123"
    })
    auth_client.post("/auth/forgot-password", json={"email": "resetme@example.com"})

    user = db_session.query(User).filter(User.email == "resetme@example.com").first()
    real_otp = user.reset_otp

    response = auth_client.post("/auth/reset-password", json={
        "email": "resetme@example.com",
        "otp": real_otp,
        "new_password": "NewPassword456"
    })
    assert response.status_code == 200

    login_res = auth_client.post("/auth/login", json={
        "email": "resetme@example.com",
        "password": "NewPassword456"
    })
    assert login_res.status_code == 200


def test_reset_password_with_wrong_otp_fails(auth_client, monkeypatch):
    monkeypatch.setattr("api.auth.send_otp_email", AsyncMock())

    auth_client.post("/auth/register", json={
        "email": "wrongotp@example.com",
        "password": "OldPassword123"
    })
    auth_client.post("/auth/forgot-password", json={"email": "wrongotp@example.com"})

    response = auth_client.post("/auth/reset-password", json={
        "email": "wrongotp@example.com",
        "otp": "000000",
        "new_password": "NewPassword456"
    })
    assert response.status_code == 400


def test_reset_password_with_expired_otp_fails(auth_client, db_session, monkeypatch):
    monkeypatch.setattr("api.auth.send_otp_email", AsyncMock())

    auth_client.post("/auth/register", json={
        "email": "expiredotp@example.com",
        "password": "OldPassword123"
    })
    auth_client.post("/auth/forgot-password", json={"email": "expiredotp@example.com"})

    user = db_session.query(User).filter(User.email == "expiredotp@example.com").first()
    user.reset_otp_expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db_session.commit()

    response = auth_client.post("/auth/reset-password", json={
        "email": "expiredotp@example.com",
        "otp": user.reset_otp,
        "new_password": "NewPassword456"
    })
    assert response.status_code == 400


def test_reset_password_without_prior_request_fails(auth_client):
    auth_client.post("/auth/register", json={
        "email": "noreset@example.com",
        "password": "OldPassword123"
    })
    response = auth_client.post("/auth/reset-password", json={
        "email": "noreset@example.com",
        "otp": "123456",
        "new_password": "NewPassword456"
    })
    assert response.status_code == 400