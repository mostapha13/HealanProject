import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { goToLogin } from '../../constants';
import {
  IconClock,
  IconEcg,
  IconGraduation,
  IconHeart,
  IconHospital,
  IconLocation,
  IconLogin,
  IconPhone,
  IconShield,
  IconStethoscope,
} from '../../components/Icons';
import { HeroSlider } from '../../components/HeroSlider';
import { PatientReviewForm } from '../../components/PatientReviewForm';
import { PortalAuthModal, resolveBookingEntry, type PortalAuthModalMode } from '../../components/PortalAuthModal';
import { PortalSessionActions, usePortalSessionUser } from '../../components/PortalSessionUser';
import { usePortalSite } from '../../hooks/usePortalSite';
import { resolvePortalIcon } from '../../utils/portalIcons';

const fallbackServices = [
  { Icon: IconStethoscope, title: 'معاینه تخصصی قلب', desc: 'ارزیابی جامع علائم و وضعیت قلب و عروق', color: '#ef394e' },
  { Icon: IconEcg, title: 'اکوکاردیوگرافی', desc: 'بررسی دقیق عملکرد دریچه‌ها و عضله قلب', color: '#19bfd3' },
  { Icon: IconHeart, title: 'نوار قلب و فشارخون', desc: 'پایش ریتم، فشار و تشخیص زودهنگام', color: '#f59e0b' },
  { Icon: IconShield, title: 'پیگیری بیماران مزمن', desc: 'مدیریت نارسایی قلب، آریتمی و عروق کرونر', color: '#10b981' },
  { Icon: IconHospital, title: 'مشاوره درمانی', desc: 'برنامه درمانی شخصی‌سازی‌شده برای هر بیمار', color: '#6366f1' },
  { Icon: IconGraduation, title: 'پیشگیری و آموزش', desc: 'راهنمای سبک زندگی سالم برای سلامت قلب', color: '#ec4899' },
];

const fallbackTrust = [
  { Icon: IconGraduation, label: 'بورد تخصصی', sub: 'شهید رجایی تهران' },
  { Icon: IconHospital, label: 'دانشگاه تهران', sub: 'دکترای عمومی' },
  { Icon: IconShield, label: 'استاندارد بالا', sub: 'تجهیزات تشخیصی' },
  { Icon: IconHeart, label: 'قلب و عروق', sub: 'تخصص اصلی' },
];

const fallbackNav = [
  ['about', 'درباره پزشک'],
  ['services', 'خدمات'],
  ['reviews', 'نظرات بیماران'],
  ['why', 'چرا این مطب؟'],
  ['contact', 'تماس'],
] as const;

