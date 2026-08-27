import asyncio
from app.knowledge.models import KnowledgeDocument
from app.knowledge.normalization import normalize_persian, normalize_for_search
from app.knowledge.html_sanitizer import html_to_text
from app.knowledge.preprocessing import prepare_document
from app.knowledge.content_policy import decide_route
from app.knowledge.chunking import chunk_document
from app.knowledge.embedding import HashingEmbeddingProvider
from app.knowledge.service import KnowledgeService, _lexical_probes

class RecordingEmbeddingProvider(HashingEmbeddingProvider):
    def __init__(self,dimension=32):
        super().__init__(dimension); self.batch_sizes=[]
    async def embed(self,texts):
        self.batch_sizes.append(len(texts))
        return await super().embed(texts)

class ContendedEmbeddingProvider(HashingEmbeddingProvider):
    def __init__(self,dimension=32):
        super().__init__(dimension)
        self.calls=[]
        self.first_started=asyncio.Event()
        self.release_first=asyncio.Event()
    async def embed(self,texts):
        self.calls.append(list(texts))
        if len(self.calls)==1:
            self.first_started.set()
            await self.release_first.wait()
        return await super().embed(texts)

class FakeStore:
    def __init__(self): self.rows=[]
    async def ensure_collection(self,dimension): self.dimension=dimension
    async def delete_document(self,document_id): self.rows=[x for x in self.rows if x["payload"]["document_id"]!=document_id]
    async def archive_document(self,document_id,content_hash,effective_to):
        for x in list(self.rows):
            if x["payload"]["document_id"]!=document_id: continue
            archived={**x,"payload":{**x["payload"]}}
            archived["payload"]["document_id"]=f"{document_id}:history:{content_hash[:16]}"
            archived["payload"]["metadata"]={**(x["payload"].get("metadata") or {}),"is_current":False,"effective_to":effective_to,"archived_from":document_id}
            self.rows.append(archived)
    async def get_document_hashes(self,document_ids):
        wanted=set(document_ids); out={}
        for x in self.rows:
            p=x["payload"]
            if p.get("document_id") in wanted:
                h=(p.get("metadata") or {}).get("content_hash")
                if h: out[p["document_id"]]=h
        return out
    async def get_document_text_hashes(self,document_ids):
        wanted=set(document_ids); out={}
        for x in self.rows:
            p=x["payload"]
            if p.get("document_id") in wanted:
                h=(p.get("metadata") or {}).get("text_hash")
                if h: out[p["document_id"]]=h
        return out
    async def get_document_chunks(self,document_ids):
        wanted=set(document_ids); out={x:[] for x in wanted}
        for x in self.rows:
            payload=x["payload"]
            if payload.get("document_id") in wanted: out[payload["document_id"]].append(payload)
        for chunks in out.values(): chunks.sort(key=lambda x:x.get("ordinal",0))
        return out
    async def upsert(self,chunks,vectors):
        for c,v in zip(chunks,vectors):
            self.rows.append({"id":c.chunk_id,"score":sum(a*b for a,b in zip(v,v)),"vector":v,"payload":{"document_id":c.document_id,"source_type":c.source_type,"source_id":c.source_id,"title":c.title,"text":c.text,"ordinal":c.ordinal,"url":c.url,"symbol":c.symbol,"category":c.category,"published_at":c.published_at,"metadata":c.metadata}})
    async def search(self,vector,limit,filters):
        out=[]
        for x in self.rows:
            p=x["payload"]
            if any(filters.get(k) and p.get(k)!=filters[k] for k in ("source_type","symbol","category")): continue
            meta=p.get("metadata") or {}
            if any(filters.get(k) is not None and meta.get(k)!=filters[k] for k in ("route","content_type_id")): continue
            language_id=filters.get("language_id")
            if language_id==1 and meta.get("language_id") not in (None,1): continue
            if language_id not in (None,1) and meta.get("language_id")!=language_id: continue
            if filters.get("topic") and filters["topic"] not in (meta.get("topics") or []): continue
            if filters.get("company") and filters["company"] not in (meta.get("companies") or []): continue
            if filters.get("current_only") is True and meta.get("is_current") is False: continue
            # False means history is permitted alongside current material.
            pub=p.get("published_at")
            if filters.get("date_from") and (not pub or pub < filters["date_from"]): continue
            if filters.get("date_to") and (not pub or pub > filters["date_to"]): continue
            y=dict(x); y["score"]=sum(a*b for a,b in zip(vector,x["vector"])); out.append(y)
        return sorted(out,key=lambda x:x["score"],reverse=True)[:limit*4]

