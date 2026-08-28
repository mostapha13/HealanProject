import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { MedicalServiceLanding } from '@/components/MedicalServiceLanding';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { fetchSite } from '@/lib/api';
import { cardiologyContent } from '@/lib/medical-pages';
import { buildLandingModel } from '@/lib/site';
import { buildMedicalPageJsonLd, buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';
const path = '/cardiology';
const description = 'ویزیت متخصص قلب و عروق در شوشتر برای بررسی درد قفسه سینه، تپش قلب، تنگی نفس، فشار خون و عوامل خطر بیماری‌های قلبی.';

export async function generateMetadata(): Promise<Metadata> {
  const site = await fetchSite();
  return buildMetadata({
    site,
    path,
    overrides: {
      title: 'متخصص قلب و عروق در شوشتر | دکتر معصومه شهرویی',
      description,
    },
  });
}

export default async function CardiologyPage() {
  const site = await fetchSite();
  const model = buildLandingModel(site);
  const jsonLd = buildMedicalPageJsonLd({ site, path, title: cardiologyContent.title, description, serviceName: 'قلب و عروق', faq: cardiologyContent.faq });
  return <><JsonLd data={jsonLd} /><SiteHeader brandName={model.doctor.shortName} specialty={model.doctor.specialty} phone={model.contact.phone} phoneDisplay={model.contact.phoneDisplay} topbar={model.contact.topbar} /><MedicalServiceLanding content={cardiologyContent} doctorName={model.doctor.name} city={model.doctor.city} phone={model.contact.phone} phoneDisplay={model.contact.phoneDisplay} /><SiteFooter name={model.doctor.name} specialty={model.doctor.specialty} city={model.doctor.city} /></>;
}
