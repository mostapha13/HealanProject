import { useEffect, useState } from 'react';
import { DOCTOR } from '../constants';
import { environment } from '../environments/environment';
import {
  fetchPublishedSite,
  portalItemsBySection,
  portalSetting,
  portalSectionEnabled,
  type PortalContentItem,
  type PublishedPortalSite,
} from '../api/portalApi';

const DEFAULT_HERO_DESC =
  'با بورد تخصصی از بیمارستان فوق‌تخصصی شهید رجایی و تحصیلات دانشگاه علوم پزشکی تهران، خدمات تشخیصی و درمانی استاندارد قلب و عروق را در شوشتر ارائه می‌دهیم.';

export function usePortalSite() {
  const [site, setSite] = useState<PublishedPortalSite | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublishedSite()
      .then(setSite)
      .catch(() => setSite(null))
      .finally(() => setLoading(false));
  }, []);

  const s = (key: string, fallback = '') => portalSetting(site, key, fallback);

  const doctor = {
    name: s('doctor.name', DOCTOR.name),
    shortName: s('doctor.shortName', DOCTOR.shortName),
    specialty: s('doctor.specialty', DOCTOR.specialty),
    board: s('doctor.board', DOCTOR.board),
    general: s('doctor.general', DOCTOR.general),
    address: s('contact.address', DOCTOR.address),
    city: s('contact.city', DOCTOR.city),
  };

  const contact = {
    phone: s('contact.phone', environment.phone),
    phoneDisplay: s('contact.phoneDisplay', environment.phoneDisplay),
    hours: s('contact.hours', 'شنبه تا چهارشنبه — با هماهنگی تلفنی'),
    topbar: s('site.topbar', 'مطب تخصصی قلب و عروق · شوشتر'),
    quote: s('about.quote', 'سلامت قلب، پایه زندگی سالم است — پیشگیری همیشه از درمان آسان‌تر است.'),
  };

  const hero = {
    pill: s('hero.pill', 'مراقبت تخصصی از قلب شما'),
    description: s('hero.description', DEFAULT_HERO_DESC),
    floatTitle: s('hero.float.title', 'قلب و عروق'),
    floatSubtitle: s('hero.float.subtitle', 'تشخیص · درمان · پیشگیری'),
  };

  const sections = {
    aboutBadge: s('section.about.badge', 'درباره پزشک'),
    aboutTitle: s('section.about.title', 'پزشکی دقیق، همراهی صمیمانه'),
    aboutP1: s('section.about.p1', `${doctor.name} با رویکردی مبتنی بر شواهد علمی، برای هر بیمار زمان کافی برای شنیدن علائم، توضیح وضعیت و طراحی برنامه درمانی اختصاص می‌دهد.`),
    aboutP2: s('section.about.p2', 'هدف این مطب، ارائه خدمات قلب و عروق در سطح استانداردهای دانشگاهی، در فضایی آرام و قابل‌اعتماد برای ساکنان شوشتر و شهرستان‌های اطراف است.'),
    whyTitle: s('section.why.title', 'چرا مطب دکتر شهرویی؟'),
    whySubtitle: s('section.why.subtitle', 'تجربه‌ای شبیه سایت‌های حرفه‌ای — شفاف، سریع و قابل اعتماد'),
    servicesTitle: s('section.services.title', 'خدمات تخصصی قلب و عروق'),
    servicesSubtitle: s('section.services.subtitle', 'پوشش کامل نیازهای تشخیصی و درمانی — مرتب و دسته‌بندی‌شده'),
    reviewsTitle: s('section.reviews.title', 'نظرات بیماران'),
    reviewsSubtitle: s('section.reviews.subtitle', 'تجربه واقعی مراجعین — پس از تأیید مدیر در سایت نمایش داده می‌شود'),
    contactTitle: s('section.contact.title', 'تماس و آدرس مطب'),
    contactLead: s('section.contact.lead', 'برای رزرو نوبت تماس بگیرید یا به مطب مراجعه کنید.'),
    contactHint: s('section.contact.hint', 'پرسنل، پزشک و بیماران پس از ورود، بر اساس نقش کاربری به بخش‌های مربوط در سامانه Healan دسترسی دارند.'),
  };

  const map = {
    header: s('map.header', `${doctor.city} — خیابان طالقانی`),
    building: s('map.building', 'ساختمان پزشکان دکتر جلالی'),
    detail: s('map.detail', 'آزمایشگاه سلامت · طبقه ۲ · واحد ۲'),
    link: s('map.link', 'https://www.google.com/maps/search/Shushtar+Taleghani'),
  };

  const heroStats = portalItemsBySection(site, 'HeroStat').map((item) => ({
    strong: item.title ?? '',
    span: item.subtitle ?? '',
  }));

  const heroSlides = portalItemsBySection(site, 'HeroSlide');

  const isSectionEnabled = (key: string, defaultEnabled = true) =>
    portalSectionEnabled(site, key, defaultEnabled);

  return {
    site,
    loading,
    doctor,
    contact,
    hero,
    sections,
    map,
    heroStats,
    heroSlides,
    isSectionEnabled,
    navItems: portalItemsBySection(site, 'NavLink'),
    trustItems: portalItemsBySection(site, 'TrustBadge'),
    services: portalItemsBySection(site, 'Service'),
    whyItems: portalItemsBySection(site, 'WhyUsFeature'),
    reviews: site?.reviews ?? [],
  };
}

export type HeroSlideData = PortalContentItem;
