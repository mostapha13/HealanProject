import type { Metadata } from 'next';
import type {
  BlogPostDetail,
  PortalSeoPage,
  PublishedPortalSite,
} from './api';
import { portalSetting } from './api';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.drshahrooei.ir';

const DEFAULT_DOCTOR = {
  name: 'دکتر معصومه شهرویی',
  shortName: 'معصومه شهرویی',
  specialty: 'متخصص قلب و عروق',
  board: 'فارغ‌التحصیل و دارای بورد تخصصی از بیمارستان فوق‌تخصصی شهید رجایی تهران',
  address:
    'شوشتر، خیابان طالقانی، پایین‌تر از خیابان سادات، ساختمان پزشکان دکتر جلالی (آزمایشگاه سلامت)، طبقه دوم، واحد ۲',
  city: 'شوشتر',
  phone: '09025103867',
};

export function normalizePath(path: string): string {
  if (!path || path === '/') return '/';
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  return withSlash.replace(/\/+$/, '') || '/';
}

export function pickSeoPage(
  site: PublishedPortalSite | null | undefined,
  path: string
): PortalSeoPage | undefined {
  const target = normalizePath(path);
  return (site?.seoPages ?? []).find(
    (p) => p.isActive !== false && normalizePath(p.path) === target
  );
}

export function doctorFromSettings(site: PublishedPortalSite | null | undefined) {
  const s = (key: string, fallback: string) => portalSetting(site, key, fallback);
  return {
    name: s('doctor.name', DEFAULT_DOCTOR.name),
    shortName: s('doctor.shortName', DEFAULT_DOCTOR.shortName),
    specialty: s('doctor.specialty', DEFAULT_DOCTOR.specialty),
    board: s('doctor.board', DEFAULT_DOCTOR.board),
    address: s('contact.address', DEFAULT_DOCTOR.address),
    city: s('contact.city', DEFAULT_DOCTOR.city),
    phone: s('contact.phone', DEFAULT_DOCTOR.phone),
    phoneDisplay: s('contact.phoneDisplay', DEFAULT_DOCTOR.phone),
  };
}

function absoluteUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = SITE_URL.replace(/\/$/, '');
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}

export function buildMetadata(opts: {
  site?: PublishedPortalSite | null;
  path: string;
  titleFallback?: string;
  descriptionFallback?: string;
  ogImageFallback?: string;
  overrides?: {
    title?: string;
    description?: string;
    ogImageUrl?: string;
  };
}): Metadata {
  const seo = pickSeoPage(opts.site, opts.path);
  const doctor = doctorFromSettings(opts.site);
  const title =
    opts.overrides?.title ||
    seo?.title ||
    opts.titleFallback ||
    `${doctor.name} | ${doctor.specialty}`;
  const description =
    opts.overrides?.description ||
    seo?.description ||
    opts.descriptionFallback ||
    `${doctor.specialty} — ${doctor.city}`;
  const ogTitle = seo?.ogTitle || title;
  const ogDescription = seo?.ogDescription || description;
  const ogImage =
    absoluteUrl(
      opts.overrides?.ogImageUrl ||
        seo?.ogImageUrl ||
        opts.ogImageFallback
    ) || undefined;
  const pathNorm = normalizePath(opts.path);
  const pageUrl =
    `${SITE_URL.replace(/\/$/, '')}${pathNorm === '/' ? '' : pathNorm}`;
  const canonical = absoluteUrl(seo?.canonicalUrl) || pageUrl;
  const robots = seo?.robots || 'index,follow';

  return {
    title: {
      absolute: title,
    },
    description,
    keywords: seo?.keywords || undefined,
    robots,
    alternates: { canonical },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      locale: 'fa_IR',
      type: opts.path.startsWith('/blog/') ? 'article' : 'website',
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

function parseJsonLdExtra(raw?: string | null): Record<string, unknown>[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    const items = Array.isArray(parsed) ? parsed : [parsed];
    return items.filter(
      (item): item is Record<string, unknown> =>
        !!item && typeof item === 'object' && !Array.isArray(item)
    );
  } catch {
    return [];
  }
}

export function buildHomeJsonLd(
  site: PublishedPortalSite | null | undefined
): Record<string, unknown>[] {
  const doctor = doctorFromSettings(site);
  const seo = pickSeoPage(site, '/');
  const physician: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    name: doctor.name,
    medicalSpecialty: doctor.specialty,
    description: seo?.description || doctor.board,
    url: SITE_URL,
    telephone: doctor.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: doctor.address,
      addressLocality: doctor.city,
      addressCountry: 'IR',
    },
  };
  const clinic: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    name: `مطب ${doctor.shortName}`,
    description: seo?.description || `${doctor.specialty} در ${doctor.city}`,
    url: SITE_URL,
    telephone: doctor.phone,
    image: absoluteUrl(seo?.ogImageUrl),
    address: {
      '@type': 'PostalAddress',
      streetAddress: doctor.address,
      addressLocality: doctor.city,
      addressCountry: 'IR',
    },
    medicalSpecialty: doctor.specialty,
  };
  return [physician, clinic, ...parseJsonLdExtra(seo?.jsonLdExtra)];
}

export function buildBlogPostingJsonLd(
  site: PublishedPortalSite | null | undefined,
  post: BlogPostDetail
): Record<string, unknown>[] {
  const doctor = doctorFromSettings(site);
  const url = `${SITE_URL.replace(/\/$/, '')}/blog/${post.slug}`;
  const posting: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || undefined,
    image: absoluteUrl(post.ogImageUrl || post.coverImageUrl),
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.publishedAt || post.createdAt,
    author: {
      '@type': 'Person',
      name: doctor.name,
    },
    publisher: {
      '@type': 'Organization',
      name: `مطب ${doctor.shortName}`,
      url: SITE_URL,
    },
    mainEntityOfPage: url,
    url,
  };
  // Do not merge /blog index jsonLdExtra onto every article.
  return [posting];
}