def test_persian_normalization():
    assert normalize_persian("شركت  توسعه‌ي  بازار") == "شرکت توسعه‌ی بازار"
    assert normalize_for_search("شرکت توسعه‌ی بازار") == "شرکت توسعه ی بازار"
    assert normalize_persian("استراتژیهای برنامهریزی و برنامههای توسعهای اجرا میشود") == "استراتژی‌های برنامه‌ریزی و برنامه‌های توسعه‌ای اجرا می‌شود"
    assert normalize_for_search("بازار خصوصی چیست؟") == "بازار خصوصی چیست"


def test_lexical_probes_preserve_market_identifiers_and_entity_phrases():
    assert "صدار704" in _lexical_probes("حسابرس اوراق صدار 704 را نام ببر")
    assert "سبز آبنوس" in _lexical_probes("بازارگردان صندوق سبز آبنوس کیست؟")
    assert "سبز آبنوس" in _lexical_probes("بازارگردان و کارگزار بازارگردان سبز آبنوس کیا هستند؟")
    assert "صندوق دلتا" in _lexical_probes("بازارگردان و کارگزار بازارگردان صندوق دلتا را بگو")
    assert "ناشران پذیرش" in _lexical_probes("در صنعت خودرو چند ناشر پذیرفته‌شده وجود داشت؟")
    assert "موسسین" in _lexical_probes("بنیان‌گذاران صندوق دلتا چه شرکت‌هایی هستند؟")
    assert "فرآیندهای پذیرش" in _lexical_probes("کدام فرایندهای پذیرش الکترونیکی می‌شود؟")
    assert "دلتا" in _lexical_probes("بنیان‌گذاران صندوق دلتا چه شرکت‌هایی هستند؟")

def test_chunk_ids_are_stable():
    d=KnowledgeDocument("d1","notice","1","عنوان","متن "*800)
    a=chunk_document(d); b=chunk_document(d)
    assert len(a)>1 and [x.chunk_id for x in a]==[x.chunk_id for x in b]

def test_embedding_micro_batches_preserve_order_and_bound_request_size():
    async def run():
        provider=RecordingEmbeddingProvider()
        texts=[f"document {i}" for i in range(53)]
        expected=await HashingEmbeddingProvider(32).embed(texts)
        actual=await provider.embed_batched(texts,batch_size=8)
        assert provider.batch_sizes==[8,8,8,8,8,8,5]
        assert actual==expected
    asyncio.run(run())

def test_index_batches_chunks_across_documents():
    async def run():
        store=FakeStore(); provider=RecordingEmbeddingProvider(32)
        svc=KnowledgeService(store,provider)
        docs=[KnowledgeDocument(f"d{i}","faq",str(i),f"Question {i}",f"Answer {i}") for i in range(25)]
        result=await svc.index(docs)
        assert result["documents"]==25 and result["chunks"]==25
        assert provider.batch_sizes==[8,8,8,1]
        assert len(store.rows)==25
    asyncio.run(run())

def test_chat_retrieval_embedding_preempts_remaining_index_batches(monkeypatch):
    async def run():
        monkeypatch.setenv("EMBEDDING_MAX_CONCURRENCY","1")
        monkeypatch.setenv("EMBEDDING_INDEX_BATCH_SIZE","8")
        store=FakeStore(); embeddings=ContendedEmbeddingProvider(); svc=KnowledgeService(store,embeddings)
        docs=[KnowledgeDocument(f"doc:{i}","faq",str(i),f"عنوان {i}",f"متن کامل سند {i}") for i in range(9)]
        indexing=asyncio.create_task(svc.index(docs))
        await embeddings.first_started.wait()
        retrieval=asyncio.create_task(svc.retrieve("پرسش فوری کاربر",limit=2))
        await asyncio.sleep(0)
        embeddings.release_first.set()
        await asyncio.gather(indexing,retrieval)
        assert embeddings.calls[1]==["پرسش فوری کاربر"]
        assert len(embeddings.calls)==3
    asyncio.run(run())

