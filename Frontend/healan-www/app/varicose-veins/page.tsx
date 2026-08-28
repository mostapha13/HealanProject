import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { BeforeAfterGallery } from '@/components/BeforeAfterGallery';
import { MedicalServiceLanding } from '@/components/MedicalServiceLanding';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { fetchSite, fetchVaricoseCases } from '@/lib/api';
import { varicoseContent } from '@/lib/medical-pages';
import { buildLandingModel } from '@/lib/site';
import { buildMedicalPageJsonLd, buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';
const path = '/varicose-veins';
const description = 'تشخیص و درمان واریس پا در شوشتر؛ بررسی رگ‌های برجسته، درد، سنگینی و ورم پا و انتخاب روش درمان متناسب با شرایط بیمار.';

export async function generateMetadata(): Promise<Metadata> {
  const site = await fetchSite();
  return buildMetadata({
    site,
    path,
    overrides: {
      title: 'درمان واریس پا در شوشتر | دکتر معصومه شهرویی',
      description,
    },
  });
}

export default async function VaricoseVeinsPage() {
  const [site, cases] = await Promise.all([fetchSite(), fetchVaricoseCases()]);
  const model = buildLandingModel(site);
  const jsonLd = buildMedicalPageJsonLd({ site, path, title: varicoseContent.title, description, serviceName: 'واریس و نارسایی وریدی', faq: varicoseContent.faq });
  return <><JsonLd data={jsonLd} /><SiteHeader brandName={model.doctor.shortName} specialty={model.doctor.specialty} phone={model.contact.phone} phoneDisplay={model.contact.phoneDisplay} topbar={model.contact.topbar} /><MedicalServiceLanding content={varicoseContent} doctorName={model.doctor.name} city={model.doctor.city} phone={model.contact.phone} phoneDisplay={model.contact.phoneDisplay} /><BeforeAfterGallery items={cases} /><SiteFooter name={model.doctor.name} specialty={model.doctor.specialty} city={model.doctor.city} /></>;
}
