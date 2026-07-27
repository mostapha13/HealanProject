from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import Response
from io import BytesIO
from pypdf import PdfReader
from docx import Document
import re
import chromadb
import hashlib

app = FastAPI(title="NegareshAI", version="0.1.0")
class LocalEmbedding:
    def __call__(self, input):
        return [self._vector(str(value)) for value in input]
    @staticmethod
    def _vector(value: str) -> list[float]:
        raw = hashlib.sha256(value.encode('utf-8')).digest()
        return [((raw[i % len(raw)] / 255.0) * 2.0) - 1.0 for i in range(128)]

embedding = LocalEmbedding()
vector_client = chromadb.EphemeralClient()

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

@app.post("/rag/index")
async def index_chunks(payload: dict):
    collection_name = payload.get("collection", "negareshai")
    chunks = payload.get("chunks", [])
    if not chunks:
        raise HTTPException(400, "chunks is required")
    collection = vector_client.get_or_create_collection(collection_name, embedding_function=embedding)
    ids = [str(c.get("id", c.get("index", i))) for i, c in enumerate(chunks)]
    documents = [str(c.get("text", "")) for c in chunks]
    collection.upsert(ids=ids, documents=documents)
    return {"collection": collection_name, "indexed": len(documents)}

@app.post("/rag/search")
async def search_chunks(payload: dict):
    collection = vector_client.get_or_create_collection(payload.get("collection", "negareshai"), embedding_function=embedding)
    query = str(payload.get("query", "")).strip()
    if not query:
        raise HTTPException(400, "query is required")
    result = collection.query(query_texts=[query], n_results=min(int(payload.get("limit", 5)), 20))
    return {"documents": result.get("documents", [[]])[0], "ids": result.get("ids", [[]])[0], "distances": result.get("distances", [[]])[0]}

@app.post("/contract/generate")
async def generate_contract(file: UploadFile = File(...), values: str = "{}"):
    import json
    try:
        replacements = json.loads(values)
        source = BytesIO(await file.read())
        document = Document(source)
        def replace_in_paragraph(paragraph):
            for key, value in replacements.items():
                marker = "{{" + str(key) + "}}"
                if marker in paragraph.text:
                    for run in paragraph.runs:
                        run.text = run.text.replace(marker, str(value))
        for paragraph in document.paragraphs:
            replace_in_paragraph(paragraph)
        for table in document.tables:
            for row in table.rows:
                for cell in row.cells:
                    for paragraph in cell.paragraphs:
                        replace_in_paragraph(paragraph)
        output = BytesIO()
        document.save(output)
        return Response(output.getvalue(), media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", headers={"Content-Disposition": "attachment; filename=generated-contract.docx"})
    except Exception as exc:
        raise HTTPException(422, f"Contract generation failed: {exc}") from exc
