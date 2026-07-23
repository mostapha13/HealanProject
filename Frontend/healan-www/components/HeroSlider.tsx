'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PortalContentItem } from '@/lib/api';

const INTERVAL_MS = 5000;

type Props = {
  slides: PortalContentItem[];
  floatTitle?: string;
  floatSubtitle?: string;
};

function isHeartSlide(slide: PortalContentItem): boolean {
  const icon = (slide.iconName ?? '').toLowerCase();
  return icon === 'heart' || icon === 'beatingheart';
}

function BeatingHeart({
  title,
  subtitle,
  isActive,
}: {
  title?: string;
  subtitle?: string;
  isActive: boolean;
}) {
  return (
    <div className={`hero-slide hero-slide--heart${isActive ? ' is-active' : ''}`}>
      <div className="hero-heart" aria-hidden>
        <svg viewBox="0 0 200 180" className="hero-heart__svg">
          <path
            className="hero-heart__path"
            d="M100 160 C30 110 10 70 10 45 C10 20 30 5 55 5 C75 5 90 18 100 35 C110 18 125 5 145 5 C170 5 190 20 190 45 C190 70 170 110 100 160 Z"
          />
        </svg>
        <div className="hero-heart__pulse" />
      </div>
      <div className="hero-slide__caption">
        <span className="hero-slide__caption-tag">{title || 'قلب انسان'}</span>
        <strong>{subtitle || 'مراقبت تخصصی از قلب'}</strong>
      </div>
    </div>
  );
}

export function HeroSlider({ slides: slidesProp, floatTitle, floatSubtitle }: Props) {
  const slides = useMemo(
    () => [...(slidesProp ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [slidesProp]
  );

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    setActive(0);
  }, [slides.length]);

  const goTo = useCallback(
    (index: number) => {
      if (!slides.length) return;
      setActive(((index % slides.length) + slides.length) % slides.length);
    },
    [slides.length]
  );

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    if (paused || slides.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  if (!slides.length) {
    return (
      <div className="hero-slider hero-slider--empty">
        <div className="hero-slide__caption">
          <span className="hero-slide__caption-tag">{floatTitle || 'قلب و عروق'}</span>
          <strong>{floatSubtitle || 'تشخیص · درمان · پیشگیری'}</strong>
        </div>
      </div>
    );
  }

  return (
    <div
      className="hero-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) < 40) return;
        // RTL: swipe right (positive dx) → previous visual in LTR terms is next in RTL content
        if (dx > 0) prev();
        else next();
      }}
    >
      <div className="hero-slider__track">
        {slides.map((slide, index) => {
          const activeClass =
            index === active ? ' is-active' : index < active ? ' is-past' : '';
          return (
            <div
              key={slide.portalContentItemId ?? index}
              className={`hero-slider__slide${activeClass}`}
              aria-hidden={index !== active}
            >
              {isHeartSlide(slide) ? (
                <BeatingHeart
                  title={slide.title}
                  subtitle={slide.subtitle || slide.body}
                  isActive={index === active}
                />
              ) : slide.imageUrl ? (
                <div className="hero-slide hero-slide--photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.imageUrl}
                    alt={slide.body || slide.title || 'اسلاید'}
                    className="hero-slide__photo"
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                  <div className="hero-slide__caption">
                    <span className="hero-slide__caption-tag">
                      {slide.title || '—'}
                    </span>
                    <strong>{slide.subtitle || slide.body || ''}</strong>
                  </div>
                </div>
              ) : (
                <div className="hero-slide hero-slide--fallback">
                  <div className="hero-slide__caption">
                    <span className="hero-slide__caption-tag">
                      {slide.title || floatTitle || 'قلب و عروق'}
                    </span>
                    <strong>
                      {slide.subtitle || slide.body || floatSubtitle || ''}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            className="hero-slider__arrow hero-slider__arrow--prev"
            onClick={prev}
            aria-label="اسلاید قبلی"
          >
            ‹
          </button>
          <button
            type="button"
            className="hero-slider__arrow hero-slider__arrow--next"
            onClick={next}
            aria-label="اسلاید بعدی"
          >
            ›
          </button>
          <div className="hero-slider__dots" role="tablist" aria-label="انتخاب اسلاید">
            {slides.map((slide, index) => (
              <button
                key={slide.portalContentItemId ?? index}
                type="button"
                role="tab"
                aria-selected={index === active}
                className={
                  index === active
                    ? 'hero-slider__dot is-active'
                    : 'hero-slider__dot'
                }
                onClick={() => goTo(index)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
