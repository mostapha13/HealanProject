import React, { useCallback, useEffect, useState } from 'react';
import { IconEcg } from './Icons';
import { BeatingHeartSlide } from './BeatingHeartSlide';
import heroEcho from '../assets/hero-echo-machine.png';
import heroClinic from '../assets/hero-clinic-interior.png';

const SLIDE_INTERVAL_MS = 5000;

const slides = [
  { id: 'heart', type: 'heart' as const, label: 'قلب انسان' },
  { id: 'echo', type: 'image' as const, label: 'اکوکاردیوگرافی', src: heroEcho, alt: 'دستگاه اکوکاردیوگرافی در مطب' },
  { id: 'clinic', type: 'image' as const, label: 'فضای مطب', src: heroClinic, alt: 'فضای داخلی مطب تخصصی قلب' },
];

export function HeroSlider() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((index: number) => {
    setActive((index + slides.length) % slides.length);
  }, []);

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    if (paused) return undefined;
    const timer = window.setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused]);

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
            key={slide.id}
            className={`hero-slider__slide${index === active ? ' is-active' : ''}${index < active ? ' is-past' : ''}`}
            aria-hidden={index !== active}
          >
            {slide.type === 'heart' ? (
              <BeatingHeartSlide isActive={index === active} />
            ) : (
              <div className="hero-slide hero-slide--photo">
                <img src={slide.src} alt={slide.alt} className="hero-slide__photo" loading={index === 0 ? 'eager' : 'lazy'} />
                <div className="hero-slide__caption">
                  <span className="hero-slide__caption-tag">{slide.label}</span>
                  <strong>{slide.id === 'echo' ? 'تشخیص دقیق با اکو' : 'محیطی آرام و استاندارد'}</strong>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button type="button" className="hero-slider__arrow hero-slider__arrow--prev" onClick={prev} aria-label="اسلاید قبلی">
        ‹
      </button>
      <button type="button" className="hero-slider__arrow hero-slider__arrow--next" onClick={next} aria-label="اسلاید بعدی">
        ›
      </button>

      <div className="hero-slider__dots" role="tablist" aria-label="انتخاب اسلاید">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={index === active}
            aria-label={slide.label}
            className={`hero-slider__dot${index === active ? ' is-active' : ''}`}
            onClick={() => goTo(index)}
          />
        ))}
      </div>

      <div className="portal-hero__float-card hero-slider__float">
        <IconEcg />
        <div>
          <strong>قلب و عروق</strong>
          <span>تشخیص · درمان · پیشگیری</span>
        </div>
      </div>
    </div>
  );
}