def test_hybrid_retrieval_and_metadata_filter():
    async def run():
        store=FakeStore(); svc=KnowledgeService(store,HashingEmbeddingProvider(128))
        await svc.index([
            KnowledgeDocument("d1","notice","n1","افزایش سرمایه فولاد","شرکت فولاد از محل سود انباشته افزایش سرمایه می دهد",symbol="فولاد",category="corporate_action"),
            KnowledgeDocument("d2","manager","m1","مدیرعامل شرکت خودرو","مدیرعامل شرکت خودرو معرفی شد",symbol="خودرو",category="manager"),
        ])
        r=await svc.retrieve("افزایش سرمایه فولاد",limit=5,symbol="فولاد")
        assert r["count"]==1
        assert r["items"][0]["source"]["document_id"]=="d1"
        assert r["items"][0]["keyword_score"]>0
    asyncio.run(run())


def test_multi_query_retrieval_uses_one_bounded_embedding_batch():
    async def run():
        store=FakeStore(); provider=RecordingEmbeddingProvider(64); svc=KnowledgeService(store,provider)
        await svc.index([
            KnowledgeDocument("person:a","organization_person","1","مدیر الف","مدیر الف دارای سابقه بازار سرمایه است",metadata={"language_id":1}),
            KnowledgeDocument("person:b","organization_person","2","مدیر ب","مدیر ب دارای سابقه فناوری است",metadata={"language_id":1}),
        ])
        provider.batch_sizes.clear()
        results=await svc.retrieve_many(["سابقه مدیر الف","سابقه مدیر ب"],limit=4,language_id=1,current_only=False)
        assert provider.batch_sizes==[2]
        assert len(results)==2 and all(result["query"].startswith("سابقه مدیر") for result in results)
    asyncio.run(run())


def test_persian_paraphrases_keep_exact_bond_evidence():
    async def run():
        store=FakeStore(); svc=KnowledgeService(store,HashingEmbeddingProvider(128))
        await svc.index([
            KnowledgeDocument(
                "iran-dar-bond","cms_content","704","اوراق مرابحه شرکت ایراندار",
                "اوراق مرابحه ایراندار با نماد صدار704 برای خرید مواد اولیه منتشر شد. "
                "بازارگردان آن صندوق سرمایه گذاری اختصاصی بازارگردانی الگوریتم سرآمد بازار و "
                "حسابرس آن موسسه حسابرسی بیات رایان است.",
                metadata={"content_type_id":1,"language_id":1})
        ])
        for query in (
            "اوراق صدار704 برای چه هدفی منتشر شده؟",
            "بازارگردان صدار704 کدام صندوق است؟",
            "حسابرس اوراق صدار 704 را نام ببر",
        ):
            result=await svc.retrieve(query,limit=8,language_id=1)
            assert result["count"]==1, query
            assert result["items"][0]["source"]["document_id"]=="iran-dar-bond"
    asyncio.run(run())

def test_retrieval_returns_reassembled_parent_document_not_only_matched_chunk():
    async def run():
        store=FakeStore(); svc=KnowledgeService(store,HashingEmbeddingProvider(128))
        beginning="این بخش آغاز سند و معرفی سیاست نگهداری سوابق است."
        ending="مصطفی مهدوی مدیرعامل جدید سازمان است و سوابق مدیر قبلی نیز حفظ می‌شود."
        body=beginning+(" توضیحات تکمیلی درباره سازمان و ساختار اطلاعات."*45)+ending
        await svc.index([KnowledgeDocument("long-manager-policy","faq","91","مدیرعامل جدید سازمان کیست؟",body,metadata={"language_id":1})])
        result=await svc.retrieve("مصطفی مهدوی مدیرعامل جدید سازمان کیست؟",limit=5,language_id=1)
        assert result["count"]==1
        item=result["items"][0]
        assert beginning in item["text"] and ending in item["text"]
        assert item["metadata"]["retrieval_scope"]=="parent_document"
        assert item["metadata"]["document_chunk_count"]>1
        assert item["text"].count("توضیحات تکمیلی") == 45
    asyncio.run(run())

