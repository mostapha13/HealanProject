import React, { useEffect, useState } from 'react';
import { DOCTOR, callForAppointment, goToClinicLogin } from '../../constants';
import { environment } from '../../environments/environment';
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

const services = [
  { Icon: IconStethoscope, title: 'معاینه تخصصی قلب', desc: 'ارزیابی جامع علائم و وضعیت قلب و عروق', color: '#ef394e' },
  { Icon: IconEcg, title: 'اکوکاردیوگرافی', desc: 'بررسی دقیق عملکرد دریچه‌ها و عضله قلب', color: '#19bfd3' },
  { Icon: IconHeart, title: 'نوار قلب و فشارخون', desc: 'پایش ریتم، فشار و تشخیص زودهنگام', color: '#f59e0b' },
  { Icon: IconShield, title: 'پیگیری بیماران مزمن', desc: 'مدیریت نارسایی قلب، آریتمی و عروق کرونر', color: '#10b981' },
  { Icon: IconHospital, title: 'مشاوره درمانی', desc: 'برنامه درمانی شخصی‌سازی‌شده برای هر بیمار', color: '#6366f1' },
  { Icon: IconGraduation, title: 'پیشگیری و آموزش', desc: 'راهنمای سبک زندگی سالم برای سلامت قلب', color: '#ec4899' },
];

const trustItems = [
  { Icon: IconGraduation, label: 'بورد تخصصی', sub: 'شهید رجایی تهران' },
  { Icon: IconHospital, label: 'دانشگاه تهران', sub: 'دکترای عمومی' },
  { Icon: IconShield, label: 'استاندارد بالا', sub: 'تجهیزات تشخیصی' },
  { Icon: IconHeart, label: 'قلب و عروق', sub: 'تخصص اصلی' },
];

