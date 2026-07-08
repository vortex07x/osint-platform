import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from db.database import get_db
from api.scans import router as scans_router
from api.sources import router as sources_router
from api.entities import router as entities_router
from api.exposures import router as exposures_router
from db.neo4j_client import get_neo4j_session
from api.auth import router as auth_router
import os

app = FastAPI(title="OSINT Platform API")

allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(scans_router)
app.include_router(sources_router)
app.include_router(entities_router)
app.include_router(exposures_router)
app.include_router(auth_router)

@app.get("/")
def read_root():
    return {"message": "OSINT Platform API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/db-test")
def test_db(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1"))
    return {"database": "connected", "result": result.scalar()}

@app.get("/neo4j-test")
def test_neo4j():
    with get_neo4j_session() as session:
        result = session.run("RETURN 'Neo4j connected!' AS message")
        record = result.single()
        return {"neo4j": record["message"]}