def test_full_text_display_directive_does_not_block_parent_retrieval():
    async def run():
        store=FakeStore(); svc=KnowledgeService(store,HashingEmbeddingProvider(128))
        body="مشتریان بازار سرمایه پس از دریافت کد معاملاتی می‌توانند سفارش خود را از مسیرهای مختلف ثبت کنند."
        await svc.index([KnowledgeDocument("access","faq","488","دسترسی مشتریان بازار سرمایه",body,metadata={"language_id":1})])
        result=await svc.retrieve("متن کامل دسترسی مشتریان بازار سرمایه را بده",limit=5,language_id=1)
        assert result["count"]==1 and result["items"][0]["source"]["document_id"]=="access"
    asyncio.run(run())


def test_html_sanitizer_removes_scripts_and_preserves_blocks():
    raw="<h1>عنوان</h1><script>alert(1)</script><p>متن&nbsp;اصلی</p><ul><li>یک</li><li>دو</li></ul>"
    text=html_to_text(raw)
    assert "alert" not in text and "عنوان" in text and "متن اصلی" in text and "• یک" in text


def test_content_type_routing_is_fail_closed():
    assert decide_route("cms_content",1,"خبر معتبر").route=="rag"
    assert decide_route("cms_content",3,"بنر").indexable is False
    assert decide_route("cms_content",999,"ناشناخته").indexable is False
    x=decide_route("cms_content",13,"پارامترهای بازارگردانی")
    assert x.route=="hybrid" and x.authority=="descriptive_only"


def test_prepare_faq_cleans_html_and_adds_hash_topics():
    d=KnowledgeDocument("faq:1","faq","1","افزایش سرمایه چیست؟","<p>افزایش سرمایه از روش‌های مختلف انجام می‌شود.</p>",metadata={"language_id":1})
    clean,reason=prepare_document(d)
    assert clean is not None and reason=="faq"
    assert "<p>" not in clean.body
    assert clean.metadata["route"]=="rag"
    assert len(clean.metadata["content_hash"])==64
    assert "capital_increase" in clean.metadata["topics"]


def test_cms_placeholder_title_is_derived_and_short_noise_is_rejected():
    useful=KnowledgeDocument(
        "cms_content:100756","cms_content","100756","Content 100756",
        "<p>اوراق گواهی اعتبار مولد بانک ملت با نماد اگ050512 در بازار اوراق بدهی درج شد.</p>",
        metadata={"content_type_id":1,"language_id":1})
    clean,reason=prepare_document(useful)
    assert clean is not None and reason=="cms-rag-first"
    assert clean.title.startswith("اوراق گواهی اعتبار مولد") and clean.title!="Content 100756"

    noise=KnowledgeDocument(
        "cms_content:9","cms_content","9","Content 9","<p>testtest</p>",
        metadata={"content_type_id":1,"language_id":1})
    clean,reason=prepare_document(noise)
    assert clean is None and reason=="cms-body-too-short-without-title"


def test_deleted_document_removes_existing_vector():
    async def run():
        store=FakeStore(); svc=KnowledgeService(store,HashingEmbeddingProvider(64))
        d=KnowledgeDocument("d1","faq","1","سؤال","پاسخ")
        r1=await svc.index([d]); assert r1["documents"]==1 and len(store.rows)>0
        tomb=KnowledgeDocument("d1","faq","1","سؤال","پاسخ",metadata={"is_deleted":True})
        r2=await svc.index([tomb]); assert r2["deleted"]==1 and store.rows==[]
    asyncio.run(run())


def test_unchanged_content_hash_skips_reembedding():
    async def run():
        store=FakeStore(); svc=KnowledgeService(store,HashingEmbeddingProvider(64))
        d=KnowledgeDocument("d1","faq","1","سؤال","پاسخ")
        a=await svc.index([d]); b=await svc.index([d])
        assert a["documents"]==1 and b["unchanged"]==1 and b["documents"]==0
    asyncio.run(run())


def test_new_only_policy_does_not_replace_existing_document():
    async def run():
        store=FakeStore(); svc=KnowledgeService(store,HashingEmbeddingProvider(64))
        first=KnowledgeDocument("d1","faq","1","Question","Original answer",metadata={"vectorization_policy":"NewOnly"})
        changed=KnowledgeDocument("d1","faq","1","Question","Changed answer",metadata={"vectorization_policy":"NewOnly"})
        a=await svc.index([first]); original=store.rows[0]["payload"]["text"]
        b=await svc.index([changed])
        assert a["documents"]==1 and b["policy_skipped"]==1
        assert store.rows[0]["payload"]["text"]==original
    asyncio.run(run())


