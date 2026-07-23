export type PortalSectionType =
  | 'HeroSlide'
  | 'TrustBadge'
  | 'Service'
  | 'WhyUsFeature'
  | 'AboutBlock'
  | 'NavLink'
  | 'CustomSection'
  | 'HeroStat';

export interface PortalContentItem {
  portalContentItemId: number;
  sectionType: PortalSectionType | string;
  title?: string;
  subtitle?: string;
  body?: string;
  imageUrl?: string;
  imageFileId?: string;
  iconName?: string;
  linkUrl?: string;
  color?: string;
  sortOrder: number;
  isPublished: boolean;
}

export interface PatientReviewPublic {
  patientReviewId: number;
  displayName: string;
  reviewText: string;
  rating: number;
  reviewedAt?: string;
  createdAt?: string;
}

export interface PaginatedReviews {
  items: PatientReviewPublic[];
  pageNumber: number;
  pageCount: number;
  totalPages?: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PortalSeoPage {
  portalSeoPageId: number;
  pageKey: string;
  path: string;
  title: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  ogImageFileId?: string;
  canonicalUrl?: string;
  robots: string;
  jsonLdExtra?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface PublishedPortalSite {
  settings: Record<string, string>;
  contentItems: PortalContentItem[];
  reviews: PatientReviewPublic[];
  seoPages: PortalSeoPage[];
}

export interface BlogPostSummary {
  blogPostId: number;
  title: string;
  slug: string;
  excerpt?: string;
  coverImageUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt?: string;
}

export interface BlogPostDetail extends BlogPostSummary {
  body: string;
}

export interface PaginatedBlogPosts {
  items: BlogPostSummary[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

const REVALIDATE = 60; // kept for docs; fetches use cache: 'no-store' for Docker SSR

function serverApiBase(): string {
  const base =
    process.env.HEALAN_API_INTERNAL_URL ||
    'http://healan-webapi:8080/Healan/api/v1/';
  return base.endsWith('/') ? base : `${base}/`;
}

function portalPublicBase(): string {
  return `${serverApiBase()}PortalPublic/`;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    // Always fetch at request time in Docker; build-time has no healan-webapi.
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${url}`);
  }
  return (await res.json()) as T;
}

export async function fetchSite(): Promise<PublishedPortalSite> {
  try {
    return await getJson<PublishedPortalSite>(`${portalPublicBase()}Site`);
  } catch (err) {
    console.error('[healan-www] PortalPublic/Site failed', err);
    return { settings: {}, contentItems: [], reviews: [], seoPages: [] };
  }
}

export async function fetchBlogList(
  page = 1,
  pageSize = 10
): Promise<PaginatedBlogPosts> {
  const qs = new URLSearchParams({
    pageNumber: String(page),
    pageSize: String(pageSize),
  });
  try {
    return await getJson<PaginatedBlogPosts>(
      `${portalPublicBase()}BlogList?${qs}`
    );
  } catch (err) {
    console.error('[healan-www] PortalPublic/BlogList failed', err);
    return {
      items: [],
      pageNumber: page,
      totalPages: 0,
      totalCount: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    };
  }
}

export async function fetchBlogPost(slug: string): Promise<BlogPostDetail | null> {
  if (!slug) return null;
  const qs = new URLSearchParams({ slug });
  try {
    const data = await getJson<BlogPostDetail | null>(
      `${portalPublicBase()}BlogPost?${qs}`
    );
    return data ?? null;
  } catch (err) {
    console.error('[healan-www] PortalPublic/BlogPost failed', err);
    return null;
  }
}

export function portalSetting(
  site: PublishedPortalSite | null | undefined,
  key: string,
  fallback = ''
): string {
  return site?.settings?.[key] ?? fallback;
}

export function portalItemsBySection(
  site: PublishedPortalSite | null | undefined,
  sectionType: PortalSectionType
): PortalContentItem[] {
  return (site?.contentItems ?? [])
    .filter((item) => item.sectionType === sectionType)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function portalSectionEnabled(
  site: PublishedPortalSite | null | undefined,
  sectionKey: string,
  defaultEnabled = true
): boolean {
  const value = portalSetting(
    site,
    `section.enabled.${sectionKey}`,
    defaultEnabled ? 'true' : 'false'
  );
  return value !== 'false' && value !== '0';
}
