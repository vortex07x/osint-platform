from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from models.users import User
from schemas.users import UserRegister, UserLogin, UserResponse, Token
from auth.auth_utils import hash_password, verify_password, create_access_token
from auth.dependencies import get_current_user
import random
from datetime import datetime, timedelta, timezone
from schemas.users import ForgotPasswordRequest, ResetPasswordRequest
from services.email_service import send_otp_email

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=Token)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        full_name=user_data.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id)})
    return {"access_token": token, "user": new_user}


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "user": user}


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()

    # Always return a generic success message, even if the email doesn't exist —
    # this prevents attackers from using this endpoint to discover registered emails
    if not user:
        return {"message": "If that email is registered, a reset code has been sent."}

    otp = str(random.randint(100000, 999999))
    user.reset_otp = otp
    user.reset_otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()

    try:
        await send_otp_email(user.email, otp)
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send OTP: {e}")
        raise HTTPException(status_code=500, detail="Failed to send reset email")

    return {"message": "If that email is registered, a reset code has been sent."}


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()

    if not user or not user.reset_otp or not user.reset_otp_expires_at:
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    expires_at = user.reset_otp_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Code has expired")

    if user.reset_otp != request.otp:
        raise HTTPException(status_code=400, detail="Invalid code")

    user.password_hash = hash_password(request.new_password)
    user.reset_otp = None
    user.reset_otp_expires_at = None
    db.commit()

    return {"message": "Password reset successful"}