def test_current_projection_removes_non_current_version():
    async def run():
        store=FakeStore(); svc=KnowledgeService(store,HashingEmbeddingProvider(64))
        current=KnowledgeDocument("manager:it","manager","it","IT Manager","Ms A",metadata={"vectorization_policy":"CurrentProjection","is_current":True})
        former=KnowledgeDocument("manager:it","manager","it","Former IT Manager","Ms A",metadata={"vectorization_policy":"CurrentProjection","is_current":False})
        await svc.index([current]); result=await svc.index([former])
        assert result["policy_skipped"]==1 and store.rows==[]
    asyncio.run(run())


def test_current_projection_archives_changed_current_version():
    async def run():
        store=FakeStore(); svc=KnowledgeService(store,HashingEmbeddingProvider(64))
        old=KnowledgeDocument("manager:it","manager","it","IT Manager","Mr A",metadata={"vectorization_policy":"CurrentProjection","is_current":True})
        new=KnowledgeDocument("manager:it","manager","it","IT Manager","Ms B",metadata={"vectorization_policy":"CurrentProjection","is_current":True})
        await svc.index([old]); await svc.index([new])
        current=[x for x in store.rows if x["payload"]["document_id"]=="manager:it"]
        history=[x for x in store.rows if x["payload"]["document_id"].startswith("manager:it:history:")]
        assert len(current)==1 and current[0]["payload"]["text"]=="Ms B"
        assert len(history)==1 and history[0]["payload"]["metadata"]["is_current"] is False
    asyncio.run(run())


def test_current_projection_does_not_archive_metadata_only_change():
    async def run():
        store=FakeStore(); svc=KnowledgeService(store,HashingEmbeddingProvider(64))
        old=KnowledgeDocument("manager:it","manager","it","IT Manager","Mr A",metadata={"vectorization_policy":"CurrentProjection","is_current":True})
        tagged=KnowledgeDocument("manager:it","manager","it","IT Manager","Mr A",metadata={"vectorization_policy":"CurrentProjection","is_current":True,"language_id":1})
        await svc.index([old]); await svc.index([tagged])
        current=[x for x in store.rows if x["payload"]["document_id"]=="manager:it"]
        history=[x for x in store.rows if x["payload"]["document_id"].startswith("manager:it:history:")]
        assert len(current)==1 and history==[]
    asyncio.run(run())


def test_persian_filter_includes_legacy_documents_without_language_tag():
    async def run():
        store=FakeStore(); svc=KnowledgeService(store,HashingEmbeddingProvider(64))
        await svc.index([
            KnowledgeDocument("legacy-fa","faq","1","سؤال فارسی","پاسخ فارسی"),
            KnowledgeDocument("english","faq","2","English question","English answer",metadata={"language_id":2}),
        ])
        fa=await svc.retrieve("سؤال فارسی",limit=10,language_id=1)
        en=await svc.retrieve("English question",limit=10,language_id=2)
        assert [x["source"]["document_id"] for x in fa["items"]]==["legacy-fa"]
        assert [x["source"]["document_id"] for x in en["items"]]==["english"]
    asyncio.run(run())


def test_retrieval_drops_semantically_near_but_lexically_unrelated_documents():
    async def run():
        store=FakeStore(); svc=KnowledgeService(store,HashingEmbeddingProvider(64))
        await svc.index([
            KnowledgeDocument("manager","organization_person","1","مدیرعامل بورس تهران","نام: محمود گودرزی",metadata={"language_id":1}),
            KnowledgeDocument("faq","faq","2","قوانین بازار سرمایه","توضیحات عمومی بازار",metadata={"language_id":1}),
        ])
        relevant=await svc.retrieve("مدیرعامل بورس تهران کیه؟",limit=8,language_id=1)
        unrelated=await svc.retrieve("آشپزی فضایی چگونه است؟",limit=8,language_id=1)
        assert [x["source"]["document_id"] for x in relevant["items"]]==["manager"]
        assert unrelated["items"]==[]
    asyncio.run(run())


