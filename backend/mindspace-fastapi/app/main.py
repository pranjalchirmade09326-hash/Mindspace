from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from app.core.config import settings
from app.core.init_db import init_and_seed_db
from app.routers import health, dashboards, member, wellbeing, intakes, peer, operations, admins, supervisors, safetys

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize and seed database if PostgreSQL is available
    await init_and_seed_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="MindSpace Core Platform API — Built with Python FastAPI & PostgreSQL",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api-docs/json",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router)
app.include_router(dashboards.router)
app.include_router(member.router)
app.include_router(wellbeing.router)
app.include_router(intakes.router)
app.include_router(peer.router)
app.include_router(operations.router)
app.include_router(admins.router)
app.include_router(supervisors.router)
app.include_router(safetys.router)

@app.get("/api-docs", include_in_schema=False)
async def api_docs_redirect():
    return RedirectResponse(url="/docs")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8080, reload=True)
