from __future__ import annotations
import asyncio
from collections import Counter
from datetime import datetime, timezone
import math
import os
import re
from .models import KnowledgeDocument
from .chunking import chunk_document
from .embedding import EmbeddingProvider
from .normalization import normalize_for_search
from .preprocessing import prepare_document
from .qdrant_store import QdrantKnowledgeStore

LATEST_TERMS=("آخرین","جدیدترین","جدید","تازه ترین","تازه‌ترین","امروز","اخیر")
NEWS_TERMS=("خبر","اخبار","اطلاعیه")
HISTORY_TERMS=("سابق","سابقه","سوابق","قبلی","پیشین","نماینده","از طرف","از سوی")
RELEVANCE_STOP={"چیست","چیه","کیه","کیست","چه","چه کسی","کسی","کدام","کدوم","چقدر","چند","کیا","دارد","دارند","داره","است","هست","هستند","اند","بود","بودند","شد","شده","شود","میشه","می‌شود","می باشد","می‌باشد","در","از","به","با","برای","را","رو","و","یا","طبق","هر","نظر","وجود","داشت","رسید","نام","ببر","بگو","گفته","داده","آخرین","جدیدترین","تازه","خبر","اخبار","اطلاعیه","وضعیت","متن","کامل","کاملش","کل","اصل","عین","بدون","خلاصه","بده","ده","نمایش","کن"}
INCOMPLETE_END_TERMS={"و","یا","که","اما","ولی","با","از","به","در","برای","تحت","شامل","مشتمل","بر","ضمن","تا"}
RESPONSIBILITY_QUERY_TERMS={"مسئول","نهاد","متولی","عهده"}
RESPONSIBILITY_EVIDENCE_TERMS={"مسئول","نهاد","متولی","عهده","مدیریت"}
GENERIC_PROBE_TERMS={
    "بورس","تهران","شرکت","گروه","صندوق","اوراق","نماد","گزارش","خبر","اطلاعیه","مراسم",
    "مدیر","مدیرعامل","بازار","بازارگردان","کارگزار","ارزش","قیمت","حجم","نرخ","سود","رتبه",
    "صنعت","ناشر","پذیرفته","شده","اعلام","تعداد","سال","ماه","هدف","عامل","پرداخت","تضمین",
    "فروش","نهاد","نهادها","نهادهایی",
}

def _lexical_probes(query:str)->list[str]:
    """Build a few exact probes for identifiers and Persian entity phrases."""
    norm=normalize_for_search(query)
    tokens=norm.split()
    probes=[]
    for match in re.finditer(r"(?P<name>[a-zA-Z\u0600-\u06ff]{2,12})\s*(?P<number>[0-9]{2,12})",norm):
        probes.append(match.group("name")+match.group("number"))
    meaningful=[x for x in tokens if len(x)>1 and x not in RELEVANCE_STOP]
    bigrams=[f"{left} {right}" for left,right in zip(meaningful,meaningful[1:])
             if not any(ch.isdigit() for ch in left+right)]
    # Preserve adjacent domain phrases before isolated tokens. Phrases such as
    # «بازار خصوصی», «ناشر پذیرفته» and «سبز آبنوس» are far more selective
    # than their individual words.
    probes.extend(bigrams[:6])
    # Domain morphology expansion: SQL/CMS prose commonly uses
    # «ناشران پذیرش‌شده» while users naturally ask «ناشر پذیرفته‌شده».
    # Phrase expansion keeps exact retrieval robust without binding it to a
    # particular company, number or test question.
    if "ناشر" in meaningful and "پذیرفته" in meaningful:
        probes.append("ناشران پذیرش")
    # Users say «بنیان‌گذاران» while CMS articles commonly label the same
    # field «موسسین». These are semantic aliases, not question-specific words.
    if any(token.startswith("بنیان") for token in meaningful):
        probes.extend(("موسسین", "موسسان"))
    # Retain the fund name even when it is a single token (for example دلتا).
    # Generic single-word probing remains disabled everywhere else.
    fund_match=re.search(r"(?:^|\s)صندوق\s+(?P<name>[^\s،؟]+)",norm)
    if fund_match:
        fund_name=fund_match.group("name")
        probes.append(f"صندوق {fund_name}")
        # A one-token proper name is often separated from «صندوق» by a long
        # legal title in the document and appears again only after «نماد».
        if fund_name not in {"سرمایه", "سرمایه گذاری", "بخشی", "قابل", "سهامی", "پوشش"}:
            probes.append(fund_name)
    # Qdrant's lexical tokenizer distinguishes آ/ا in the stored original
    # payload. Issue the common CMS spelling as a recall probe; the normalized
    # post-filter still verifies the exact phrase.
    if any(spelling in norm for spelling in ("فرایند", "فرآیند")) and "پذیرش" in norm:
        probes.append("فرآیندهای پذیرش")
    # Identifiers plus adjacent phrases cover the reliable cases without
    # issuing broad single-word scans that can promote unrelated documents.
    return list(dict.fromkeys(x for x in probes if x))[:12]

