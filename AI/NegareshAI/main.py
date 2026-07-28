from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import Response
from io import BytesIO
from pypdf import PdfReader
from docx import Document
from pydantic import BaseModel, Field
from typing import Any
import re
import chromadb
import hashlib
import os
import difflib

app = FastAPI(title="NegareshAI", version="0.1.0")
class HashEmbedding:
    def __call__(self, input):
        return [self._vector(str(value)) for value in input]
    @staticmethod
    def _vector(value: str) -> list[float]:
        raw = hashlib.sha256(value.encode('utf-8')).digest()
        return [((raw[i % len(raw)] / 255.0) * 2.0) - 1.0 for i in range(128)]

class SemanticEmbedding:
    def __init__(self, model_id: str):
        from sentence_transformers import SentenceTransformer
        self.model_id = model_id
        self.model = SentenceTransformer(model_id)
    def __call__(self, input):
        values = [str(value) for value in input]
        return self.model.encode(
            values, normalize_embeddings=True, show_progress_bar=False).tolist()

_embeddings: dict[str, Any] = {}
def embedding_for(model_id: str):
    backend = os.getenv("EMBEDDING_BACKEND", "semantic")
    cache_key = f"{backend}:{model_id}"
    if cache_key not in _embeddings:
        _embeddings[cache_key] = (HashEmbedding() if backend == "hash"
                                  else SemanticEmbedding(model_id))
    return _embeddings[cache_key]

vector_client = chromadb.PersistentClient(path=os.getenv('CHROMA_PERSIST_DIR', '/data/chroma'))
RAG_COLLECTION = os.getenv("RAG_COLLECTION", "negareshai_documents")
DEFAULT_EMBEDDING_MODEL = "BAAI/bge-m3"

class RagContext(BaseModel):
    organizationId: str = Field(min_length=36, max_length=36)
    documentId: str = Field(min_length=36, max_length=36)
    versionId: str = Field(min_length=36, max_length=36)
    embeddingModel: str = Field(default=DEFAULT_EMBEDDING_MODEL, min_length=3)

class PipelineRequest(RagContext):
    fileName: str
    contentBase64: str
    maxChars: int = Field(default=1800, ge=200, le=10000)

class IndexRequest(RagContext):
    chunks: list[dict[str, Any]] = Field(min_length=1)

class SearchRequest(BaseModel):
    organizationId: str = Field(min_length=36, max_length=36)
    query: str = Field(min_length=1)
    documentIds: list[str] | None = None
    limit: int = Field(default=5, ge=1, le=20)
    embeddingModel: str = Field(default=DEFAULT_EMBEDDING_MODEL, min_length=3)

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

def extract_pages(data: bytes, name: str) -> list[dict]:
    if name.lower().endswith(".pdf"):
        reader = PdfReader(BytesIO(data))
        return [{"page": index + 1, "text": page.extract_text() or ""}
                for index, page in enumerate(reader.pages)]
    if name.lower().endswith(".docx"):
        document = Document(BytesIO(data))
        return [{"page": 1, "text": "\n".join(p.text for p in document.paragraphs)}]
    raise HTTPException(415, "Only PDF and DOCX are supported")

def structural_chunks(text: str, max_chars: int = 1800, page: int = 1) -> list[dict]:
    sections = re.split(r"(?m)(?=^\s*(?:ماده|بند|فصل|تبصره|[0-9۰-۹]+[.)-])\s*)", text)
    chunks: list[dict] = []
    for section in sections:
        section = section.strip()
        if not section:
            continue
        for offset in range(0, len(section), max_chars):
            value = section[offset:offset + max_chars].strip()
            if value:
                chunks.append({"text": value, "index": len(chunks), "section": section[:120], "page": page})
    return chunks

def collection_for(model_id: str):
    suffix = hashlib.sha256(model_id.encode("utf-8")).hexdigest()[:12]
    return vector_client.get_or_create_collection(
        f"{RAG_COLLECTION}_{suffix}",
        embedding_function=embedding_for(model_id),
        metadata={"embeddingModel": model_id})

def normalize_persian(value: str) -> str:
    table = str.maketrans("۰۱۲۳۴۵۶۷۸۹يك", "0123456789ییک")
    return re.sub(r"\s+", " ", value.translate(table).replace("٬", "").replace(",", "")).strip().lower()

