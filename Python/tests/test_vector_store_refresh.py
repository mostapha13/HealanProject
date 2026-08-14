import pytest

from app.data.base import Document
from app.rag.vector_store import VectorStore


class FakeCollection:
    def __init__(self, ids, *, fail_upsert=False):
        self.ids = list(ids)
        self.fail_upsert = fail_upsert
        self.deleted = []

    def upsert(self, *, ids, documents, metadatas):
        if self.fail_upsert:
            raise RuntimeError("embedding failed")
        for item_id in ids:
            if item_id not in self.ids:
                self.ids.append(item_id)

    def get(self, *, include):
        return {"ids": list(self.ids)}

    def delete(self, *, ids):
        self.deleted.extend(ids)
        self.ids = [item_id for item_id in self.ids if item_id not in ids]


def make_store(collection):
    store = VectorStore.__new__(VectorStore)
    store._collection = collection
    return store


def test_refresh_upserts_before_deleting_stale_documents():
    collection = FakeCollection(["old", "keep"])
    store = make_store(collection)
    documents = [
        Document(id="keep", content="updated", metadata={}),
        Document(id="new", content="new", metadata={}),
    ]

    assert store.synchronize_documents(documents) == 2
    assert collection.deleted == ["old"]
    assert set(collection.ids) == {"keep", "new"}


def test_failed_refresh_does_not_delete_existing_documents():
    collection = FakeCollection(["old"], fail_upsert=True)
    store = make_store(collection)

    with pytest.raises(RuntimeError, match="embedding failed"):
        store.synchronize_documents([Document(id="new", content="new", metadata={})])

    assert collection.ids == ["old"]
    assert collection.deleted == []


def test_empty_source_preserves_existing_documents():
    collection = FakeCollection(["old"])
    store = make_store(collection)

    with pytest.raises(ValueError, match="existing index was preserved"):
        store.synchronize_documents([])

    assert collection.ids == ["old"]
    assert collection.deleted == []
