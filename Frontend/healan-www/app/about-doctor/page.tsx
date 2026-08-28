import type { Metadata } from 'next';
import Link from 'next/link';
import { BookingCta } from '@/components/CtaLinks';
import { JsonLd } from '@/components/JsonLd';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { fetchSite, portalSetting } from '@/lib/api';
import { buildMetadata, SITE_URL } from '@/lib/seo';
import { buildLandingModel } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const site = await fetchSite();
  const model = buildLandingModel(site);
  return buildMetadata({ site, path: '/about-doctor', overrides: { title: `${model.doctor.name} | متخصص قلب و عروق در شوشتر`, description: `معرفی، سوابق تحصیلی و حوزه‌های فعالیت ${model.doctor.name}، متخصص قلب و عروق و ارائه‌دهنده خدمات ارزیابی واریس در شوشتر.` } });
}

export default async function AboutDoctorPage() {
  const site = await fetchSite();
  const model = buildLandingModel(site);
  const generalEducation = portalSetting(site, 'doctor.general', 'فارغ‌التحصیل پزشکی عمومی از دانشگاه علوم پزشکی تهران');
  const aboutP1 = portalSetting(site, 'section.about.p1', `${model.doctor.name} با رویکردی مبتنی بر شواهد علمی، برای شنیدن علائم و طراحی مسیر بررسی و درمان هر بیمار زمان کافی اختصاص می‌دهد.`);
  const aboutP2 = portalSetting(site, 'section.about.p2', `هدف مطب، ارائه خدمات تخصصی قلب و عروق در فضایی آرام و قابل‌اعتماد برای ساکنان ${model.doctor.city} است.`);
  const url = `${SITE_URL.replace(/\/$/, '')}/about-doctor`;
  const jsonLd = [{ '@context': 'https://schema.org', '@type': ['ProfilePage', 'MedicalWebPage'], name: `درباره ${model.doctor.name}`, url, mainEntity: { '@type': 'Physician', name: model.doctor.name, jobTitle: model.doctor.specialty, description: model.doctor.board, medicalSpecialty: ['Cardiovascular', 'Vascular medicine'], telephone: model.doctor.phone, worksFor: { '@type': 'MedicalClinic', name: `مطب ${model.doctor.name}`, url: SITE_URL }, address: { '@type': 'PostalAddress', streetAddress: model.doctor.address, addressLocality: model.doctor.city, addressCountry: 'IR' }, knowsAbout: ['بیماری‌های قلب و عروق', 'فشار خون', 'تپش قلب', 'واریس پا', 'نارسایی وریدی'] } }];

  return <><JsonLd data={jsonLd} /><SiteHeader brandName={model.doctor.shortName} specialty={model.doctor.specialty} phone={model.contact.phone} phoneDisplay={model.contact.phoneDisplay} topbar={model.contact.topbar} /><main className="doctor-profile"><section className="doctor-profile__hero"><div className="container"><nav className="breadcrumbs"><Link href="/">خانه</Link><span>←</span><span>درباره پزشک</span></nav><span className="section-badge">پروفایل پزشک</span><h1>{model.doctor.name}</h1><p className="doctor-profile__specialty">{model.doctor.specialty} در {model.doctor.city}</p><div className="medical-hero__actions"><BookingCta className="btn btn--primary btn--lg" /><a className="btn btn--outline btn--lg" href={`tel:${model.doctor.phone}`}>تماس با مطب</a></div></div></section><section className="section"><div className="container doctor-profile__grid"><article><h2>معرفی و رویکرد درمانی</h2><p>{aboutP1}</p><p>{aboutP2}</p><h2>سوابق تحصیلی و تخصصی</h2><ul className="profile-credentials"><li>{model.doctor.board}</li><li>{generalEducation}</li></ul></article><aside className="profile-contact"><strong>اطلاعات مطب</strong><dl><dt>شهر</dt><dd>{model.doctor.city}</dd><dt>آدرس</dt><dd>{model.doctor.address}</dd><dt>تلفن نوبت‌دهی</dt><dd><a href={`tel:${model.doctor.phone}`}>{model.doctor.phoneDisplay}</a></dd></dl></aside></div></section><section className="section section--muted"><div className="container"><div className="section-head"><h2>حوزه‌های فعالیت</h2><p>برای مشاهده توضیحات کامل، علائم قابل بررسی و مسیر مراجعه وارد صفحه مربوط شوید.</p></div><div className="specialty-routes"><Link href="/cardiology" className="specialty-route"><span>خدمات تخصصی</span><h3>قلب و عروق</h3><p>ارزیابی علائم قلبی، فشار خون و عوامل خطر بیماری‌های قلبی</p><strong>مشاهده صفحه قلب و عروق ←</strong></Link><Link href="/varicose-veins" className="specialty-route"><span>ارزیابی عروق پا</span><h3>واریس و نارسایی وریدی</h3><p>بررسی رگ‌های واریسی، درد، سنگینی و ورم پا</p><strong>مشاهده صفحه واریس ←</strong></Link></div></div></section></main><SiteFooter name={model.doctor.name} specialty={model.doctor.specialty} city={model.doctor.city} /></>;
}
