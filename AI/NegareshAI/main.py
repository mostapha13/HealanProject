from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import Response
from io import BytesIO
from pypdf import PdfReader
from docx import Document
import re
import chromadb
import hashlib
import os
import difflib

app = FastAPI(title="NegareshAI", version="0.1.0")
class LocalEmbedding:
    def __call__(self, input):
        return [self._vector(str(value)) for value in input]
    @staticmethod
    def _vector(value: str) -> list[float]:
        raw = hashlib.sha256(value.encode('utf-8')).digest()
        return [((raw[i % len(raw)] / 255.0) * 2.0) - 1.0 for i in range(128)]

embedding = LocalEmbedding()
vector_client = chromadb.PersistentClient(path=os.getenv('CHROMA_PERSIST_DIR', '/data/chroma'))

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
            combined = ''.join(run.text or '' for run in paragraph.runs)
            for key, value in replacements.items():
                marker = "{{" + str(key) + "}}"
                combined = combined.replace(marker, str(value))
            if paragraph.runs and combined != ''.join(run.text or '' for run in paragraph.runs):
                paragraph.runs[0].text = combined
                for run in paragraph.runs[1:]:
                    run.text = ''
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

@app.post("/contract/compare")
async def compare_contracts(original: UploadFile = File(...), revised: UploadFile = File(...)):
    async def read_doc(upload: UploadFile) -> list[str]:
        document = Document(BytesIO(await upload.read()))
        return [p.text for p in document.paragraphs]
    try:
        before, after = await read_doc(original), await read_doc(revised)
        changes = []
        for item in difflib.ndiff(before, after):
            if item.startswith(('+ ', '- ')):
                changes.append({"type": "added" if item.startswith('+ ') else "removed", "text": item[2:]})
        return {"changes": changes, "added": sum(x["type"] == "added" for x in changes), "removed": sum(x["type"] == "removed" for x in changes)}
    except Exception as exc:
        raise HTTPException(422, f"Contract comparison failed: {exc}") from exc

@app.post("/compliance/check")
async def compliance_check(payload: dict):
    text = str(payload.get("text", ""))
    checklist = payload.get("checklist", [])
    if not text.strip() or not isinstance(checklist, list) or not checklist:
        raise HTTPException(400, "text and checklist are required")
    findings = []
    for item in checklist:
        requirement = str(item.get("requirement", item) if isinstance(item, dict) else item).strip()
        if not requirement:
            continue
        position = text.find(requirement)
        matched = position >= 0
        evidence = text[max(0, position - 120):position + len(requirement) + 120] if matched else None
        findings.append({"requirement": requirement, "status": "met" if matched else "missing", "evidence": evidence, "confidence": 1.0 if matched else 0.0})
    missing = [x for x in findings if x["status"] == "missing"]
    decision = "rejected" if missing else "approved"
    if missing and len(missing) < len(findings):
        decision = "approved_with_improvements"
    focus = [str(x) for x in payload.get("focus", []) if str(x).strip()]
    focus_findings = [{"topic": topic, "present": topic in text, "evidence": text[max(0, text.find(topic)-120):text.find(topic)+len(topic)+120] if topic in text else None} for topic in focus]
    return {"decision": decision, "findings": findings, "focusFindings": focus_findings, "missingCount": len(missing), "totalCount": len(findings)}
