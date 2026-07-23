import type { PublishedPortalSite } from './api';
import { portalSetting } from './api';
import { doctorFromSettings } from './seo';

const DEFAULT_HERO_DESC =
  'با بورد تخصصی از بیمارستان فوق‌تخصصی شهید رجایی و تحصیلات دانشگاه علوم پزشکی تهران، خدمات تشخیصی و درمانی استاندارد قلب و عروق را در شوشتر ارائه می‌دهیم.';

export function buildLandingModel(site: PublishedPortalSite) {
  const doctor = doctorFromSettings(site);
  const s = (key: string, fallback = '') => portalSetting(site, key, fallback);

  return {
    doctor,
    contact: {
      phone: doctor.phone,
      phoneDisplay: doctor.phoneDisplay,
      hours: s('contact.hours', 'شنبه تا چهارشنبه — با هماهنگی تلفنی'),
      topbar: s('site.topbar', 'مطب تخصصی قلب و عروق · شوشتر'),
      quote: s(
        'about.quote',
        'سلامت قلب، پایه زندگی سالم است — پیشگیری همیشه از درمان آسان‌تر است.'
      ),
    },
    hero: {
      pill: s('hero.pill', 'مراقبت تخصصی از قلب شما'),
      description: s('hero.description', DEFAULT_HERO_DESC),
      floatTitle: s('hero.float.title', 'قلب و عروق'),
      floatSubtitle: s('hero.float.subtitle', 'تشخیص · درمان · پیشگیری'),
    },
    sections: {
      aboutBadge: s('section.about.badge', 'درباره پزشک'),
      aboutTitle: s('section.about.title', 'پزشکی دقیق، همراهی صمیمانه'),
      aboutP1: s(
        'section.about.p1',
        `${doctor.name} با رویکردی مبتنی بر شواهد علمی، برای هر بیمار زمان کافی برای شنیدن علائم، توضیح وضعیت و طراحی برنامه درمانی اختصاص می‌دهد.`
      ),
      aboutP2: s(
        'section.about.p2',
        'هدف این مطب، ارائه خدمات قلب و عروق در سطح استانداردهای دانشگاهی، در فضایی آرام و قابل‌اعتماد برای ساکنان شوشتر و شهرستان‌های اطراف است.'
      ),
      whyTitle: s('section.why.title', 'چرا مطب دکتر شهرویی؟'),
      whySubtitle: s(
        'section.why.subtitle',
        'تجربه‌ای شفاف، سریع و قابل اعتماد'
      ),
      servicesTitle: s('section.services.title', 'خدمات تخصصی قلب و عروق'),
      servicesSubtitle: s(
        'section.services.subtitle',
        'پوشش کامل نیازهای تشخیصی و درمانی'
      ),
      reviewsTitle: s('section.reviews.title', 'نظرات بیماران'),
      reviewsSubtitle: s(
        'section.reviews.subtitle',
        'تجربه واقعی مراجعین — پس از تأیید مدیر در سایت نمایش داده می‌شود'
      ),
      contactTitle: s('section.contact.title', 'تماس و آدرس مطب'),
      contactLead: s(
        'section.contact.lead',
        'برای رزرو نوبت تماس بگیرید یا به مطب مراجعه کنید.'
      ),
    },
    map: {
      header: s('map.header', `${doctor.city} — خیابان طالقانی`),
      building: s('map.building', 'ساختمان پزشکان دکتر جلالی'),
      detail: s('map.detail', 'آزمایشگاه سلامت · طبقه ۲ · واحد ۲'),
      link: s(
        'map.link',
        'https://www.google.com/maps/search/Shushtar+Taleghani'
      ),
    },
  };
}
