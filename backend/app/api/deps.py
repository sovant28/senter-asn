from datetime import datetime, timezone
from typing import AsyncGenerator
from uuid import uuid4

from fastapi import Depends, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import AsyncSessionLocal

UPLOAD_DIR = "/tmp/senter-uploads"


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def save_upload_file(file: UploadFile) -> str:
    import os

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "upload.xlsx")[1] or ".xlsx"
    dest = os.path.join(UPLOAD_DIR, f"{uuid4().hex}{ext}")
    content = await file.read()
    with open(dest, "wb") as f:
        f.write(content)
    return dest
