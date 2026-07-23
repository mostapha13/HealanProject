'use client';

export function FloatingAssistantButton() {
  return (
    <a
      href="/assistant"
      className="portal-robot-fab"
      aria-label="پرسش از دستیار هوشمند"
      title="پرسش از دستیار هوشمند"
    >
      <span className="portal-robot-fab__ring" aria-hidden />
      <svg
        className="portal-robot-fab__svg"
        viewBox="0 0 48 48"
        width="28"
        height="28"
        aria-hidden
      >
        <rect
          x="10"
          y="16"
          width="28"
          height="22"
          rx="8"
          fill="currentColor"
          opacity="0.95"
        />
        <rect x="16" y="8" width="16" height="10" rx="5" fill="currentColor" />
        <circle cx="19.5" cy="26" r="2.6" fill="#fff" />
        <circle cx="28.5" cy="26" r="2.6" fill="#fff" />
        <path
          d="M20 32.5h8"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
        />
        <circle cx="24" cy="6" r="2" fill="currentColor" />
        <path
          d="M8 27h2M38 27h2"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="portal-robot-fab__label">دستیار</span>
    </a>
  );
}
