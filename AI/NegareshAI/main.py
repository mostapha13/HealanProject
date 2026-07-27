from fastapi import FastAPI, File, UploadFile, HTTPException
from io import BytesIO
from pypdf import PdfReader
from docx import Document
import re

app = FastAPI(title="NegareshAI", version="0.1.0")

@app.get("/health")
def health():
    return {"service": "negareshai-ai", "status": "healthy"}

@app.post("/extract")
async def extract(file: UploadFile = File(...)):
    data = await file.read()
    name = (file.filename or "").lower()
    try:
        if name.endswith(".pdf"):
            reader = PdfReader(BytesIO(data))
            text = "\n\n".join(page.extract_text() or "" for page in reader.pages)
        elif name.endswith(".docx"):
            document = Document(BytesIO(data))
            text = "\n".join(p.text for p in document.paragraphs)
        else:
            raise HTTPException(415, "Only PDF and DOCX are supported")
        return {"fileName": file.filename, "text": text, "characters": len(text), "ocrRequired": not bool(text.strip())}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(422, f"Document extraction failed: {exc}") from exc

def structural_chunks(text: str, max_chars: int = 1800) -> list[dict]:
    sections = re.split(r"(?m)(?=^\s*(?:ماده|بند|فصل|تبصره|[0-9۰-۹]+[.)-])\s*)", text)
    chunks: list[dict] = []
    for section in sections:
        section = section.strip()
        if not section:
            continue
        for offset in range(0, len(section), max_chars):
            value = section[offset:offset + max_chars].strip()
            if value:
                chunks.append({"text": value, "index": len(chunks), "section": section[:120]})
    return chunks

@app.post("/chunk")
async def chunk_document(payload: dict):
    text = payload.get("text", "")
    if not isinstance(text, str) or not text.strip():
        raise HTTPException(400, "text is required")
    max_chars = int(payload.get("maxChars", 1800))
    if max_chars < 200 or max_chars > 10000:
        raise HTTPException(400, "maxChars must be between 200 and 10000")
    chunks = structural_chunks(text, max_chars)
    return {"chunks": chunks, "count": len(chunks)}
