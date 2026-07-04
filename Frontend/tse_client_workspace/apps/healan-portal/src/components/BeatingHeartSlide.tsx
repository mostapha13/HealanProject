import React, { useEffect, useState } from 'react';
import heroHeart from '../assets/hero-realistic-heart.png';

type Props = {
  isActive: boolean;
};

/** تصویر واقعی قلب — شروع تاریک، سپس روشن‌شدن + تپش */
export function BeatingHeartSlide({ isActive }: Props) {
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (isActive) setCycle((c) => c + 1);
  }, [isActive]);

  return (
    <div className="hero-slide hero-slide--heart" aria-hidden={!isActive}>
      <div key={cycle} className="hero-heart-real">
        <img
          src={heroHeart}
          alt="قلب انسان — تصویر واقع‌گرایانه"
          className="hero-heart-real__img"
          draggable={false}
        />
        <div className="hero-heart-real__veil" aria-hidden />
        <div className="hero-heart-real__glow" aria-hidden />
        <svg className="hero-heart-real__ecg" viewBox="0 0 400 60" aria-hidden>
          <polyline
            fill="none"
            stroke="#19bfd3"
            strokeWidth="2"
            strokeLinecap="round"
            points="0,40 40,40 55,40 65,22 75,52 85,40 110,40 125,40 135,18 145,58 155,40 180,40 200,40 210,20 220,50 230,40 260,40 275,40 285,25 295,48 305,40 330,40 360,40 400,40"
          />
        </svg>
      </div>
      <div className="hero-slide__caption">
        <span className="hero-slide__caption-tag">قلب انسان</span>
        <strong>مراقبت تخصصی از قلب</strong>
      </div>
    </div>
  );
}
