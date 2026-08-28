'use client';

import { useState } from 'react';
import type { VaricoseCasePublic } from '@/lib/api';
import { publicAssetUrl } from '@/lib/seo';

function BeforeAfterCard({ item }: { item: VaricoseCasePublic }) {
  const [position, setPosition] = useState(50);
  const before = publicAssetUrl(item.beforeImageUrl) || item.beforeImageUrl;
  const after = publicAssetUrl(item.afterImageUrl) || item.afterImageUrl;
  return (
    <article className="ba-card">
      <div className="ba-compare" style={{ '--ba-position': `${position}%` } as React.CSSProperties}>
        <img src={after} alt={`نتیجه بعد از درمان: ${item.title}`} loading="lazy" />
        <div className="ba-before"><img src={before} alt={`پیش از درمان: ${item.title}`} loading="lazy" /></div>
        <span className="ba-label ba-label--before">قبل از درمان</span>
        <span className="ba-label ba-label--after">بعد از درمان</span>
        <span className="ba-divider" aria-hidden><i>↔</i></span>
        <input
          type="range" min="0" max="100" value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          aria-label={`مقایسه تصویر قبل و بعد ${item.title}`}
        />
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
  if (!items.length) return null;
  return (
    <section className="section ba-section" id="before-after">
      <div className="container">
        <div className="section-head"><span className="section-badge">نتایج درمان</span><h2>نمونه‌کارهای قبل و بعد درمان واریس</h2><p>دسته مقایسه را حرکت دهید تا نتیجه را مشاهده کنید.</p></div>
        <div className="ba-grid">{items.map((item) => <BeforeAfterCard item={item} key={item.varicoseCaseId} />)}</div>
        <p className="ba-disclaimer">نتیجه درمان در افراد مختلف متفاوت است و تصاویر، تضمین‌کننده نتیجه مشابه برای همه بیماران نیستند.</p>
      </div>
    </section>
  );
}
