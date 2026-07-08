import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IconEcg } from './Icons';
import { BeatingHeartSlide } from './BeatingHeartSlide';
import type { PortalContentItem } from '../api/portalApi';
import { resolvePortalImageUrl } from '../api/fileApi';
import heroEcho from '../assets/hero-echo-machine.png';
import heroClinic from '../assets/hero-clinic-interior.png';

const SLIDE_INTERVAL_MS = 5000;

const FALLBACK_SLIDES: PortalContentItem[] = [
  { portalContentItemId: 1, sectionType: 'HeroSlide', title: 'قلب انسان', iconName: 'heart', sortOrder: 1, isPublished: true },
  { portalContentItemId: 2, sectionType: 'HeroSlide', title: 'اکوکاردیوگرافی', subtitle: 'تشخیص دقیق با اکو', body: 'دستگاه اکوکاردیوگرافی در مطب', imageUrl: '', iconName: 'image', sortOrder: 2, isPublished: true },
  { portalContentItemId: 3, sectionType: 'HeroSlide', title: 'فضای مطب', subtitle: 'محیطی آرام و استاندارد', body: 'فضای داخلی مطب تخصصی قلب', imageUrl: '', iconName: 'image', sortOrder: 3, isPublished: true },
];

const BUNDLED_IMAGES: Record<string, string> = {
  echo: heroEcho,
  clinic: heroClinic,
  'hero-echo': heroEcho,
  'hero-clinic': heroClinic,
};

function isHeartSlide(slide: PortalContentItem): boolean {
  const icon = (slide.iconName ?? '').toLowerCase();
  return icon === 'heart' || icon === 'beatingheart';
}

function resolveImage(slide: PortalContentItem, index: number): string {
  const fromFile = resolvePortalImageUrl(slide);
  if (fromFile) return fromFile;
  const key = (slide.linkUrl ?? slide.iconName ?? '').toLowerCase();
  if (BUNDLED_IMAGES[key]) return BUNDLED_IMAGES[key];
  if (index === 1) return heroEcho;
  if (index === 2) return heroClinic;
  return heroEcho;
}

interface HeroSliderProps {
  slides?: PortalContentItem[];
  floatTitle?: string;
  floatSubtitle?: string;
}

export function HeroSlider({ slides: slidesProp, floatTitle, floatSubtitle }: HeroSliderProps) {
  const slides = useMemo(() => {
    const list = slidesProp?.length ? slidesProp : FALLBACK_SLIDES;
    return [...list].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [slidesProp]);

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setActive(0);
  }, [slides.length]);

  const goTo = useCallback((index: number) => {
    if (!slides.length) return;
    setActive((index + slides.length) % slides.length);
  }, [slides.length]);

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    if (paused || slides.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  if (!slides.length) return null;

  return (
    <div
      className="hero-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="hero-slider__track">
        {slides.map((slide, index) => (
          <div
            key={slide.portalContentItemId ?? index}
            className={`hero-slider__slide${index === active ? ' is-active' : ''}${index < active ? ' is-past' : ''}`}
            aria-hidden={index !== active}
          >
            {isHeartSlide(slide) ? (
              <BeatingHeartSlide isActive={index === active} />
            ) : (
              <div className="hero-slide hero-slide--photo">
                <img
                  src={resolveImage(slide, index)}
                  alt={slide.body || slide.title || 'اسلاید'}
                  className="hero-slide__photo"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
                <div className="hero-slide__caption">
                  <span className="hero-slide__caption-tag">{slide.title || '—'}</span>
                  <strong>{slide.subtitle || slide.body || ''}</strong>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button type="button" className="hero-slider__arrow hero-slider__arrow--prev" onClick={prev} aria-label="اسلاید قبلی">
            ‹
          </button>
          <button type="button" className="hero-slider__arrow hero-slider__arrow--next" onClick={next} aria-label="اسلاید بعدی">
            ›
          </button>
          <div className="hero-slider__dots" role="tablist" aria-label="انتخاب اسلاید">
            {slides.map((slide, index) => (
              <button
                key={slide.portalContentItemId ?? index}
                type="button"
                role="tab"
                aria-selected={index === active}
                aria-label={slide.title || `اسلاید ${index + 1}`}
                className={`hero-slider__dot${index === active ? ' is-active' : ''}`}
                onClick={() => goTo(index)}
              />
            ))}
          </div>
        </>
      )}

      <div className="portal-hero__float-card hero-slider__float">
        <IconEcg />
        <div>
          <strong>{floatTitle || 'قلب و عروق'}</strong>
          <span>{floatSubtitle || 'تشخیص · درمان · پیشگیری'}</span>
        </div>
      </div>
    </div>
  );
}
