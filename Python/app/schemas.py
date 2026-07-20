from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(system|user|assistant)$")
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., min_length=1)
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    max_tokens: int | None = Field(1024, ge=1, le=8192)
    use_medical_prompt: bool = True


class ChatResponse(BaseModel):
    reply: str
    model: str


class SummarizeRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=16000)
    language: str = Field("fa", description="Summary language code, e.g. fa or en")


class SummarizeResponse(BaseModel):
    summary: str
    model: str


class RagAskRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=2000)
    top_k: int | None = Field(None, ge=1, le=20)
    similarity_threshold: float | None = Field(None, ge=0.0, le=1.0)
    answer_mode: str | None = Field("direct", description="direct | llm")


class RagSourceItem(BaseModel):
    content: str
    metadata: dict[str, str] = Field(default_factory=dict)
    score: float = 0.0


class RagAskResponse(BaseModel):
    answer: str
    was_answered: bool = False
    similarity_score: float | None = None
    matched_id: str | None = None
    source_type: str | None = None
    sources: list["RagSourceItem"] = Field(default_factory=list)
    model: str
    embedding_model: str | None = None
    answer_mode: str = Field("direct", description="direct | llm | local | none")


class RagIngestResponse(BaseModel):
    indexed: int
    source: str
    embedding_model: str
    document_count: int


class RagSearchRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=2000)
    top_k: int | None = Field(None, ge=1, le=20)


class RagSearchResponse(BaseModel):
    sources: list[RagSourceItem]
    embedding_model: str


class RagStatusResponse(BaseModel):
    document_count: int
    data_source: str
    excel_path: str
    excel_exists: bool
    embedding_model: str
    llm_model: str


class SttResponse(BaseModel):
    text: str
    language: str = "fa"
    duration_seconds: float | None = None
    model: str | None = None


class SttStatusResponse(BaseModel):
    enabled: bool
    model: str
    device: str
    language: str
    model_loaded: bool
