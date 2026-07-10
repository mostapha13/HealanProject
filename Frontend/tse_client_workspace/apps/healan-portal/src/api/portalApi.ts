import { request } from '@tse/tools';
import { environment } from '../environments/environment';

const BASE = `${environment.healanApiUrl}PortalPublic/`;

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
  sectionType: PortalSectionType;
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
  createdAt?: string;
}

export interface PublishedPortalSite {
  settings: Record<string, string>;
  contentItems: PortalContentItem[];
  reviews: PatientReviewPublic[];
}

export interface SubmitReviewPayload {
  displayName: string;
  contactInfo: string;
  reviewText: string;
  rating: number;
}

export interface BlogPostSummary {
  blogPostId: number;
  title: string;
  slug: string;
  excerpt?: string;
  coverImageUrl?: string;
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

export async function fetchPublishedSite(): Promise<PublishedPortalSite> {
  return request.get({ baseUrl: BASE, url: 'Site' }) as Promise<PublishedPortalSite>;
}

export async function submitPatientReview(payload: SubmitReviewPayload): Promise<{ id: number }> {
  return request.post({ baseUrl: BASE, url: 'SubmitReview', options: payload }) as Promise<{ id: number }>;
}

export async function fetchBlogPosts(params?: {
  filterText?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<PaginatedBlogPosts> {
  return request.get({
    baseUrl: BASE,
    url: 'BlogList',
    options: params ?? {},
  }) as Promise<PaginatedBlogPosts>;
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPostDetail | null> {
  const result = await request.get({
    baseUrl: BASE,
    url: 'BlogPost',
    options: { slug },
  });
  return (result ?? null) as BlogPostDetail | null;
}

export function portalSetting(site: PublishedPortalSite | null, key: string, fallback = ''): string {
  return site?.settings?.[key] ?? fallback;
}

export function portalItemsBySection(
  site: PublishedPortalSite | null,
  sectionType: PortalSectionType
): PortalContentItem[] {
  return (site?.contentItems ?? [])
    .filter((item) => item.sectionType === sectionType)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function portalSectionEnabled(site: PublishedPortalSite | null, sectionKey: string, defaultEnabled = true): boolean {
  const value = portalSetting(site, `section.enabled.${sectionKey}`, defaultEnabled ? 'true' : 'false');
  return value !== 'false' && value !== '0';
}
