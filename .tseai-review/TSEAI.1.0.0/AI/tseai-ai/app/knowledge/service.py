from __future__ import annotations
import asyncio
from collections import Counter
from datetime import datetime, timezone
import math
from .models import KnowledgeDocument
from .chunking import chunk_document
from .embedding import EmbeddingProvider
from .normalization import normalize_for_search
from .preprocessing import prepare_document
from .qdrant_store import QdrantKnowledgeStore

LATEST_TERMS=("آخرین","جدیدترین","تازه ترین","تازه‌ترین","امروز","اخیر")
NEWS_TERMS=("خبر","اخبار","اطلاعیه")
HISTORY_TERMS=("سابق","سابقه","سوابق","قبلی","پیشین","نماینده","از طرف","از سوی")
RELEVANCE_STOP={"چیست","چیه","کیه","کیست","چه","دارد","داره","است","هست","بود","شد","شود","میشه","می‌شود","در","از","به","با","برای","را","رو","و","یا","آخرین","جدیدترین","خبر","اخبار","اطلاعیه","وضعیت","متن","کامل","کاملش","کل","اصل","عین","بدون","خلاصه","بده","ده","نمایش","کن"}
INCOMPLETE_END_TERMS={"و","یا","که","اما","ولی","با","از","به","در","برای","تحت","شامل","مشتمل","بر","ضمن","تا"}
RESPONSIBILITY_QUERY_TERMS={"مسئول","نهاد","متولی","عهده"}
RESPONSIBILITY_EVIDENCE_TERMS={"مسئول","نهاد","متولی","عهده","مدیریت"}

def _parse_dt(value):
    if not value:return None
    try:
        s=str(value).strip().replace("Z","+00:00")
        dt=datetime.fromisoformat(s)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except Exception:return None

def _bm25_scores(query:str,rows:list[dict])->list[float]:
    qtokens=[x for x in normalize_for_search(query).split() if x]
    if not qtokens:return [0.0]*len(rows)
    docs=[]; df=Counter(); lengths=[]
    for row in rows:
        p=row.get("payload") or {}; tokens=normalize_for_search(f"{p.get('title','')} {p.get('text','')}").split(); c=Counter(tokens)
        docs.append(c); lengths.append(len(tokens));
        for t in set(qtokens):
            if c.get(t): df[t]+=1
    n=max(1,len(rows)); avgdl=max(1.0,sum(lengths)/n); k1=1.35; b=.72; out=[]
    for c,dl in zip(docs,lengths):
        score=0.0
        for t in qtokens:
            tf=c.get(t,0)
            if not tf: continue
            idf=math.log(1.0+(n-df[t]+0.5)/(df[t]+0.5))
            score += idf*(tf*(k1+1))/(tf+k1*(1-b+b*dl/avgdl))
        out.append(score)
    mx=max(out,default=0.0)
    return [x/mx if mx>0 else 0.0 for x in out]

def _is_relevant(query:str,title:str,text:str,lexical:float,phrase:float)->bool:
    if phrase>0:return True
    query_terms={x for x in normalize_for_search(query).split() if len(x)>1 and x not in RELEVANCE_STOP}
    if not query_terms:return False
    document_terms=set(normalize_for_search(f"{title} {text}").split())
    if query_terms & RESPONSIBILITY_QUERY_TERMS and not document_terms & RESPONSIBILITY_EVIDENCE_TERMS:
        return False
    overlap=len(query_terms & document_terms)
    # A broad topical resemblance is not enough for a user-facing answer.
    # Require coverage of most meaningful query terms so, for example, an FAQ
    # about development plans cannot answer who is responsible for strategy.
    required=1 if len(query_terms)==1 else max(2,math.ceil(len(query_terms)*.65))
    return overlap>=required and lexical>0

def _looks_incomplete(row:dict)->bool:
    payload=row.get("payload") or {}; meta=payload.get("metadata") or {}
    if str(payload.get("source_type") or "").lower()!="faq": return False
    if str(meta.get("body_truncated") or "").lower() in ("1","true","yes"): return True
    text=normalize_for_search(str(payload.get("text") or ""))
    if not text: return True
    return text.split()[-1] in INCOMPLETE_END_TERMS

def _merge_document_chunks(chunks:list[dict])->str:
    """Reassemble a parent document while removing the chunker's overlap."""
    ordered=sorted(chunks,key=lambda x:int(x.get("ordinal") or 0))
    parts=[str(x.get("text") or "").strip() for x in ordered]
    parts=[x for x in parts if x]
    if not parts:return ""
    merged=parts[0]
    for part in parts[1:]:
        max_overlap=min(600,len(merged),len(part)); overlap=0
        for size in range(max_overlap,11,-1):
            if merged[-size:]==part[:size]:
                overlap=size; break
        suffix=part[overlap:].lstrip()
        if suffix: merged=merged.rstrip()+("" if overlap else "\n")+suffix
    return merged.strip()

