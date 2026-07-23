import type { PortalContentItem } from '@/lib/api';
import { BookingCta, PatientCta } from './CtaLinks';
import { HeroSlider } from './HeroSlider';
import { ReviewsSection } from './ReviewsSection';

const FALLBACK_SERVICES = [
  { title: 'معاینه تخصصی قلب', body: 'ارزیابی جامع علائم و وضعیت قلب و عروق', color: '#b91c1c' },
  { title: 'اکوکاردیوگرافی', body: 'بررسی دقیق عملکرد دریچه‌ها و عضله قلب', color: '#1e3a5f' },
  { title: 'نوار قلب و فشارخون', body: 'پایش ریتم، فشار و تشخیص زودهنگام', color: '#9f1239' },
  { title: 'پیگیری بیماران مزمن', body: 'مدیریت نارسایی قلب، آریتمی و عروق کرونر', color: '#334155' },
];

const FALLBACK_WHY = [
  { title: 'تخصص و بورد معتبر', body: 'فارغ‌التحصیل برترین مراکز درمانی کشور' },
  { title: 'پذیرش منظم', body: 'نوبت‌دهی تلفنی و پیگیری منظم بیمار' },
  { title: 'تشخیص دقیق', body: 'اکو، نوار قلب و معاینه تخصصی' },
  { title: 'محیط استاندارد', body: 'فضای آرام مطب در مرکز پزشکان' },
];

const FALLBACK_TRUST = [
  { title: 'بورد تخصصی', subtitle: 'شهید رجایی تهران' },
  { title: 'دانشگاه تهران', subtitle: 'دکترای عمومی' },
  { title: 'استاندارد بالا', subtitle: 'تجهیزات تشخیصی' },
  { title: 'قلب و عروق', subtitle: 'تخصص اصلی' },
];

type LandingModel = ReturnType<typeof import('@/lib/site').buildLandingModel>;

type Props = {
  model: LandingModel;
  heroStats: PortalContentItem[];
  heroSlides: PortalContentItem[];
  trustItems: PortalContentItem[];
  services: PortalContentItem[];
  whyItems: PortalContentItem[];
  showAbout: boolean;
  showTrust: boolean;
  showWhy: boolean;
  showServices: boolean;
  showReviews: boolean;
  showContact: boolean;
  showHeroStat: boolean;
  showHeroSlide: boolean;
};

export function LandingView({
  model,
  heroStats,
  heroSlides,
  trustItems,
  services,
  whyItems,
  showAbout,
  showTrust,
  showWhy,
  showServices,
  showReviews,
  showContact,
  showHeroStat,
  showHeroSlide,
}: Props) {
  const { doctor, contact, hero, sections, map } = model;

  const stats =
    heroStats.length > 0
      ? heroStats.map((i) => ({ strong: i.title ?? '', span: i.subtitle ?? '' }))
      : [
          { strong: '+۱۰', span: 'سال تجربه بالینی' },
          { strong: 'بورد', span: 'تخصصی معتبر' },
          { strong: 'شوشتر', span: 'پذیرش نوبتی' },
        ];

  const trust =
    trustItems.length > 0
      ? trustItems.map((i) => ({ title: i.title ?? '', subtitle: i.subtitle ?? '' }))
      : FALLBACK_TRUST;

  const serviceList =
    services.length > 0
      ? services.map((i) => ({
          title: i.title ?? '',
          body: i.body ?? '',
          color: i.color || 'var(--primary)',
        }))
      : FALLBACK_SERVICES;

  const whyList =
    whyItems.length > 0
      ? whyItems.map((i) => ({ title: i.title ?? '', body: i.body ?? '' }))
      : FALLBACK_WHY;

  return (
    <main>
      <section className="hero">
        <div className="hero__glow" aria-hidden />
        <div className="container hero__grid">
          <div className="hero__content">
            <div className="pill">{hero.pill}</div>
            <h1 className="hero__title">{doctor.name}</h1>
            <p className="hero__subtitle">{doctor.specialty}</p>
            <p className="hero__desc">{hero.description}</p>
            <div className="hero__cta">
              <BookingCta className="btn btn--primary btn--lg" />
              <a href="#services" className="btn btn--soft btn--lg">
                مشاهده خدمات
              </a>
            </div>
            {showHeroStat && (
              <div className="hero__stats">
                {stats.map((stat) => (
                  <div key={`${stat.strong}-${stat.span}`}>
                    <strong>{stat.strong}</strong>
                    <span>{stat.span}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {showHeroSlide && (
            <div className="hero__visual">
              <HeroSlider
                slides={heroSlides}
                floatTitle={hero.floatTitle}
                floatSubtitle={hero.floatSubtitle}
              />
            </div>
          )}
        </div>
      </section>

      {showTrust && (
        <section className="trust">
          <div className="container trust__grid">
            {trust.map((item) => (
              <div key={item.title} className="trust__item">
                <strong>{item.title}</strong>
                <span>{item.subtitle}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {showAbout && (
        <section id="about" className="section">
          <div className="container split">
            <div className="about-card">
              <div className="about-card__badge">{sections.aboutBadge}</div>
              <ul className="cred-list">
                <li>{doctor.board}</li>
              </ul>
            </div>
            <div className="split__text">
              <h2>{sections.aboutTitle}</h2>
              <p>{sections.aboutP1}</p>
              <p>{sections.aboutP2}</p>
              <blockquote className="quote">«{contact.quote}»</blockquote>
            </div>
          </div>
        </section>
      )}

      {showWhy && (
        <section id="why" className="section section--muted">
          <div className="container">
            <div className="section-head">
              <h2>{sections.whyTitle}</h2>
              <p>{sections.whySubtitle}</p>
            </div>
            <div className="features">
              {whyList.map((item) => (
                <article key={item.title} className="feature">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {showServices && (
        <section id="services" className="section">
          <div className="container">
            <div className="section-head">
              <h2>{sections.servicesTitle}</h2>
              <p>{sections.servicesSubtitle}</p>
            </div>
            <div className="services">
              {serviceList.map((item) => (
                <article key={item.title} className="service">
                  <span
                    className="service__icon"
                    style={{ color: item.color, background: `${item.color}14` }}
                  >
                    ◆
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <BookingCta className="service__link">درخواست نوبت ←</BookingCta>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {showReviews && (
        <ReviewsSection
          title={sections.reviewsTitle}
          subtitle={sections.reviewsSubtitle}
        />
      )}

      {showContact && (
        <section id="contact" className="section section--muted">
          <div className="container contact">
            <div>
              <h2>{sections.contactTitle}</h2>
              <p className="contact__lead">{sections.contactLead}</p>
              <div className="info-cards">
                <div className="info-card">
                  <strong>آدرس</strong>
                  <p>{doctor.address}</p>
                </div>
                <div className="info-card">
                  <strong>تلفن نوبت</strong>
                  <a href={`tel:${contact.phone}`}>{contact.phoneDisplay}</a>
                </div>
                <div className="info-card">
                  <strong>ساعات پذیرش</strong>
                  <p>{contact.hours}</p>
                </div>
              </div>
              <div className="contact__cta">
                <BookingCta className="btn btn--primary btn--lg" />
                <PatientCta className="btn btn--patient btn--lg" />
              </div>
            </div>
            <div className="map-card">
              <div className="map-card__header">{map.header}</div>
              <div className="map-card__body">
                <p>{map.building}</p>
                <small>{map.detail}</small>
              </div>
              <a
                className="map-card__link"
                href={map.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                مشاهده در نقشه
              </a>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