const navItems = [
  ['about', 'درباره پزشک'],
  ['services', 'خدمات'],
  ['why', 'چرا این مطب؟'],
  ['contact', 'تماس'],
] as const;

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
          <span>مطب تخصصی قلب و عروق · شوشتر</span>
          <a href={`tel:${environment.phone}`} className="portal-topbar__phone">
            <IconPhone className="portal-icon-sm" />
            {environment.phoneDisplay}
          </a>
        </div>
      </div>

      <header className={`portal-header${scrolled ? ' is-scrolled' : ''}`}>
        <div className="portal-container portal-header__inner">
          <a href="#" className="portal-brand" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <span className="portal-brand__mark"><IconHeart /></span>
            <div className="portal-brand__text">
              <strong>{DOCTOR.shortName}</strong>
              <span>{DOCTOR.specialty}</span>
            </div>
          </a>

          <nav className="portal-nav" aria-label="منوی اصلی">
            {navItems.map(([id, label]) => (
              <button key={id} type="button" className="portal-nav__link" onClick={() => scrollTo(id)}>
                {label}
              </button>
            ))}
          </nav>

          <div className="portal-header__actions">
            <button type="button" className="p-btn p-btn--outline p-btn--sm portal-header__call" onClick={callForAppointment}>
              <IconPhone className="portal-icon-sm" />
              <span>رزرو نوبت</span>
            </button>
            <button type="button" className="p-btn p-btn--primary p-btn--sm" onClick={goToClinicLogin}>
              <IconLogin className="portal-icon-sm" />
              <span>ورود</span>
            </button>
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
            {navItems.map(([id, label]) => (
              <button key={id} type="button" onClick={() => scrollTo(id)}>
                {label}
              </button>
            ))}
            <hr />
            <button type="button" className="p-btn p-btn--primary" onClick={() => { setMenuOpen(false); callForAppointment(); }}>
              <IconPhone className="portal-icon-sm" />
              تماس برای نوبت
            </button>
            <button type="button" className="p-btn p-btn--outline" onClick={() => { setMenuOpen(false); goToClinicLogin(); }}>
              <IconLogin className="portal-icon-sm" />
              ورود به سامانه
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="portal-hero">
        <div className="portal-container portal-hero__grid">
          <div className="portal-hero__content">
            <div className="portal-pill">
              <IconHeart className="portal-icon-sm" />
              مراقبت تخصصی از قلب شما
            </div>
            <h1 className="portal-hero__title">
              {DOCTOR.name}
            </h1>
            <p className="portal-hero__subtitle">{DOCTOR.specialty}</p>
            <p className="portal-hero__desc">
              با بورد تخصصی از بیمارستان فوق‌تخصصی شهید رجایی و تحصیلات دانشگاه علوم پزشکی تهران،
              خدمات تشخیصی و درمانی استاندارد قلب و عروق را در شوشتر ارائه می‌دهیم.
            </p>
            <div className="portal-hero__cta">
              <button type="button" className="p-btn p-btn--primary p-btn--lg" onClick={callForAppointment}>
                <IconPhone className="portal-icon-sm" />
                تماس برای نوبت
              </button>
              <button type="button" className="p-btn p-btn--soft p-btn--lg" onClick={() => scrollTo('services')}>
                مشاهده خدمات
              </button>
            </div>
            <div className="portal-hero__stats">
              <div><strong>+۱۰</strong><span>سال تجربه بالینی</span></div>
              <div><strong>بورد</strong><span>تخصصی معتبر</span></div>
              <div><strong>شوشتر</strong><span>پذیرش نوبتی</span></div>
            </div>
          </div>
          <div className="portal-hero__visual">
            <HeroSlider />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="portal-trust">
        <div className="portal-container portal-trust__grid">
          {trustItems.map(({ Icon, label, sub }) => (
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

      {/* About */}
      <section id="about" className="portal-section">
        <div className="portal-container portal-split">
          <div className="portal-about-card">
            <div className="portal-about-card__badge">درباره پزشک</div>
            <div className="portal-about-card__icon-ring">
              <IconStethoscope />
            </div>
            <ul className="portal-cred-list">
              <li><IconGraduation /><span>{DOCTOR.board}</span></li>
              <li><IconHospital /><span>{DOCTOR.general}</span></li>
            </ul>
          </div>
          <div className="portal-split__text">
            <h2 className="portal-h2">پزشکی دقیق، همراهی صمیمانه</h2>
            <p>
              {DOCTOR.name} با رویکردی مبتنی بر شواهد علمی، برای هر بیمار زمان کافی برای شنیدن
              علائم، توضیح وضعیت و طراحی برنامه درمانی اختصاص می‌دهد.
            </p>
            <p>
              هدف این مطب، ارائه خدمات قلب و عروق در سطح استانداردهای دانشگاهی، در فضایی آرام و
              قابل‌اعتماد برای ساکنان شوشتر و شهرستان‌های اطراف است.
            </p>
            <div className="portal-quote">
              «سلامت قلب، پایه زندگی سالم است — پیشگیری همیشه از درمان آسان‌تر است.»
            </div>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section id="why" className="portal-section portal-section--cream">
        <div className="portal-container">
          <div className="portal-section-head">
            <h2 className="portal-h2">چرا مطب دکتر شهرویی؟</h2>
            <p>تجربه‌ای شبیه سایت‌های حرفه‌ای — شفاف، سریع و قابل اعتماد</p>
          </div>
          <div className="portal-features">
            {[
              { title: 'تخصص و بورد معتبر', desc: 'فارغ‌التحصیل برترین مراکز درمانی کشور', Icon: IconGraduation },
              { title: 'پذیرش منظم', desc: 'نوبت‌دهی تلفنی و پیگیری منظم بیمار', Icon: IconPhone },
              { title: 'تشخیص دقیق', desc: 'اکو، نوار قلب و معاینه تخصصی', Icon: IconEcg },
              { title: 'محیط استاندارد', desc: 'فضای آرام مطب در مرکز پزشکان', Icon: IconHospital },
            ].map(({ title, desc, Icon }) => (
              <article key={title} className="portal-feature">
                <span className="portal-feature__icon"><Icon /></span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="portal-section">
        <div className="portal-container">
          <div className="portal-section-head">
            <h2 className="portal-h2">خدمات تخصصی قلب و عروق</h2>
            <p>پوشش کامل نیازهای تشخیصی و درمانی — مرتب و دسته‌بندی‌شده</p>
          </div>
          <div className="portal-services">
            {services.map(({ Icon, title, desc, color }) => (
              <article key={title} className="portal-service">
                <span className="portal-service__icon" style={{ color, background: `${color}14` }}>
                  <Icon />
                </span>
                <h3>{title}</h3>
                <p>{desc}</p>
                <button type="button" className="portal-service__link" onClick={callForAppointment}>
                  درخواست نوبت ←
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="portal-section portal-section--cream">
        <div className="portal-container portal-contact">
          <div className="portal-contact__info">
            <h2 className="portal-h2">تماس و آدرس مطب</h2>
            <p className="portal-contact__lead">برای رزرو نوبت تماس بگیرید یا به مطب مراجعه کنید.</p>

            <div className="portal-info-cards">
              <div className="portal-info-card">
                <span className="portal-info-card__icon"><IconLocation /></span>
                <div>
                  <strong>آدرس</strong>
                  <p>{DOCTOR.address}</p>
                </div>
              </div>
              <div className="portal-info-card">
                <span className="portal-info-card__icon portal-info-card__icon--accent"><IconPhone /></span>
                <div>
                  <strong>تلفن نوبت</strong>
                  <a href={`tel:${environment.phone}`}>{environment.phoneDisplay}</a>
                </div>
              </div>
              <div className="portal-info-card">
                <span className="portal-info-card__icon"><IconClock /></span>
                <div>
                  <strong>ساعات پذیرش</strong>
                  <p>شنبه تا چهارشنبه — با هماهنگی تلفنی</p>
                </div>
              </div>
            </div>

            <div className="portal-contact__cta">
              <button type="button" className="p-btn p-btn--primary p-btn--lg" onClick={callForAppointment}>
                تماس الان
              </button>
              <button type="button" className="p-btn p-btn--outline p-btn--lg" onClick={goToClinicLogin}>
                <IconLogin className="portal-icon-sm" />
                ورود به سامانه Healan
              </button>
            </div>
            <p className="portal-contact__hint">
              پرسنل، پزشک و بیماران پس از ورود، بر اساس نقش کاربری به بخش‌های مربوط در سامانه Healan دسترسی دارند.
            </p>
          </div>

          <div className="portal-map-card">
            <div className="portal-map-card__header">
              <IconLocation />
              <span>{DOCTOR.city} — خیابان طالقانی</span>
            </div>
            <div className="portal-map-card__body">
              <p>ساختمان پزشکان دکتر جلالی</p>
              <small>آزمایشگاه سلامت · طبقه ۲ · واحد ۲</small>
            </div>
            <a
              className="portal-map-card__link"
              href="https://www.google.com/maps/search/Shushtar+Taleghani"
              target="_blank"
              rel="noopener noreferrer"
            >
              مشاهده در نقشه
            </a>
          </div>
        </div>
      </section>

      <footer className="portal-footer">
        <div className="portal-container portal-footer__inner">
          <div className="portal-footer__brand">
            <IconHeart />
            <div>
              <strong>{DOCTOR.name}</strong>
              <span>{DOCTOR.specialty} · {DOCTOR.city}</span>
            </div>
          </div>
          <div className="portal-footer__links">
            <button type="button" onClick={() => scrollTo('services')}>خدمات</button>
            <button type="button" onClick={() => scrollTo('contact')}>تماس</button>
            <button type="button" onClick={goToClinicLogin}>ورود</button>
          </div>
        </div>
        <div className="portal-container">
          <p className="portal-footer__copy">© {new Date().getFullYear()} — تمامی حقوق محفوظ است</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
