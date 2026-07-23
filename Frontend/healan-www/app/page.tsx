import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { LandingView } from '@/components/LandingView';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import {
  fetchSite,
  portalItemsBySection,
  portalSectionEnabled,
} from '@/lib/api';
import { buildHomeJsonLd, buildMetadata } from '@/lib/seo';
import { buildLandingModel } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const site = await fetchSite();
  return buildMetadata({ site, path: '/' });
}

export default async function HomePage() {
  const site = await fetchSite();
  const model = buildLandingModel(site);
  const jsonLd = buildHomeJsonLd(site);

  return (
    <>
      <JsonLd data={jsonLd} />
      <SiteHeader
        brandName={model.doctor.shortName}
        specialty={model.doctor.specialty}
        phone={model.contact.phone}
        phoneDisplay={model.contact.phoneDisplay}
        topbar={model.contact.topbar}
      />
      <LandingView
        model={model}
        heroStats={portalItemsBySection(site, 'HeroStat')}
        heroSlides={portalItemsBySection(site, 'HeroSlide')}
        trustItems={portalItemsBySection(site, 'TrustBadge')}
        services={portalItemsBySection(site, 'Service')}
        whyItems={portalItemsBySection(site, 'WhyUsFeature')}
        showAbout={portalSectionEnabled(site, 'about')}
        showTrust={portalSectionEnabled(site, 'TrustBadge')}
        showWhy={portalSectionEnabled(site, 'WhyUsFeature')}
        showServices={portalSectionEnabled(site, 'Service')}
        showReviews={portalSectionEnabled(site, 'reviews')}
        showContact={portalSectionEnabled(site, 'contact')}
        showHeroStat={portalSectionEnabled(site, 'HeroStat')}
        showHeroSlide={portalSectionEnabled(site, 'HeroSlide')}
      />
      <SiteFooter
        name={model.doctor.name}
        specialty={model.doctor.specialty}
        city={model.doctor.city}
      />
    </>
  );
}
