from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api.v1 import health, auth, projects, import_router, export_router

# Create tables in TiDB if they don't exist
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"TiDB table sync notice: {e}")

app = FastAPI(title="VSM Studio API")

origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Clean /api routing (e.g. /api/auth, /api/projects, /api/import, /api/vsm)
app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(import_router.router, prefix="/api/import", tags=["import"])
app.include_router(import_router.router, prefix="/api", tags=["import_projects"])
app.include_router(export_router.router, prefix="/api/vsm", tags=["export"])

# Backward-compatible /api/v1 routing
app.include_router(health.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth_v1"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects_v1"])
app.include_router(import_router.router, prefix="/api/v1/import", tags=["import_v1"])
app.include_router(import_router.router, prefix="/api/v1", tags=["import_projects_v1"])
app.include_router(export_router.router, prefix="/api/v1/vsm", tags=["export_v1"])