def test_retrieval_drops_related_but_materially_weaker_tail():
    async def run():
        store=FakeStore(); svc=KnowledgeService(store,HashingEmbeddingProvider(64))
        await svc.index([
            KnowledgeDocument("exact","organization_person","1","مدیرعامل بورس تهران","محمود گودرزی مدیرعامل بورس تهران است",metadata={"language_id":1}),
            KnowledgeDocument("weak","faq","2","شرح مسئولیت مدیرعامل","مدیرعامل مسئول پاسخگویی است",metadata={"language_id":1}),
        ])
        result=await svc.retrieve("مدیرعامل بورس تهران کیه؟",limit=8,language_id=1)
        assert result["items"][0]["source"]["document_id"]=="exact"
        assert all(x["source"]["document_id"]!="weak" for x in result["items"])
    asyncio.run(run())


def test_historical_scope_keeps_current_projection_and_exact_dated_evidence():
    async def run():
        store=FakeStore(); svc=KnowledgeService(store,HashingEmbeddingProvider(64))
        await svc.index([
            KnowledgeDocument(
                "person:asgar","organization_person","77","عسگر نوربخش",
                "عسگر نوربخش نائب رئیس هیئت مدیره بورس تهران است.",
                metadata={"language_id":1,"is_current":True}),
            KnowledgeDocument(
                "news:93747","cms_content","93747","انتخاب هیئت مدیره بورس تهران",
                "عسگر نوربخش به نمایندگی از سرمایه گذاری تدبیر انتخاب شد.",
                published_at="2024-12-21T00:00:00+00:00",
                metadata={"language_id":1,"content_type_id":1,"is_current":False}),
        ])
        current=await svc.retrieve("عسگر نوربخش",limit=8,language_id=1)
        historical=await svc.retrieve("عسگر نوربخش",limit=8,language_id=1,current_only=False)
        current_ids={x["source"]["document_id"] for x in current["items"]}
        historical_ids={x["source"]["document_id"] for x in historical["items"]}
        assert current_ids=={"person:asgar"}
        assert {"person:asgar","news:93747"}.issubset(historical_ids)
    asyncio.run(run())


def test_retrieval_drops_visibly_truncated_faq_answer():
    async def run():
        store=FakeStore(); svc=KnowledgeService(store,HashingEmbeddingProvider(64))
        await svc.index([
            KnowledgeDocument("broken","faq","22","چه نهادی مسئول تدوین استراتژی است؟","تدوین استراتژی‌های کلان با نظارت هیئت‌مدیره و",metadata={"language_id":1}),
            KnowledgeDocument("complete","faq","24","نقش واحد برنامه‌ریزی چیست؟","این واحد بر پیشرفت برنامه‌های کلان نظارت می‌کند.",metadata={"language_id":1}),
        ])
        broken=await svc.retrieve("چه نهادی مسئول تدوین استراتژی است؟",limit=8,source_type="faq",language_id=1)
        assert all(x["source"]["document_id"]!="broken" for x in broken["items"])
    asyncio.run(run())


def test_retrieval_rejects_broad_topic_match_that_does_not_answer_question():
    async def run():
        store=FakeStore(); svc=KnowledgeService(store,HashingEmbeddingProvider(64))
        await svc.index([
            KnowledgeDocument("broad","faq","340","برنامه‌های توسعه‌ای بورس تهران در چه حوزه‌هایی است؟","این برنامه‌ها با اهداف کلان و استراتژی بورس هم‌راستا هستند.",metadata={"language_id":1}),
        ])
        result=await svc.retrieve("چه نهادی مسئول تدوین استراتژی‌های کلان بورس تهران است؟",limit=8,source_type="faq",language_id=1)
        assert result["items"]==[]
    asyncio.run(run())


def test_download_center_is_metadata_only_hybrid():
    d=KnowledgeDocument("download_center:10","download_center","10","گزارش ماهانه","شرح گزارش",url="https://example.test/page")
    clean,_=prepare_document(d)
    assert clean is not None
    assert clean.metadata["route"]=="hybrid"
    assert clean.metadata["authority"]=="metadata_only"
    assert clean.metadata["download_mode"]=="page_link_only"


def test_search_normalizes_persian_and_arabic_digits():
    assert normalize_for_search("۱۴۰۵/٠٥/20") == "1405 05 20"


