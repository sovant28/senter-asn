from fastapi import APIRouter

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
async def list_users():
    return {"message": "User management — TASK-110"}