class KnowledgeService:
    def __init__(self,store:QdrantKnowledgeStore,embeddings:EmbeddingProvider): self.store=store; self.embeddings=embeddings
    async def index(self,docs:list[KnowledgeDocument])->dict:
        await self.store.ensure_collection(self.embeddings.dimension)
        prepared=[]; skipped=deleted=0; skip_reasons=Counter(); routes=Counter()
        for doc in docs:
            clean,reason=prepare_document(doc)
            if clean is None:
                await self.store.delete_document(doc.document_id); skip_reasons[reason]+=1
                if reason=="deleted": deleted+=1
                else: skipped+=1
                continue
            prepared.append(clean); routes[str(clean.metadata.get("route") or "unknown")]+=1
        existing=await self.store.get_document_hashes([d.document_id for d in prepared])
        current_ids=[d.document_id for d in prepared if str(d.metadata.get("vectorization_policy") or "").lower()=="currentprojection"]
        existing_text=await self.store.get_document_text_hashes(current_ids) if current_ids else {}
        document_count=chunk_count=unchanged=policy_skipped=0
        pending_chunks=[]
        for doc in prepared:
            content_hash=str(doc.metadata.get("content_hash") or "")
            policy=str(doc.metadata.get("vectorization_policy") or "ChangedTextOnly").lower()
            is_current=str(doc.metadata.get("is_current",True)).strip().lower() not in ("0","false","no")
            if policy=="never": policy_skipped+=1; continue
            if policy=="newonly" and doc.document_id in existing: policy_skipped+=1; continue
            if policy=="currentprojection" and not is_current:
                await self.store.delete_document(doc.document_id); policy_skipped+=1; continue
            if content_hash and existing.get(doc.document_id)==content_hash: unchanged+=1; continue
            old_text_hash=existing_text.get(doc.document_id)
            if policy=="currentprojection" and existing.get(doc.document_id) and old_text_hash and old_text_hash!=str(doc.metadata.get("text_hash") or ""):
                await self.store.archive_document(doc.document_id,existing[doc.document_id],datetime.now(timezone.utc).isoformat())
            chunks=chunk_document(doc); await self.store.delete_document(doc.document_id)
            if chunks:
                pending_chunks.extend(chunks)
                document_count+=1; chunk_count+=len(chunks)
        if pending_chunks:
            vectors=await self.embeddings.embed_batched([f"{c.title}\n{c.text}" for c in pending_chunks])
            await self.store.upsert(pending_chunks,vectors)
        return {"documents":document_count,"chunks":chunk_count,"unchanged":unchanged,"policy_skipped":policy_skipped,"skipped":skipped,"deleted":deleted,"routes":dict(routes),"skip_reasons":dict(skip_reasons)}

    async def retrieve(self,query:str,limit:int=8,source_type:str|None=None,symbol:str|None=None,category:str|None=None,route:str|None=None,content_type_id:int|None=None,language_id:int|None=None,date_from:str|None=None,date_to:str|None=None,latest_first:bool|None=None,topic:str|None=None,company:str|None=None,current_only:bool|None=None)->dict:
        await self.store.ensure_collection(self.embeddings.dimension)
        norm=normalize_for_search(query)
        if latest_first is None: latest_first=any(x in norm for x in LATEST_TERMS)
        if content_type_id is None and any(x in norm for x in NEWS_TERMS): content_type_id=1
        if current_only is None: current_only=not any(x in norm for x in HISTORY_TERMS)
        qvec=(await self.embeddings.embed([query]))[0]
        filters={"source_type":source_type,"symbol":symbol,"category":category,"route":route,"content_type_id":content_type_id,"language_id":language_id,"date_from":date_from,"date_to":date_to,"topic":topic,"company":company,"current_only":current_only}
        # Latest queries need a wider semantic candidate set; otherwise a highly
        # similar but very old article can hide the newest relevant document.
        pool=max(limit*(40 if latest_first else 12),300 if latest_first else 60)
        if hasattr(self.store,"search_text"):
            dense,lexical=await asyncio.gather(
                self.store.search(qvec,pool,filters),
                self.store.search_text(norm,max(limit*8,40),filters),
            )
        else:
            dense=await self.store.search(qvec,pool,filters)
            lexical=[]
        raw=[]; seen_points=set()
        # Dense rows come first so an item found by both routes keeps its real
        # vector score; lexical-only rows are then appended as recall support.
        for row in [*dense,*lexical]:
            point_id=str(row.get("id") or "")
            if point_id and point_id in seen_points: continue
            if point_id: seen_points.add(point_id)
            raw.append(row)
        bm25=_bm25_scores(query,raw)
        now=datetime.now(timezone.utc); scored=[]
        parsed_dates=[_parse_dt((row.get("payload") or {}).get("published_at") or ((row.get("payload") or {}).get("metadata") or {}).get("last_modified_at") or ((row.get("payload") or {}).get("metadata") or {}).get("source_collected_at")) for row in raw]
        newest=max((x.astimezone(timezone.utc) for x in parsed_dates if x),default=None)
        qphrase=norm
        for row,lexical,published in zip(raw,bm25,parsed_dates):
            payload=row.get("payload") or {}; meta=payload.get("metadata") or {}
            vector=float(row.get("score",0.0)); text=normalize_for_search(f"{payload.get('title','')} {payload.get('text','')}")
            phrase=1.0 if len(qphrase)>=4 and qphrase in text else 0.0
            entity=0.0
            if symbol and (payload.get("symbol")==symbol or symbol in (meta.get("symbols") or [])): entity=1.0
            if company and company in (meta.get("companies") or []): entity=1.0
            freshness=0.0
            if published:
                reference=newest if latest_first and newest else now
                age=max(0.0,(reference-published.astimezone(timezone.utc)).total_seconds()/86400.0)
                freshness=math.exp(-age/(90.0 if latest_first else 45.0))
            route_value=str(meta.get("route") or "")
            authority=str(meta.get("authority") or "")
            authority_boost=1.0 if authority in ("answer_text","descriptive_only") else .5 if authority=="metadata_only" else .7
            score=.53*vector+.27*lexical+.07*phrase+.06*entity+.04*freshness+.03*authority_boost
            if latest_first: score += .42*freshness
            scored.append((score,vector,lexical,phrase,entity,freshness,payload,row.get("id"),route_value,authority))
        scored.sort(key=lambda x:x[0],reverse=True)
        candidates=[]; seen_docs=set()
        for score,vector,lexical,phrase,entity,freshness,payload,cid,route_value,authority in scored:
            if not _is_relevant(query,str(payload.get("title") or ""),str(payload.get("text") or ""),lexical,phrase): continue
            doc_id=str(payload.get("document_id") or "")
            if not doc_id or doc_id in seen_docs: continue
            seen_docs.add(doc_id)
            candidates.append((score,vector,lexical,phrase,entity,freshness,payload,cid))
            # Do not stop at the dense top-k. Exact lexical evidence for a rare
            # Persian name can legitimately score below a short current profile.
            if len(candidates)>=max(limit*4,32): break
        if candidates:
            # Never expose the long semantic tail. Keep only evidence close to the
            # best match, plus exact lexical evidence. The latter preserves source
            # diversity (for example a current SQL projection and a dated CMS news
            # item about the same person) without reopening the weak semantic tail.
            threshold=max(.25,float(candidates[0][0])*.82)
            strong=[x for x in candidates if float(x[0])>=threshold]
            exact=[x for x in candidates if float(x[3])>=1.0 or (float(x[2])>=.92 and float(x[0])>=.25)]
            selected=[]; selected_docs=set()
            for row in sorted([*strong,*exact],key=lambda x:float(x[0]),reverse=True):
                doc_id=str(row[6].get("document_id") or "")
                if not doc_id or doc_id in selected_docs: continue
                selected_docs.add(doc_id); selected.append(row)
                if len(selected)>=min(limit,8): break
            candidates=selected
        parent_chunks=await self.store.get_document_chunks([str(x[6].get("document_id") or "") for x in candidates])
        items=[]
        for score,vector,lexical,phrase,entity,freshness,payload,cid in candidates:
            doc_id=str(payload.get("document_id") or "")
            chunks=parent_chunks.get(doc_id) or [payload]
            parent_text=_merge_document_chunks(chunks)
            parent_payload={**payload,"text":parent_text}
            # Validate FAQ completeness only after reconstructing the whole parent;
            # a middle chunk is naturally incomplete and must not be rejected alone.
            if _looks_incomplete({"payload":parent_payload}): continue
            meta=payload.get("metadata") or {}
            items.append({"chunk_id":cid,"score":round(score,6),"vector_score":round(vector,6),"bm25_score":round(lexical,6),"keyword_score":round(lexical,6),"phrase_score":round(phrase,6),"entity_score":round(entity,6),"freshness_score":round(freshness,6),"title":payload.get("title"),"text":parent_text,"source":{"document_id":payload.get("document_id"),"source_type":payload.get("source_type"),"source_id":payload.get("source_id"),"url":payload.get("url"),"published_at":payload.get("published_at")},"metadata":{"symbol":payload.get("symbol"),"category":payload.get("category"),**meta,"retrieval_scope":"parent_document","document_chunk_count":len(chunks),"matched_chunk_ordinal":int(payload.get("ordinal") or 0)}})
        return {"query":query,"count":len(items),"strategy":"dense+bm25-like+metadata+freshness+parent-document-v2","latest_first":bool(latest_first),"filters":{k:v for k,v in filters.items() if v is not None},"items":items}
