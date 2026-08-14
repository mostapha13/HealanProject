from __future__ import annotations
import asyncio, hashlib, math, os
import httpx
from .normalization import normalize_for_search

class EmbeddingProvider:
    dimension: int
    async def embed(self, texts: list[str]) -> list[list[float]]: raise NotImplementedError

    async def embed_batched(self,texts:list[str],batch_size:int=8)->list[list[float]]:
        """Bound local-model requests while preserving input order."""
        if batch_size<1: raise ValueError("batch_size must be positive")
        vectors=[]
        for start in range(0,len(texts),batch_size):
            vectors.extend(await self.embed(texts[start:start+batch_size]))
        return vectors

class HashingEmbeddingProvider(EmbeddingProvider):
    """Offline deterministic fallback. Production can point EMBEDDING_BASE_URL at a local semantic embedding service."""
    def __init__(self, dimension: int = 384): self.dimension=dimension
    async def embed(self, texts: list[str]) -> list[list[float]]:
        return [self._one(t) for t in texts]
    def _one(self,text:str)->list[float]:
        vec=[0.0]*self.dimension
        normalized=normalize_for_search(text)
        tokens=normalized.split()
        features=tokens+[normalized[i:i+3] for i in range(max(0,len(normalized)-2)) if " " not in normalized[i:i+3]]
        for feature in features:
            digest=hashlib.blake2b(feature.encode("utf-8"),digest_size=8).digest()
            idx=int.from_bytes(digest[:4],"little")%self.dimension
            sign=1.0 if digest[4]&1 else -1.0
            vec[idx]+=sign
        norm=math.sqrt(sum(x*x for x in vec)) or 1.0
        return [x/norm for x in vec]

class HttpEmbeddingProvider(EmbeddingProvider):
    def __init__(self, base_url:str, model:str, dimension:int=384, api_key:str|None=None):
        self.base_url=base_url.rstrip("/"); self.model=model; self.dimension=dimension; self.api_key=api_key
    async def embed(self,texts:list[str])->list[list[float]]:
        headers={"Authorization":f"Bearer {self.api_key}"} if self.api_key else {}
        async with httpx.AsyncClient(timeout=60) as client:
            for attempt in range(4):
                try:
                    r=await client.post(f"{self.base_url}/embeddings",json={"model":self.model,"input":texts},headers=headers)
                    r.raise_for_status(); data=r.json()["data"]
                    break
                except (httpx.ConnectError,httpx.ReadTimeout,httpx.HTTPStatusError) as ex:
                    transient=not isinstance(ex,httpx.HTTPStatusError) or ex.response.status_code in (429,502,503,504)
                    if attempt==3 or not transient: raise
                    await asyncio.sleep(2 ** attempt)
            vectors=[row["embedding"] for row in sorted(data,key=lambda x:x.get("index",0))]
            if vectors: self.dimension=len(vectors[0])
            return vectors

def create_embedding_provider()->EmbeddingProvider:
    base=os.getenv("EMBEDDING_BASE_URL","").strip()
    if base:
        return HttpEmbeddingProvider(base,os.getenv("EMBEDDING_MODEL","multilingual-e5"),int(os.getenv("EMBEDDING_DIMENSION","384")),os.getenv("EMBEDDING_API_KEY") or None)
    return HashingEmbeddingProvider(int(os.getenv("EMBEDDING_DIMENSION","384")))
