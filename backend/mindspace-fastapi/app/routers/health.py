from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db

router = APIRouter(tags=["Health"])

@router.get("/health/ready")
async def health_ready(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception as e:
        return {"status": "degraded", "error": str(e)}

@router.get("/health/live")
async def health_live():
    return {"status": "live"}

@router.get("/")
async def root():
    return {
        "service": "MindSpace Core API",
        "runtime": "Python FastAPI",
        "docs": "/docs",
        "api_docs": "/api-docs"
    }

