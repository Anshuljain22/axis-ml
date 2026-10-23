from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.core.config import get_settings
from app.core.database import Base, engine
from app.models import entities  # noqa: F401 - register SQLAlchemy models

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    Path(settings.artifact_dir).mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    yield

from fastapi.responses import HTMLResponse

app = FastAPI(title=settings.app_name, version="0.1.0", description="Dataset ingestion, data quality and baseline ML experiment tracking.", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)

@app.get("/")
def root():
    return {
        "service": settings.app_name,
        "workbench": "/workbench",
        "docs": "/docs",
        "health": "/api/v1/health",
    }

@app.api_route("/workbench", methods=["GET", "HEAD"], response_class=HTMLResponse)
def workbench():
    html_path = Path(__file__).parent / "static" / "workbench.html"
    if html_path.is_file():
        return HTMLResponse(content=html_path.read_text(encoding="utf-8"))
    return HTMLResponse("<h1>Workbench not found</h1>", status_code=404)
