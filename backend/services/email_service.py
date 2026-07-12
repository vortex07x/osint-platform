"""
Sends transactional emails via Brevo's REST API.
"""

import os
import httpx
from dotenv import load_dotenv

load_dotenv()


BREVO_API_KEY = os.getenv("BREVO_API_KEY")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL")
BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME", "OSINT Platform")

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

# print(f"[DEBUG] Brevo key loaded: {BREVO_API_KEY[:15]}..." if BREVO_API_KEY else "[DEBUG] Brevo key is None!")

async def send_otp_email(to_email: str, otp: str):
    """
    Sends a password reset OTP to the given email via Brevo.
    """
    payload = {
        "sender": {"name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL},
        "to": [{"email": to_email}],
        "subject": "Your OSINT Platform Password Reset Code",
        "htmlContent": f"""
            <div style="font-family: monospace; background: #0F1115; color: #E5E7EB; padding: 32px;">
                <h2 style="color: #00D9FF;">Password Reset Request</h2>
                <p>Use the code below to reset your password. This code expires in 10 minutes.</p>
                <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #00D9FF;">{otp}</p>
                <p style="color: #6B7280; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
        """
    }

    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(BREVO_API_URL, json=payload, headers=headers, timeout=10.0)
        response.raise_for_status()
        return response.json()