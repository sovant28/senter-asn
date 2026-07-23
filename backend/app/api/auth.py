from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.middleware.auth import get_current_user
from app.models.master import User
from app.services.auth import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    hash_password,
    validate_password_strength,
    verify_refresh_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class RefreshRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


@router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, body.username, body.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Username atau password salah")

    user.last_login = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
    await db.commit()

    access = create_access_token(user.id, user.role, user.opd_id)
    refresh = create_refresh_token(user.id)

    return LoginResponse(
        access_token=access,
        refresh_token=refresh,
        user={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "nama_lengkap": user.nama_lengkap,
            "role": user.role,
            "opd_id": user.opd_id,
        },
    )


@router.post("/refresh")
async def refresh_token(body: RefreshRequest):
    try:
        payload = verify_refresh_token(body.refresh_token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_id = int(payload["sub"])
    return {
        "access_token": create_access_token(user_id, "USER", None),
        "refresh_token": create_refresh_token(user_id),
        "token_type": "bearer",
    }


@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "nama_lengkap": user.nama_lengkap,
        "role": user.role,
        "opd_id": user.opd_id,
        "is_active": user.is_active,
    }


@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.services.auth import verify_password

    if not verify_password(body.old_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Password lama salah")

    valid, msg = validate_password_strength(body.new_password)
    if not valid:
        raise HTTPException(status_code=400, detail=msg)

    user.password_hash = hash_password(body.new_password)
    await db.commit()

    return {"message": "Password berhasil diubah"}
