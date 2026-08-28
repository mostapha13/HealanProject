'use client';

import { useEffect, useState } from 'react';
import type { VaricoseCasePublic } from '@/lib/api';
import { publicAssetUrl } from '@/lib/seo';

type Preview = { src: string; alt: string; label: string };

function BeforeAfterCard({ item, onPreview }: { item: VaricoseCasePublic; onPreview: (image: Preview) => void }) {
  const before = publicAssetUrl(item.beforeImageUrl) || item.beforeImageUrl;
  const after = publicAssetUrl(item.afterImageUrl) || item.afterImageUrl;
  const images = [
    { src: before, label: 'قبل از درمان', alt: `پیش از درمان: ${item.title}` },
    { src: after, label: 'بعد از درمان', alt: `نتیجه بعد از درمان: ${item.title}` },
  ];

  return (
    <article className="ba-card">
      <div className="ba-pair">
        {images.map((image) => (
          <button className="ba-image" type="button" onClick={() => onPreview(image)} key={image.label} aria-label={`نمایش بزرگ ${image.label} ${item.title}`}>
            <img src={image.src} alt={image.alt} loading="lazy" />
            <span>{image.label}</span>
            <i aria-hidden>↗</i>
          </button>
        ))}
      </div>
      <div className="ba-card__body">
        {item.treatmentLabel && <span>{item.treatmentLabel}</span>}
        <h3>{item.title}</h3>
        {item.description && <p>{item.description}</p>}
      </div>
    </article>
  );
}

export function BeforeAfterGallery({ items }: { items: VaricoseCasePublic[] }) {
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    if (!preview) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setPreview(null);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', close);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', close);
    };
  }, [preview]);

  if (!items.length) return null;
  return (
    <section className="section ba-section" id="before-after">
      <div className="container">
        <div className="section-head"><span className="section-badge">نتایج واقعی درمان</span><h2>نمونه‌کارهای قبل و بعد درمان واریس</h2><p>برای مشاهده جزئیات، روی هر تصویر کلیک کنید.</p></div>
        <div className="ba-scroll" role="region" aria-label="نمونه‌کارهای درمان واریس" tabIndex={0}>
          {items.map((item) => <BeforeAfterCard item={item} onPreview={setPreview} key={item.varicoseCaseId} />)}
        </div>
        <p className="ba-disclaimer">نتیجه درمان در افراد مختلف متفاوت است و تصاویر، تضمین‌کننده نتیجه مشابه برای همه بیماران نیستند.</p>
      </div>

      {preview && (
        <div className="ba-lightbox" role="dialog" aria-modal="true" aria-label={preview.alt} onMouseDown={(event) => event.target === event.currentTarget && setPreview(null)}>
          <div className="ba-lightbox__panel">
            <button className="ba-lightbox__close" type="button" onClick={() => setPreview(null)} aria-label="بستن تصویر">×</button>
            <img src={preview.src} alt={preview.alt} />
            <strong>{preview.label}</strong>
          </div>
        </div>
      )}
    </section>
  );
}
