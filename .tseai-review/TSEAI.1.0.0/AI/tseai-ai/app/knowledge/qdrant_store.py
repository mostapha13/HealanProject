from __future__ import annotations
import asyncio
import os
import uuid
from typing import Any
import httpx
from .models import KnowledgeChunk

class QdrantKnowledgeStore:
    def __init__(self,base_url:str|None=None,collection:str|None=None):
        self.base=(base_url or os.getenv("QDRANT_URL","http://qdrant:6333")).rstrip("/")
        self.collection=collection or os.getenv("QDRANT_KNOWLEDGE_COLLECTION","tseai_knowledge_v1")
        self._ensured_dimension=None
        self._ensure_lock=asyncio.Lock()
    async def ensure_collection(self,dimension:int):
        if self._ensured_dimension==dimension:return
        async with self._ensure_lock:
            if self._ensured_dimension==dimension:return
            async with httpx.AsyncClient(timeout=20) as c:
                r=await c.get(f"{self.base}/collections/{self.collection}")
                if r.status_code==404:
                    x=await c.put(f"{self.base}/collections/{self.collection}",json={"vectors":{"size":dimension,"distance":"Cosine"}}); x.raise_for_status()
                else: r.raise_for_status()
                for field,schema in (("document_id","keyword"),("source_type","keyword"),("symbol","keyword"),("category","keyword"),("published_at","datetime"),("metadata.route","keyword"),("metadata.content_type_id","integer"),("metadata.language_id","integer"),("metadata.topics","keyword"),("metadata.companies","keyword"),("metadata.symbols","keyword"),("metadata.is_current","bool")):
                    try:
                        x=await c.put(f"{self.base}/collections/{self.collection}/index",json={"field_name":field,"field_schema":schema})
                        if x.status_code not in (200,201,409): x.raise_for_status()
                    except httpx.HTTPStatusError:
                        # Index creation is an optimization; collection correctness does not depend on it.
                        pass
            self._ensured_dimension=dimension
    async def upsert(self,chunks:list[KnowledgeChunk],vectors:list[list[float]]):
        if not chunks:return
        rows=[]
        for chunk,vector in zip(chunks,vectors,strict=True):
            payload={"document_id":chunk.document_id,"source_type":chunk.source_type,"source_id":chunk.source_id,"title":chunk.title,"text":chunk.text,"ordinal":chunk.ordinal,"url":chunk.url,"symbol":chunk.symbol,"category":chunk.category,"published_at":chunk.published_at,"metadata":chunk.metadata}
            rows.append({"id":chunk.chunk_id,"vector":vector,"payload":payload})
        async with httpx.AsyncClient(timeout=60) as c:
            for start in range(0,len(rows),25):
                r=await c.put(f"{self.base}/collections/{self.collection}/points?wait=true",json={"points":rows[start:start+25]}); r.raise_for_status()
    async def delete_document(self,document_id:str):
        async with httpx.AsyncClient(timeout=30) as c:
            r=await c.post(f"{self.base}/collections/{self.collection}/points/delete?wait=true",json={"filter":{"must":[{"key":"document_id","match":{"value":document_id}}]}}); r.raise_for_status()
    async def archive_document(self,document_id:str,content_hash:str,effective_to:str):
        archive_id=f"{document_id}:history:{content_hash[:16]}"; points=[]; offset=None
        async with httpx.AsyncClient(timeout=60) as c:
            while True:
                body={"filter":{"must":[{"key":"document_id","match":{"value":document_id}}]},"limit":1000,"with_payload":True,"with_vector":True}
                if offset is not None: body["offset"]=offset
                r=await c.post(f"{self.base}/collections/{self.collection}/points/scroll",json=body); r.raise_for_status()
                data=r.json().get("result") or {}
                for row in data.get("points") or []:
                    payload=dict(row.get("payload") or {}); metadata=dict(payload.get("metadata") or {})
                    payload["document_id"]=archive_id; metadata.update({"is_current":False,"effective_to":effective_to,"archived_from":document_id}); payload["metadata"]=metadata
                    ordinal=str(payload.get("ordinal",0)); point_id=str(uuid.uuid5(uuid.NAMESPACE_URL,f"{archive_id}:{ordinal}:{row.get('id')}"))
                    points.append({"id":point_id,"vector":row.get("vector"),"payload":payload})
                offset=data.get("next_page_offset")
                if offset is None: break
            if points:
                r=await c.put(f"{self.base}/collections/{self.collection}/points?wait=true",json={"points":points}); r.raise_for_status()
    async def get_document_hashes(self,document_ids:list[str])->dict[str,str]:
        ids=[x for x in dict.fromkeys(document_ids) if x]
        if not ids:return {}
        result:dict[str,str]={}; offset=None
        async with httpx.AsyncClient(timeout=30) as c:
            while True:
                body={"filter":{"must":[{"key":"document_id","match":{"any":ids}}]},"limit":1000,"with_payload":["document_id","metadata"],"with_vector":False}
                if offset is not None: body["offset"]=offset
                r=await c.post(f"{self.base}/collections/{self.collection}/points/scroll",json=body); r.raise_for_status()
                data=r.json().get("result") or {}; points=data.get("points") or []
                for row in points:
                    payload=row.get("payload") or {}; meta=payload.get("metadata") or {}; doc_id=str(payload.get("document_id") or ""); h=meta.get("content_hash")
                    if doc_id and h: result[doc_id]=str(h)
                offset=data.get("next_page_offset")
                if offset is None: break
        return result
    async def get_document_text_hashes(self,document_ids:list[str])->dict[str,str]:
        ids=[x for x in dict.fromkeys(document_ids) if x]
        if not ids:return {}
        result:dict[str,str]={}; offset=None
        async with httpx.AsyncClient(timeout=30) as c:
            while True:
                body={"filter":{"must":[{"key":"document_id","match":{"any":ids}}]},"limit":1000,"with_payload":["document_id","metadata"],"with_vector":False}
                if offset is not None: body["offset"]=offset
                r=await c.post(f"{self.base}/collections/{self.collection}/points/scroll",json=body); r.raise_for_status()
                data=r.json().get("result") or {}
                for row in data.get("points") or []:
                    payload=row.get("payload") or {}; meta=payload.get("metadata") or {}; doc_id=str(payload.get("document_id") or ""); h=meta.get("text_hash")
                    if doc_id and h: result[doc_id]=str(h)
                offset=data.get("next_page_offset")
                if offset is None: break
        return result
    async def get_document_chunks(self,document_ids:list[str])->dict[str,list[dict[str,Any]]]:
        """Load every stored chunk for the selected parent documents."""
        ids=[x for x in dict.fromkeys(document_ids) if x]
        if not ids:return {}
        result:dict[str,list[dict[str,Any]]]={x:[] for x in ids}; offset=None
        async with httpx.AsyncClient(timeout=30) as c:
            while True:
                body={"filter":{"must":[{"key":"document_id","match":{"any":ids}}]},"limit":1000,"with_payload":True,"with_vector":False}
                if offset is not None: body["offset"]=offset
                r=await c.post(f"{self.base}/collections/{self.collection}/points/scroll",json=body); r.raise_for_status()
                data=r.json().get("result") or {}
                for row in data.get("points") or []:
                    payload=row.get("payload") or {}; doc_id=str(payload.get("document_id") or "")
                    if doc_id in result: result[doc_id].append(payload)
                offset=data.get("next_page_offset")
                if offset is None: break
        for chunks in result.values():
            chunks.sort(key=lambda x:int(x.get("ordinal") or 0))
        return result
    async def search(self,vector:list[float],limit:int,filters:dict[str,Any])->list[dict[str,Any]]:
        must=[]
        for key in ("source_type","symbol","category"):
            value=filters.get(key)
            if value: must.append({"key":key,"match":{"value":value}})
        for key in ("route","content_type_id"):
            value=filters.get(key)
            if value is not None: must.append({"key":f"metadata.{key}","match":{"value":value}})
        language_id=filters.get("language_id"); should=[]
        if language_id==1:
            should=[{"key":"metadata.language_id","match":{"value":1}},{"is_empty":{"key":"metadata.language_id"}}]
        elif language_id is not None:
            must.append({"key":"metadata.language_id","match":{"value":language_id}})
        if filters.get("topic"): must.append({"key":"metadata.topics","match":{"value":filters["topic"]}})
        if filters.get("company"): must.append({"key":"metadata.companies","match":{"value":filters["company"]}})
        date_range={}
        if filters.get("date_from"): date_range["gte"]=filters["date_from"]
        if filters.get("date_to"): date_range["lte"]=filters["date_to"]
        if date_range: must.append({"key":"published_at","range":date_range})
        body={"vector":vector,"limit":max(limit,20),"with_payload":True}
        current_only=filters.get("current_only")
        if current_only is True:
            body["filter"]={"must":must,"must_not":[{"key":"metadata.is_current","match":{"value":False}}]}
        elif current_only is False:
            must.append({"key":"metadata.is_current","match":{"value":False}}); body["filter"]={"must":must}
        elif must:body["filter"]={"must":must}
        if should:
            body.setdefault("filter",{"must":must})["should"]=should
        async with httpx.AsyncClient(timeout=30) as c:
            r=await c.post(f"{self.base}/collections/{self.collection}/points/search",json=body); r.raise_for_status(); return r.json().get("result",[])