def numeric_tokens(value: str) -> set[str]:
    return set(re.findall(r"\d+(?:[./-]\d+)*", normalize_persian(value)))

def lexical_score(query: str, document: str) -> float:
    query_tokens = set(re.findall(r"[\w./-]+", normalize_persian(query)))
    document_tokens = set(re.findall(r"[\w./-]+", normalize_persian(document)))
    return len(query_tokens & document_tokens) / max(len(query_tokens), 1)

def index_document_chunks(context: RagContext, chunks: list[dict]) -> int:
    if not chunks:
        return 0
    collection = collection_for(context.embeddingModel)
    prefix = f"{context.organizationId}:{context.documentId}:{context.versionId}:"
    existing = collection.get(where={
        "$and": [
            {"organizationId": context.organizationId},
            {"documentId": context.documentId},
            {"versionId": context.versionId}
        ]
    })
    if existing.get("ids"):
        collection.delete(ids=existing["ids"])
    ids = [f"{prefix}{index}" for index in range(len(chunks))]
    documents = [str(chunk["text"]) for chunk in chunks]
    metadata = [{
        "organizationId": context.organizationId,
        "documentId": context.documentId,
        "versionId": context.versionId,
        "page": int(chunk.get("page", 1)),
        "chunkIndex": index,
        "section": str(chunk.get("section", ""))[:500],
        "numbers": "|".join(sorted(numeric_tokens(str(chunk["text"]))))[:1000]
    } for index, chunk in enumerate(chunks)]
    collection.upsert(ids=ids, documents=documents, metadatas=metadata)
    return len(chunks)

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
async def index_chunks(payload: IndexRequest):
    return {"collection": collection_for(payload.embeddingModel).name,
            "indexed": index_document_chunks(payload, payload.chunks)}

@app.post("/rag/search")
async def search_chunks(payload: SearchRequest):
    collection = collection_for(payload.embeddingModel)
    filters: list[dict[str, Any]] = [{"organizationId": payload.organizationId}]
    if payload.documentIds:
        filters.append({"documentId": {"$in": payload.documentIds}})
    where = filters[0] if len(filters) == 1 else {"$and": filters}
    candidate_count = min(max(payload.limit * 4, payload.limit), collection.count())
    if candidate_count == 0:
        return {"results": [], "embeddingModel": payload.embeddingModel}
    result = collection.query(
        query_texts=[payload.query.strip()], n_results=candidate_count,
        where=where, include=["documents", "metadatas", "distances"])
    documents = result.get("documents", [[]])[0]
    metadatas = result.get("metadatas", [[]])[0]
    distances = result.get("distances", [[]])[0]
    query_numbers = numeric_tokens(payload.query)
    ranked = [{
        "text": text,
        "distance": distances[index],
        "score": (1.0 - float(distances[index]))
                 + (0.25 * lexical_score(payload.query, text))
                 + (0.5 if query_numbers and query_numbers.issubset(numeric_tokens(text)) else 0.0),
        "citation": {
            "documentId": metadata["documentId"],
            "versionId": metadata["versionId"],
            "page": metadata["page"],
            "section": metadata.get("section", "")
        }
    } for index, (text, metadata) in enumerate(zip(documents, metadatas))]
    ranked.sort(key=lambda item: item["score"], reverse=True)
    return {"results": ranked[:payload.limit], "embeddingModel": payload.embeddingModel}

@app.post("/pipeline/process")
async def process_document(payload: PipelineRequest):
    import base64
    try:
        data = base64.b64decode(payload.contentBase64, validate=True)
        pages = extract_pages(data, payload.fileName)
        chunks: list[dict] = []
        for page in pages:
            page_chunks = structural_chunks(page["text"], payload.maxChars, page["page"])
            for chunk in page_chunks:
                chunk["index"] = len(chunks)
                chunks.append(chunk)
        if not chunks:
            return {"status": "ocr_required", "pageCount": len(pages),
                    "characters": 0, "chunkCount": 0}
        indexed = index_document_chunks(payload, chunks)
        return {"status": "ready", "pageCount": len(pages),
                "characters": sum(len(page["text"]) for page in pages),
                "chunkCount": indexed}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(422, f"Document processing failed: {exc}") from exc

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