def _probe_strength(probe:str)->tuple[float,float]:
    """Return (lexical support, distinctive exact-entity support)."""
    tokens=normalize_for_search(probe).split()
    if any(any(ch.isdigit() for ch in token) for token in tokens):
        return 1.0,1.0
    if any(token not in GENERIC_PROBE_TERMS and token not in RELEVANCE_STOP for token in tokens):
        return .95,.95
    return .35,0.0

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
    # Natural Persian questions contain inflected verbs and conversational
    # words that need not appear verbatim in the source. A strong BM25 match on
    # at least two meaningful terms is safe enough to enter the candidate set;
    # dense score, authority and the relative-score tail guard still rank and
    # prune it before anything is exposed to answer synthesis.
    return lexical>0 and (overlap>=required or (overlap>=2 and lexical>=.55))

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

class _EmbeddingPriorityGate:
    """Bound embedding work while always admitting queued chat retrieval before indexing."""
    def __init__(self,capacity:int):
        self._capacity=max(1,capacity)
        self._active=0
        self._waiting_high=0
        self._condition=asyncio.Condition()

    async def high(self,operation):
        async with self._condition:
            self._waiting_high+=1
            try:
                await self._condition.wait_for(lambda:self._active<self._capacity)
                self._active+=1
            finally:
                self._waiting_high-=1
        try:
            return await operation()
        finally:
            await self._release()

    async def low(self,operation):
        async with self._condition:
            await self._condition.wait_for(
                lambda:self._active<self._capacity and self._waiting_high==0)
            self._active+=1
        try:
            return await operation()
        finally:
            await self._release()

    async def _release(self):
        async with self._condition:
            self._active-=1
            self._condition.notify_all()