const fallbackWhy = [
  { title: 'تخصص و بورد معتبر', desc: 'فارغ‌التحصیل برترین مراکز درمانی کشور', Icon: IconGraduation },
  { title: 'پذیرش منظم', desc: 'نوبت‌دهی تلفنی و پیگیری منظم بیمار', Icon: IconPhone },
  { title: 'تشخیص دقیق', desc: 'اکو، نوار قلب و معاینه تخصصی', Icon: IconEcg },
  { title: 'محیط استاندارد', desc: 'فضای آرام مطب در مرکز پزشکان', Icon: IconHospital },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<PortalAuthModalMode>('register');
  const { user: portalUser, refresh: refreshPortalUser, logout: logoutPortalUser } = usePortalSessionUser();
  const { doctor, contact, hero, sections, map, heroStats, heroSlides, isSectionEnabled, navItems, trustItems, services, whyItems, reviews } = usePortalSite();

  const startBooking = async () => {
    setMenuOpen(false);
    const entry = await resolveBookingEntry();
    if (entry.action === 'goto-booking') {
      navigate('/booking');
      return;
    }
    setAuthMode(entry.mode);
    setAuthOpen(true);
  };

  const onPortalLogout = () => {
    setMenuOpen(false);
    logoutPortalUser();
  };

  const navList = useMemo(() => {
    if (navItems.length === 0) return [...fallbackNav];
    return navItems.map((item) => [item.linkUrl ?? 'about', item.title ?? ''] as const);
  }, [navItems]);

  const trustList = useMemo(() => {
    if (trustItems.length === 0) return fallbackTrust;
    return trustItems.map((item) => ({
      Icon: resolvePortalIcon(item.iconName, IconHeart),
      label: item.title ?? '',
      sub: item.subtitle ?? '',
    }));
  }, [trustItems]);

  const serviceList = useMemo(() => {
    if (services.length === 0) return fallbackServices;
    return services.map((item) => ({
      Icon: resolvePortalIcon(item.iconName, IconStethoscope),
      title: item.title ?? '',
      desc: item.body ?? '',
      color: item.color ?? '#ef394e',
    }));
  }, [services]);

  const whyList = useMemo(() => {
    if (whyItems.length === 0) return fallbackWhy;
    return whyItems.map((item) => ({
      title: item.title ?? '',
      desc: item.body ?? '',
      Icon: resolvePortalIcon(item.iconName, IconHeart),
    }));
  }, [whyItems]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="portal">
      {/* Top bar — شبیه دیجی‌کالا */}
      <div className="portal-topbar">
        <div className="portal-container portal-topbar__inner">
          <span>{contact.topbar}</span>
          <a href={`tel:${contact.phone}`} className="portal-topbar__phone">
            <IconPhone className="portal-icon-sm" />
            {contact.phoneDisplay}
          </a>
        </div>
      </div>

      <header className={`portal-header${scrolled ? ' is-scrolled' : ''}`}>
        <div className="portal-container portal-header__inner">
          <a href="#" className="portal-brand" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <span className="portal-brand__mark"><IconHeart /></span>
            <div className="portal-brand__text">
              <strong>{doctor.shortName}</strong>
              <span>{doctor.specialty}</span>
            </div>
          </a>

          <nav className="portal-nav" aria-label="منوی اصلی">
            {navList.map(([id, label]) => (
              <button key={id} type="button" className="portal-nav__link" onClick={() => scrollTo(id)}>
                {label}
              </button>
            ))}
            <Link to="/blog" className="portal-nav__link">بلاگ</Link>
          </nav>

          <div className="portal-header__actions">
            <button type="button" className="p-btn p-btn--outline p-btn--sm portal-header__call" onClick={startBooking}>
              <IconPhone className="portal-icon-sm" />
              <span>رزرو نوبت</span>
            </button>
            {portalUser ? (
              <PortalSessionActions user={portalUser} onLogout={onPortalLogout} />
            ) : (
              <button type="button" className="p-btn p-btn--primary p-btn--sm" onClick={goToLogin}>
                <IconLogin className="portal-icon-sm" />
                <span>ورود</span>
              </button>
            )}
            <button
              type="button"
              className={`portal-menu-btn${menuOpen ? ' is-open' : ''}`}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'بستن منو' : 'باز کردن منو'}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        <div className={`portal-mobile-nav${menuOpen ? ' is-open' : ''}`} aria-hidden={!menuOpen}>
          <div className="portal-mobile-nav__backdrop" onClick={() => setMenuOpen(false)} />
          <nav className="portal-mobile-nav__panel" aria-label="منوی موبایل">
            {navList.map(([id, label]) => (
              <button key={id} type="button" onClick={() => scrollTo(id)}>
                {label}
              </button>
            ))}
            <Link to="/blog" onClick={() => setMenuOpen(false)}>بلاگ</Link>
            <hr />
            <button type="button" className="p-btn p-btn--primary" onClick={() => { setMenuOpen(false); startBooking(); }}>
              <IconPhone className="portal-icon-sm" />
              تماس برای نوبت
            </button>
            {portalUser ? (
              <PortalSessionActions
                user={portalUser}
                onLogout={onPortalLogout}
                stacked
              />
            ) : (
              <button type="button" className="p-btn p-btn--outline" onClick={() => { setMenuOpen(false); goToLogin(); }}>
                <IconLogin className="portal-icon-sm" />
                ورود به سامانه
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="portal-hero">
        <div className="portal-container portal-hero__grid">
          <div className="portal-hero__content">
            <div className="portal-pill">
              <IconHeart className="portal-icon-sm" />
              {hero.pill}
            </div>
            <h1 className="portal-hero__title">
              {doctor.name}
            </h1>
            <p className="portal-hero__subtitle">{doctor.specialty}</p>
            <p className="portal-hero__desc">
              {hero.description}
            </p>
            <div className="portal-hero__cta">
              <button type="button" className="p-btn p-btn--primary p-btn--lg" onClick={startBooking}>
                <IconPhone className="portal-icon-sm" />
                تماس برای نوبت
              </button>
              <button type="button" className="p-btn p-btn--soft p-btn--lg" onClick={() => scrollTo('services')}>
                مشاهده خدمات
              </button>
            </div>
            {isSectionEnabled('HeroStat') && (
            <div className="portal-hero__stats">
              {((): { strong: string; span: string }[] => {
                const source =
                  heroStats.length > 0
                    ? heroStats
                    : [
                        { strong: '+۱۰', span: 'سال تجربه بالینی' },
                        { strong: 'بورد', span: 'تخصصی معتبر' },
                        { strong: 'شوشتر', span: 'پذیرش نوبتی' },
                      ];
                // Deduplicate identical rows (CMS sometimes has duplicates)
                const seen = new Set<string>();
                return source.filter((stat) => {
                  const key = `${stat.strong}|${stat.span}`;
                  if (seen.has(key)) return false;
                  seen.add(key);
                  return true;
                });
              })().map((stat) => (
                <div key={`${stat.strong}-${stat.span}`}>
                  <strong>{stat.strong}</strong>
                  <span>{stat.span}</span>
                </div>
              ))}
            </div>
            )}
          </div>
          {isSectionEnabled('HeroSlide') && (
          <div className="portal-hero__visual">
            <HeroSlider
              slides={heroSlides}
              floatTitle={hero.floatTitle}
              floatSubtitle={hero.floatSubtitle}
            />
          </div>
          )}
        </div>
      </section>

      {/* Trust strip */}
      {isSectionEnabled('TrustBadge') && (
      <section className="portal-trust">
        <div className="portal-container portal-trust__grid">
          {trustList.map(({ Icon, label, sub }) => (
            <div key={label} className="portal-trust__item">
              <span className="portal-trust__icon"><Icon /></span>
              <div>
                <strong>{label}</strong>
                <span>{sub}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* About */}
      {isSectionEnabled('about') && (
      <section id="about" className="portal-section">
        <div className="portal-container portal-split">
          <div className="portal-about-card">
            <div className="portal-about-card__badge">{sections.aboutBadge}</div>
            <div className="portal-about-card__icon-ring">
              <IconStethoscope />
            </div>
            <ul className="portal-cred-list">
              <li><IconGraduation /><span>{doctor.board}</span></li>
              <li><IconHospital /><span>{doctor.general}</span></li>
            </ul>
          </div>
          <div className="portal-split__text">
            <h2 className="portal-h2">{sections.aboutTitle}</h2>
            <p>{sections.aboutP1}</p>
            <p>{sections.aboutP2}</p>
            <div className="portal-quote">
              «{contact.quote}»
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Why us */}
      {isSectionEnabled('WhyUsFeature') && (
      <section id="why" className="portal-section portal-section--cream">
        <div className="portal-container">
          <div className="portal-section-head">
            <h2 className="portal-h2">{sections.whyTitle}</h2>
            <p>{sections.whySubtitle}</p>
          </div>
          <div className="portal-features">
            {whyList.map(({ title, desc, Icon }) => (
              <article key={title} className="portal-feature">
                <span className="portal-feature__icon"><Icon /></span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Services */}
      {isSectionEnabled('Service') && (
      <section id="services" className="portal-section">
        <div className="portal-container">
          <div className="portal-section-head">
            <h2 className="portal-h2">{sections.servicesTitle}</h2>
            <p>{sections.servicesSubtitle}</p>
          </div>
          <div className="portal-services">
            {serviceList.map(({ Icon, title, desc, color }) => (
              <article key={title} className="portal-service">
                <span className="portal-service__icon" style={{ color, background: `${color}14` }}>
                  <Icon />
                </span>
                <h3>{title}</h3>
                <p>{desc}</p>
                <button type="button" className="portal-service__link" onClick={startBooking}>
                  درخواست نوبت ←
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Reviews */}
      {isSectionEnabled('reviews') && (
      <section id="reviews" className="portal-section portal-section--cream">
        <div className="portal-container">
          <div className="portal-section-head">
            <h2 className="portal-h2">{sections.reviewsTitle}</h2>
            <p>{sections.reviewsSubtitle}</p>
          </div>
          <div className="portal-reviews-grid">
            <div className="portal-reviews-list">
              {reviews.length === 0 ? (
                <p className="portal-reviews-empty">هنوز نظری ثبت نشده است. اولین نفری باشید که نظر می‌دهید.</p>
              ) : (
                reviews.map((review) => (
                  <article key={review.patientReviewId} className="portal-review-card">
                    <div className="portal-review-card__head">
                      <strong>{review.displayName}</strong>
                      <span className="portal-review-card__stars" aria-label={`امتیاز ${review.rating}`}>
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </span>
                    </div>
                    <p>{review.reviewText}</p>
                  </article>
                ))
              )}
            </div>
            <div className="portal-review-submit-card">
              <h3>نظر خود را بنویسید</h3>
              <p>با شماره موبایل یا ایمیل — پس از بررسی منشی/مدیر منتشر می‌شود.</p>
              <PatientReviewForm />
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Contact */}
      {isSectionEnabled('contact') && (
      <section id="contact" className="portal-section portal-section--cream">
        <div className="portal-container portal-contact">
          <div className="portal-contact__info">
            <h2 className="portal-h2">{sections.contactTitle}</h2>
            <p className="portal-contact__lead">{sections.contactLead}</p>

            <div className="portal-info-cards">
              <div className="portal-info-card">
                <span className="portal-info-card__icon"><IconLocation /></span>
                <div>
                  <strong>آدرس</strong>
                  <p>{doctor.address}</p>
                </div>
              </div>
              <div className="portal-info-card">
                <span className="portal-info-card__icon portal-info-card__icon--accent"><IconPhone /></span>
                <div>
                  <strong>تلفن نوبت</strong>
                  <a href={`tel:${contact.phone}`}>{contact.phoneDisplay}</a>
                </div>
              </div>
              <div className="portal-info-card">
                <span className="portal-info-card__icon"><IconClock /></span>
                <div>
                  <strong>ساعات پذیرش</strong>
                  <p>{contact.hours}</p>
                </div>
              </div>
            </div>

            <div className="portal-contact__cta">
              <button type="button" className="p-btn p-btn--primary p-btn--lg" onClick={startBooking}>
                تماس الان
              </button>
              <button type="button" className="p-btn p-btn--outline p-btn--lg" onClick={goToLogin}>
                <IconLogin className="portal-icon-sm" />
                ورود به سامانه Healan
              </button>
            </div>
            <p className="portal-contact__hint">
              {sections.contactHint}
            </p>
          </div>

          <div className="portal-map-card">
            <div className="portal-map-card__header">
              <IconLocation />
              <span>{map.header}</span>
            </div>
            <div className="portal-map-card__body">
              <p>{map.building}</p>
              <small>{map.detail}</small>
            </div>
            <a
              className="portal-map-card__link"
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

      <footer className="portal-footer">
        <div className="portal-container portal-footer__inner">
          <div className="portal-footer__brand">
            <IconHeart />
            <div>
              <strong>{doctor.name}</strong>
              <span>{doctor.specialty} · {doctor.city}</span>
            </div>
          </div>
          <div className="portal-footer__links">
            <button type="button" onClick={() => scrollTo('services')}>خدمات</button>
            <button type="button" onClick={() => scrollTo('contact')}>تماس</button>
            {portalUser ? (
              <button type="button" onClick={onPortalLogout}>خروج ({portalUser.displayName})</button>
            ) : (
              <button type="button" onClick={goToLogin}>ورود</button>
            )}
          </div>
        </div>
        <div className="portal-container">
          <p className="portal-footer__copy">© {new Date().getFullYear()} — تمامی حقوق محفوظ است</p>
        </div>
      </footer>

      <PortalAuthModal
        open={authOpen}
        initialMode={authMode}
        onClose={() => setAuthOpen(false)}
        onSuccess={async () => {
          setAuthOpen(false);
          await refreshPortalUser();
          navigate('/booking');
        }}
      />
    </div>
  );
}

export default LandingPage;
