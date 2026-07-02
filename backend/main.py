from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from db.database import get_db
from api.scans import router as scans_router

app = FastAPI(title="OSINT Platform API")

app.include_router(scans_router)

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