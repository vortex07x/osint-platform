from fastapi import FastAPI

app = FastAPI(title="OSINT Platform API")

@app.get("/")
def read_root():
    return {"message": "OSINT Platform API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}