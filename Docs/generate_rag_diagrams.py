# -*- coding: utf-8 -*-
"""Generate architecture diagrams for RAG guide (Persian RTL Word doc)."""
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

OUT = Path(__file__).resolve().parent / "rag-guide-assets"
OUT.mkdir(parents=True, exist_ok=True)


def _box(ax, xy, w, h, text, color="#E8F4FC", edge="#1F4E79"):
    x, y = xy
    patch = FancyBboxPatch(
        (x, y), w, h,
        boxstyle="round,pad=0.02,rounding_size=0.08",
        linewidth=1.5, edgecolor=edge, facecolor=color,
    )
    ax.add_patch(patch)
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center",
            fontsize=9, fontfamily="DejaVu Sans", wrap=True,
            multialignment="center")


def _arrow(ax, start, end):
    ax.add_patch(FancyArrowPatch(
        start, end, arrowstyle="-|>", mutation_scale=12,
        linewidth=1.2, color="#334155",
    ))


def diagram_architecture():
    fig, ax = plt.subplots(figsize=(11, 6.2))
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 6.5)
    ax.axis("off")
    ax.set_title("Architecture — Portal RAG Chatbot", fontsize=13, pad=12)

    _box(ax, (0.3, 4.6), 2.2, 1.2, "Portal UI\n/assistant\nGuest Cookie + OTP Token", "#FFF1F2", "#BE123C")
    _box(ax, (3.0, 4.6), 2.4, 1.2, "Healan WebApi\nRagAsk / Quota / OTP\nRedis Counter", "#FEF3C7", "#B45309")
    _box(ax, (5.9, 4.6), 2.4, 1.2, "Python RAG :8000\nEmbed + Chroma Search\nDirect Answer", "#DCFCE7", "#15803D")
    _box(ax, (8.7, 4.6), 2.0, 1.2, "ChromaDB\nhealan_rag\nVectors", "#E0E7FF", "#4338CA")

    _box(ax, (1.2, 2.2), 2.6, 1.3, "SQL Server\nFAQ / Blog / CMS\nSettings / Reviews\nRagChatLogs", "#F1F5F9", "#334155")
    _box(ax, (4.5, 2.2), 2.6, 1.3, "RabbitMQ\nQ_RagChatLog\nAsync Persist", "#FCE7F3", "#9D174D")
    _box(ax, (7.8, 2.2), 2.4, 1.3, "SMS Provider\nOTP Login\nGuest limit → Login", "#ECFEFF", "#0E7490")

    _arrow(ax, (2.5, 5.2), (3.0, 5.2))
    _arrow(ax, (5.4, 5.2), (5.9, 5.2))
    _arrow(ax, (8.3, 5.2), (8.7, 5.2))
    _arrow(ax, (4.2, 4.6), (3.2, 3.5))
    _arrow(ax, (4.5, 4.6), (5.5, 3.5))
    _arrow(ax, (4.8, 4.6), (8.5, 3.5))
    _arrow(ax, (7.1, 4.6), (3.5, 3.5))

    fig.tight_layout()
    fig.savefig(OUT / "01-architecture.png", dpi=160, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def diagram_ingest():
    fig, ax = plt.subplots(figsize=(11, 5.5))
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 5.5)
    ax.axis("off")
    ax.set_title("Knowledge Ingest → Embedding → Vector Store", fontsize=13, pad=12)

    sources = [
        (0.3, 3.8, "RagKnowledgeItems\n(FAQ)"),
        (0.3, 2.5, "PortalSiteSettings"),
        (0.3, 1.2, "PortalContentItems\nBlogPosts Reviews"),
    ]
    for x, y, t in sources:
        _box(ax, (x, y), 2.3, 1.0, t, "#FEF9C3", "#A16207")

    _box(ax, (3.2, 2.2), 2.4, 1.6, "HealanSqlDataSource\nDocument(id, content,\nmetadata.answer)", "#DBEAFE", "#1D4ED8")
    _box(ax, (6.0, 2.2), 2.4, 1.6, "Embedding Model\nheydariAI/\npersian-embeddings\n→ vector (normalized)", "#D1FAE5", "#047857")
    _box(ax, (8.7, 2.2), 2.0, 1.6, "ChromaDB\ncollection\nhealan_rag", "#EDE9FE", "#6D28D9")

    for y in (4.3, 3.0, 1.7):
        _arrow(ax, (2.6, y), (3.2, 3.0))
    _arrow(ax, (5.6, 3.0), (6.0, 3.0))
    _arrow(ax, (8.4, 3.0), (8.7, 3.0))

    fig.tight_layout()
    fig.savefig(OUT / "02-ingest.png", dpi=160, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def diagram_ask():
    fig, ax = plt.subplots(figsize=(10, 7.2))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7.5)
    ax.axis("off")
    ax.set_title("Ask Flow — Example: آدرس مطب کجاست؟", fontsize=12, pad=10)

    steps = [
        (1, 6.4, "1) User asks in Portal"),
        (1, 5.4, "2) Quota check Redis (guest ≤ 10)"),
        (1, 4.4, "3) Healan → Python POST /ask"),
        (1, 3.4, "4) Embed question → search Chroma"),
        (1, 2.4, "5) If similarity ≥ 0.55 → return answer"),
        (1, 1.4, "6) Increment quota + publish log MQ"),
        (1, 0.4, "7) UI streams answer to user"),
    ]
    for i, (x, y, t) in enumerate(steps):
        _box(ax, (x, y), 7.5, 0.75, t, "#F8FAFC" if i % 2 == 0 else "#EEF2FF", "#334155")
        if i < len(steps) - 1:
            _arrow(ax, (4.7, y), (4.7, steps[i + 1][1] + 0.75))

    fig.tight_layout()
    fig.savefig(OUT / "03-ask-flow.png", dpi=160, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def diagram_quota():
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5)
    ax.axis("off")
    ax.set_title("Daily Quota & OTP Login", fontsize=13, pad=10)

    _box(ax, (0.4, 3.2), 2.8, 1.3, "Guest\nCookie healan_rag_guest\nLimit = 10 / day", "#FEE2E2", "#B91C1C")
    _box(ax, (3.6, 3.2), 2.8, 1.3, "Quota Full?\nRequiresLogin = true\nShow OTP Modal", "#FEF3C7", "#B45309")
    _box(ax, (6.8, 3.2), 2.8, 1.3, "OTP SMS Verify\nBearer Token\nLimit = 200 / day", "#DCFCE7", "#15803D")
    _box(ax, (2.0, 0.8), 6.0, 1.4, "Redis keys\nrag:quota:g:{guest}:{yyyyMMdd}\nrag:quota:u:{userId}:{yyyyMMdd}\nFallback: COUNT RagChatLogs today", "#E0F2FE", "#0369A1")

    _arrow(ax, (3.2, 3.85), (3.6, 3.85))
    _arrow(ax, (6.4, 3.85), (6.8, 3.85))
    _arrow(ax, (5, 3.2), (5, 2.2))

    fig.tight_layout()
    fig.savefig(OUT / "04-quota-otp.png", dpi=160, bbox_inches="tight", facecolor="white")
    plt.close(fig)


if __name__ == "__main__":
    diagram_architecture()
    diagram_ingest()
    diagram_ask()
    diagram_quota()
    print("Diagrams written to", OUT)
