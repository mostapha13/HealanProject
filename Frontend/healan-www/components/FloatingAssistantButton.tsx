'use client';

export function FloatingAssistantButton() {
  return (
    <a
      href="/assistant"
      className="portal-robot-fab"
      aria-label="پرسش از دستیار هوشمند"
      title="پرسش از دستیار هوشمند"
    >
      <span className="portal-robot-fab__icon" aria-hidden>
        🤖
      </span>
    </a>
  );
}
