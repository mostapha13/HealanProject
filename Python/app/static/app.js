const chat = document.getElementById("chat");
const questionEl = document.getElementById("question");
const btnAsk = document.getElementById("btnAsk");
const btnIngest = document.getElementById("btnIngest");
const btnStatus = document.getElementById("btnStatus");
const docCount = document.getElementById("docCount");
const llmStatus = document.getElementById("llmStatus");

function addMessage(text, type = "bot", extraHtml = "") {
  const div = document.createElement("div");
  div.className = `msg ${type}`;
  div.innerHTML = escapeHtml(text) + extraHtml;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatSources(sources) {
  if (!sources?.length) return "";
  const items = sources
    .map((s, i) => {
      const meta = s.metadata || {};
      const row = meta.row || meta.id || "—";
      const type = meta.source || s.metadata?.نوع_رکورد || "—";
      const score = (s.score * 100).toFixed(0);
      const preview = (s.content || "").slice(0, 220);
      return `<div class="source-item"><strong>منبع ${i + 1}</strong> — شباهت ${score}% — ردیف ${row}<br>${escapeHtml(preview)}${s.content?.length > 220 ? "…" : ""}</div>`;
    })
    .join("");
  return `<div class="sources"><h4>منابع بازیابی‌شده از اکسل</h4>${items}</div>`;
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data.detail || data.message || res.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data;
}

async function refreshStatus() {
  try {
    const [health, rag] = await Promise.all([
      api("/health"),
      api("/api/v1/rag/status"),
    ]);
    docCount.textContent = `${rag.document_count} سند ایندکس‌شده`;
    docCount.className = "badge ok";
  const llmOk = health.llm_configured;
    llmStatus.textContent = llmOk
      ? `LLM: ${health.model}`
      : "حالت محلی (بدون API key)";
    llmStatus.className = llmOk ? "badge ok" : "badge warn";
  } catch (e) {
    docCount.textContent = "خطا در اتصال";
    docCount.className = "badge warn";
    llmStatus.textContent = e.message;
  }
}

async function doIngest() {
  btnIngest.disabled = true;
  addMessage("در حال بارگذاری اکسل و ساخت ایندکس…", "system");
  try {
    const data = await api("/api/v1/rag/ingest", { method: "POST" });
    addMessage(
      `ایندکس شد: ${data.indexed} ردیف | مدل embedding: ${data.embedding_model}`,
      "system"
    );
    await refreshStatus();
  } catch (e) {
    addMessage(`خطا در ingest: ${e.message}`, "error");
  } finally {
    btnIngest.disabled = false;
  }
}

async function doAsk(q) {
  const question = (q || questionEl.value).trim();
  if (!question) return;

  questionEl.value = "";
  btnAsk.disabled = true;
  addMessage(question, "user");

  const loading = addMessage("", "bot");
  loading.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';

  try {
    const data = await api("/api/v1/rag/ask", {
      method: "POST",
      body: JSON.stringify({ question, top_k: 5 }),
    });
    loading.remove();
    const note =
      data.answer_mode === "local"
        ? "\n\n(پاسخ از دادهٔ اکسل — برای LLM واقعی OPENAI_API_KEY را در .env بگذارید)"
        : "";
    const bot = addMessage(data.answer + note, "bot", formatSources(data.sources));
    bot.querySelector(".sources")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (e) {
    loading.remove();
    addMessage(`خطا: ${e.message}`, "error");
  } finally {
    btnAsk.disabled = false;
    questionEl.focus();
  }
}

btnAsk.addEventListener("click", () => doAsk());
btnIngest.addEventListener("click", doIngest);
btnStatus.addEventListener("click", refreshStatus);

questionEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    doAsk();
  }
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    questionEl.value = chip.dataset.q;
    doAsk(chip.dataset.q);
  });
});

addMessage(
  "سلام! سؤال خود را دربارهٔ پزشکان، نوبت‌ها، خدمات یا قوانین کلینیک بپرسید.",
  "system"
);
refreshStatus();
