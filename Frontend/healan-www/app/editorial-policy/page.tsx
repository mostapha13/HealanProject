import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { fetchSite } from '@/lib/api';
import { buildMetadata, SITE_URL } from '@/lib/seo';
import { buildLandingModel } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const site = await fetchSite();
  return buildMetadata({ site, path: '/editorial-policy', overrides: { title: 'سیاست تحریریه و بازبینی پزشکی | دکتر معصومه شهرویی', description: 'اصول تهیه، بازبینی، اصلاح و انتشار مطالب پزشکی در وب‌سایت دکتر معصومه شهرویی.' } });
}

export default async function EditorialPolicyPage() {
  const site = await fetchSite();
  const model = buildLandingModel(site);
  const jsonLd = [{ '@context': 'https://schema.org', '@type': 'AboutPage', name: 'سیاست تحریریه و بازبینی پزشکی', url: `${SITE_URL}/editorial-policy`, inLanguage: 'fa-IR', reviewedBy: { '@type': 'Physician', name: model.doctor.name } }];
  return <><JsonLd data={jsonLd} /><SiteHeader brandName={model.doctor.shortName} specialty={model.doctor.specialty} phone={model.contact.phone} phoneDisplay={model.contact.phoneDisplay} topbar={model.contact.topbar} /><main className="policy-page"><article className="container policy-card"><nav className="breadcrumbs"><Link href="/">خانه</Link><span>←</span><span>سیاست تحریریه</span></nav><h1>سیاست تحریریه و بازبینی پزشکی</h1><p className="policy-lead">هدف ما ارائه اطلاعات پزشکی روشن، محتاطانه و قابل‌فهم درباره قلب، عروق و واریس است.</p><section><h2>نحوه تهیه مطالب</h2><p>مطالب بر اساس اصول پذیرفته‌شده پزشکی نوشته می‌شوند. متن‌ها از تشخیص قطعی برای مخاطب ناشناس، وعده درمان و توصیه دارویی فردی پرهیز می‌کنند.</p></section><section><h2>بازبینی تخصصی</h2><p>محتوای پزشکی سایت با نام بازبین و تاریخ آخرین بازبینی منتشر می‌شود. بازبینی توسط {model.doctor.name}، {model.doctor.specialty}، انجام می‌شود.</p><p>{model.doctor.board}</p></section><section><h2>اصلاح و به‌روزرسانی</h2><p>در صورت تغییر شواهد پزشکی، مشاهده خطا یا نیاز به شفاف‌سازی، مطالب اصلاح می‌شوند و تاریخ بازبینی آن‌ها به‌روزرسانی خواهد شد.</p></section><section><h2>محدودیت اطلاعات پزشکی</h2><p>مطالب این سایت جایگزین ویزیت، معاینه یا خدمات اورژانسی نیستند. در علائم شدید یا ناگهانی باید با اورژانس ۱۱۵ تماس گرفت.</p></section><section><h2>حریم استقلال محتوایی</h2><p>اولویت مطالب، آموزش بیمار و کمک به تصمیم‌گیری آگاهانه است. محتوای آموزشی نباید به‌عنوان تضمین نتیجه درمان تلقی شود.</p></section><p className="policy-updated">آخرین بازبینی این سیاست: ۶ شهریور ۱۴۰۵</p></article></main><SiteFooter name={model.doctor.name} specialty={model.doctor.specialty} city={model.doctor.city} /></>;
}
