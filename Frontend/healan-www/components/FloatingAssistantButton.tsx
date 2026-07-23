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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="portal-robot-fab__img"
        src="/icons/assistant-bot.png"
        alt=""
        width={52}
        height={52}
        draggable={false}
      />
      <span className="portal-robot-fab__label">دستیار</span>
    </a>
  );
}
