from fastapi import FastAPI

app = FastAPI(title="NegareshAI", version="0.1.0")

@app.get("/health")
def health():
    return {"service": "negareshai-ai", "status": "healthy"}