def test_retrieve_can_filter_by_route_and_content_type():
    async def run():
        store=FakeStore(); svc=KnowledgeService(store,HashingEmbeddingProvider(64))
        await svc.index([
            KnowledgeDocument("c1","cms_content","1","خبر فولاد","متن خبر فولاد",metadata={"content_type_id":1,"language_id":1}),
            KnowledgeDocument("c2","cms_content","2","بازارگردانی","متن پارامترهای بازارگردانی",metadata={"content_type_id":13,"language_id":1}),
        ])
        r=await svc.retrieve("فولاد",limit=10,route="rag",content_type_id=1,language_id=1)
        assert r["count"]==1 and r["items"][0]["source"]["document_id"]=="c1"
    asyncio.run(run())

def test_advanced_retrieval_latest_news_prefers_fresh_document():
    async def run():
        store=FakeStore(); svc=KnowledgeService(store,HashingEmbeddingProvider(64))
        await svc.index([
            KnowledgeDocument("old","cms_content","1","خبر فولاد","فولاد افزایش سرمایه داد",symbol="فولاد",published_at="2024-01-01T00:00:00+00:00",metadata={"content_type_id":1,"language_id":1}),
            KnowledgeDocument("new","cms_content","2","خبر جدید فولاد","فولاد افزایش سرمایه جدید اعلام کرد",symbol="فولاد",published_at="2026-08-10T00:00:00+00:00",metadata={"content_type_id":1,"language_id":1}),
        ])
        r=await svc.retrieve("آخرین خبر فولاد",limit=5,symbol="فولاد")
        assert r["latest_first"] is True
        assert r["items"][0]["source"]["document_id"]=="new"
        assert "bm25_score" in r["items"][0] and "freshness_score" in r["items"][0]
    asyncio.run(run())


def test_latest_news_prefers_newest_known_document_even_when_dataset_is_old():
    async def run():
        store=FakeStore(); svc=KnowledgeService(store,HashingEmbeddingProvider(64))
        await svc.index([
            KnowledgeDocument("old","cms_content","1","خبر بورس تهران","گزارش بورس تهران",published_at="2013-05-13T10:00:00+00:00",metadata={"content_type_id":1,"language_id":1}),
            KnowledgeDocument("newer","cms_content","2","خبر بورس تهران","گزارش بورس تهران",published_at="2019-11-02T10:00:00+00:00",metadata={"content_type_id":1,"language_id":1}),
        ])
        r=await svc.retrieve("آخرین خبر بورس تهران",limit=2,language_id=1)
        assert r["items"][0]["source"]["document_id"]=="newer"
        assert r["items"][0]["freshness_score"]==1.0
    asyncio.run(run())


def test_advanced_retrieval_content_type_is_inferred_for_news_queries():
    async def run():
        store=FakeStore(); svc=KnowledgeService(store,HashingEmbeddingProvider(64))
        await svc.index([
            KnowledgeDocument("news","cms_content","1","خبر وتجارت","اطلاعیه وتجارت",symbol="وتجارت",metadata={"content_type_id":1,"language_id":1}),
            KnowledgeDocument("other","cms_content","2","محتوای وتجارت","آموزش وتجارت",symbol="وتجارت",metadata={"content_type_id":2,"language_id":1}),
        ])
        r=await svc.retrieve("آخرین خبر وتجارت",limit=10,symbol="وتجارت")
        assert r["filters"]["content_type_id"]==1
        assert all(x["source"]["document_id"]=="news" for x in r["items"])
    asyncio.run(run())


def test_advanced_retrieval_metadata_topic_and_company_filters():
    async def run():
        store=FakeStore(); svc=KnowledgeService(store,HashingEmbeddingProvider(64))
        await svc.index([
            KnowledgeDocument("a","cms_content","1","مجمع فولاد","اطلاعیه مجمع",metadata={"content_type_id":1,"language_id":1,"topics":["assembly"],"companies":["فولاد مبارکه"]}),
            KnowledgeDocument("b","cms_content","2","خبر دیگر","متن دیگر",metadata={"content_type_id":1,"language_id":1,"topics":["dividend"],"companies":["شرکت دیگر"]}),
        ])
        r=await svc.retrieve("مجمع",limit=10,topic="assembly",company="فولاد مبارکه")
        assert r["count"]>=1 and all(x["source"]["document_id"]=="a" for x in r["items"])
    asyncio.run(run())
