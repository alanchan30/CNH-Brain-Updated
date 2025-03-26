# app/api/auth.py
from fastapi import APIRouter, HTTPException, Depends, Response, Request
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from typing import Optional

load_dotenv()

router = APIRouter()

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL")
# Use service key for admin rights
supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)


class LoginRequest(BaseModel):
    email: str
    password: str


class EmailRequest(BaseModel):
    email: str


class AuthResponse(BaseModel):
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    user: Optional[dict] = None
    message: Optional[str] = None

@router.post("/signup", response_model=AuthResponse)
async def login(request: LoginRequest):
    try:
        auth_response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password
        })
        return {
            "message": "Signup successful. Please check your email to confirm your account."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    try:
        # Sign in with Supabase
        auth_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })

        return {
            "access_token": auth_response.session.access_token,
            "refresh_token": auth_response.session.refresh_token,
            "user": auth_response.user.model_dump(),
            "message": "Login successful"
        }
    except Exception as e:
        # Ensure we return a properly formatted error response
        raise HTTPException(
            status_code=401,
            detail={"message": str(e), "error": "Authentication failed"}
        )


@router.post("/magic-link", response_model=AuthResponse)
async def send_magic_link(request: EmailRequest):
    try:
        # Send magic link email
        supabase.auth.sign_in_with_otp({
            "email": request.email
        })

        return {
            "message": "Magic link email sent. Check your inbox."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/reset-password", response_model=AuthResponse)
async def reset_password(request: EmailRequest):
    try:
        # Reset password email
        supabase.auth.reset_password_for_email(
            request.email
        )

        return {
            "message": "Password reset email sent. Check your inbox."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/logout")
async def logout(request: Request):
    # Get the JWT token from the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")

    token = auth_header.split(" ")[1]

    try:
        # Sign out
        supabase.auth.sign_out(token)
        return {"message": "Successfully logged out"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me", response_model=dict)
async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")

    token = auth_header.split(" ")[1]

    try:
        # Get user from token
        user_response = supabase.auth.get_user(token)
        # Return a structured response that matches what the frontend expects
        return {
            "user": user_response.user.model_dump(),
            "message": "User authenticated"
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