class KnowledgeService:
    def __init__(self,store:QdrantKnowledgeStore,embeddings:EmbeddingProvider):
        self.store=store
        self.embeddings=embeddings
        concurrency=int(os.getenv("EMBEDDING_MAX_CONCURRENCY","1"))
        self._embedding_gate=_EmbeddingPriorityGate(concurrency)
        self._index_embedding_batch_size=max(1,min(32,int(os.getenv("EMBEDDING_INDEX_BATCH_SIZE","8"))))

    async def _embed_for_retrieval(self,texts:list[str])->list[list[float]]:
        return await self._embedding_gate.high(lambda:self.embeddings.embed(texts))

    async def _embed_for_indexing(self,texts:list[str],batch_size:int=8)->list[list[float]]:
        vectors=[]
        for start in range(0,len(texts),batch_size):
            batch=texts[start:start+batch_size]
            vectors.extend(await self._embedding_gate.low(lambda batch=batch:self.embeddings.embed(batch)))
            # Give an arriving high-priority retrieval coroutine a scheduling
            # opportunity before the next ingestion batch asks for the gate.
            await asyncio.sleep(0)
        return vectors

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
            vectors=await self._embed_for_indexing(
                [f"{c.title}\n{c.text}" for c in pending_chunks],
                batch_size=self._index_embedding_batch_size)
            await self.store.upsert(pending_chunks,vectors)
        return {"documents":document_count,"chunks":chunk_count,"unchanged":unchanged,"policy_skipped":policy_skipped,"skipped":skipped,"deleted":deleted,"routes":dict(routes),"skip_reasons":dict(skip_reasons)}

    async def retrieve(self,query:str,limit:int=8,source_type:str|None=None,symbol:str|None=None,category:str|None=None,route:str|None=None,content_type_id:int|None=None,language_id:int|None=None,date_from:str|None=None,date_to:str|None=None,latest_first:bool|None=None,topic:str|None=None,company:str|None=None,current_only:bool|None=None,_query_vector:list[float]|None=None,_collection_ready:bool=False)->dict:
        if not _collection_ready: await self.store.ensure_collection(self.embeddings.dimension)
        norm=normalize_for_search(query)
        if latest_first is None: latest_first=any(x in norm for x in LATEST_TERMS)
        if content_type_id is None and any(x in norm for x in NEWS_TERMS): content_type_id=1
        if current_only is None: current_only=not any(x in norm for x in HISTORY_TERMS)
        qvec=_query_vector if _query_vector is not None else (await self._embed_for_retrieval([query]))[0]
        filters={"source_type":source_type,"symbol":symbol,"category":category,"route":route,"content_type_id":content_type_id,"language_id":language_id,"date_from":date_from,"date_to":date_to,"topic":topic,"company":company,"current_only":current_only}
        # Latest queries need a wider semantic candidate set; otherwise a highly
        # similar but very old article can hide the newest relevant document.
        # Persian paraphrases can place the correct article outside a tiny dense
        # top-k even when a rare identifier is present. Keep a bounded but wider
        # local candidate pool, then apply lexical relevance and tail pruning.
        pool=max(limit*(40 if latest_first else 30),300 if latest_first else 200)
        if hasattr(self.store,"search_text"):
            results=await asyncio.gather(
                self.store.search(qvec,pool,filters),
                *(self.store.search_text(probe,max(limit*8,40),filters) for probe in _lexical_probes(query)),
            )
            dense=results[0]
            lexical=[]
            for probe,rows in zip(_lexical_probes(query),results[1:]):
                probe_score,distinctive_probe_score=_probe_strength(probe)
                exact_rows=[]
                for row in rows:
                    payload=row.get("payload") or {}
                    searchable=normalize_for_search(f"{payload.get('title','')} {payload.get('text','')}")
                    # Qdrant's full-text matcher may return token matches rather
                    # than a contiguous phrase. The probe boost is reserved for
                    # text that truly contains the normalized identifier/name.
                    if normalize_for_search(probe) not in searchable: continue
                    exact_rows.append(row)
                # A common isolated word must not receive the same boost as a
                # rare identifier. Scale the boost by the exact-match fanout.
                rarity=min(1.0,math.sqrt(3.0/max(1,len(exact_rows))))
                for row in exact_rows:
                    lexical.append({**row,"_lexical_probe_score":probe_score,
                                    "_distinctive_probe_score":distinctive_probe_score*rarity})
        else:
            dense=await self.store.search(qvec,pool,filters)
            lexical=[]
        raw=[]; seen_points={}
        # Dense rows come first so an item found by both routes keeps its real
        # vector score; lexical-only rows are then appended as recall support.
        for row in [*dense,*lexical]:
            point_id=str(row.get("id") or "")
            if point_id and point_id in seen_points:
                existing=raw[seen_points[point_id]]
                existing["_lexical_probe_score"]=max(float(existing.get("_lexical_probe_score",0)),float(row.get("_lexical_probe_score",0)))
                existing["_distinctive_probe_score"]=max(float(existing.get("_distinctive_probe_score",0)),float(row.get("_distinctive_probe_score",0)))
                continue
            if point_id: seen_points[point_id]=len(raw)
            raw.append(row)
        bm25=_bm25_scores(query,raw)
        now=datetime.now(timezone.utc); scored=[]
        parsed_dates=[_parse_dt((row.get("payload") or {}).get("published_at") or ((row.get("payload") or {}).get("metadata") or {}).get("last_modified_at") or ((row.get("payload") or {}).get("metadata") or {}).get("source_collected_at")) for row in raw]
        newest=max((x.astimezone(timezone.utc) for x in parsed_dates if x),default=None)
        qphrase=norm
        for row,lexical,published in zip(raw,bm25,parsed_dates):
            payload=row.get("payload") or {}; meta=payload.get("metadata") or {}
            probe_score=float(row.get("_lexical_probe_score",0))
            distinctive_probe_score=float(row.get("_distinctive_probe_score",0))
            lexical=max(lexical,probe_score)
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
            score=.53*vector+.27*lexical+.07*phrase+.06*entity+.04*freshness+.03*authority_boost+.08*probe_score+.38*distinctive_probe_score
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
            exact=[] if latest_first else [x for x in candidates if float(x[3])>=1.0 or (float(x[2])>=.92 and float(x[0])>=.25)]
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

    async def retrieve_many(self,queries:list[str],limit:int=8,source_type:str|None=None,symbol:str|None=None,category:str|None=None,route:str|None=None,content_type_id:int|None=None,language_id:int|None=None,date_from:str|None=None,date_to:str|None=None,latest_first:bool|None=None,topic:str|None=None,company:str|None=None,current_only:bool|None=None)->list[dict]:
        bounded=list(dict.fromkeys(query.strip() for query in queries if query and query.strip()))[:8]
        if not bounded: return []
        await self.store.ensure_collection(self.embeddings.dimension)
        vectors=await self._embed_for_retrieval(bounded)
        return await asyncio.gather(*(
            self.retrieve(query,limit,source_type,symbol,category,route,content_type_id,language_id,
                          date_from,date_to,latest_first,topic,company,current_only,vector,True)
            for query,vector in zip(bounded,vectors)
        ))
