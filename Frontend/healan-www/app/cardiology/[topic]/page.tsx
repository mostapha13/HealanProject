import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/JsonLd';
import { MedicalArticle } from '@/components/MedicalArticle';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { fetchSite } from '@/lib/api';
import { cardiologyArticles } from '@/lib/medical-articles';
import { buildMedicalArticleJsonLd, buildMetadata } from '@/lib/seo';
import { buildLandingModel } from '@/lib/site';

type Props = { params: Promise<{ topic: string }> };
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const content = cardiologyArticles[topic];
  if (!content) return {};
  const site = await fetchSite();
  return buildMetadata({ site, path: `/cardiology/${topic}`, overrides: { title: `${content.title} | دکتر معصومه شهرویی`, description: content.description } });
}

export default async function CardiologyArticlePage({ params }: Props) {
  const { topic } = await params;
  const content = cardiologyArticles[topic];
  if (!content) notFound();
  const site = await fetchSite();
  const model = buildLandingModel(site);
  const jsonLd = buildMedicalArticleJsonLd({ site, path: `/cardiology/${topic}`, title: content.title, description: content.description, parentPath: '/cardiology', parentName: 'قلب و عروق', faq: content.faq });
  return <><JsonLd data={jsonLd} /><SiteHeader brandName={model.doctor.shortName} specialty={model.doctor.specialty} phone={model.contact.phone} phoneDisplay={model.contact.phoneDisplay} topbar={model.contact.topbar} /><MedicalArticle content={content} doctorName={model.doctor.name} doctorBoard={model.doctor.board} /><SiteFooter name={model.doctor.name} specialty={model.doctor.specialty} city={model.doctor.city} /></>;
}
