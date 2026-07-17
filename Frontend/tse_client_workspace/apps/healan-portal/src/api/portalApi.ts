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

export interface RagAskResult {
  answer: string;
  wasAnswered: boolean;
  similarityScore?: number;
  matchedKnowledgeItemId?: number;
  sourceType?: string;
  requiresLogin?: boolean;
  usedCount?: number;
  dailyLimit?: number;
  remainingCount?: number;
  isAuthenticated?: boolean;
}

export interface RagQuotaStatus {
  isAuthenticated: boolean;
  usedCount: number;
  dailyLimit: number;
  remainingCount: number;
  requiresLogin: boolean;
  phoneMasked?: string;
}

export interface PortalAuthResult {
  accessToken: string;
  phoneNumber: string;
  phoneMasked: string;
  userId: string;
  expiresAtUtc: string;
}

const PORTAL_TOKEN_KEY = 'portal_rag_access_token';

export function getPortalRagToken(): string | undefined {
  try {
    return localStorage.getItem(PORTAL_TOKEN_KEY) || undefined;
  } catch {
    return undefined;
  }
}

export function setPortalRagToken(token: string | null) {
  try {
    if (!token) localStorage.removeItem(PORTAL_TOKEN_KEY);
    else localStorage.setItem(PORTAL_TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
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

export async function fetchRagAnswer(
  question: string,
  sessionId?: string,
  guestKey?: string
): Promise<RagAskResult> {
  return request.post({
    baseUrl: BASE,
    url: 'RagAsk',
    options: { question, sessionId, guestKey },
    token: getPortalRagToken(),
  }) as Promise<RagAskResult>;
}

export async function fetchRagQuota(guestKey?: string): Promise<RagQuotaStatus> {
  return request.get({
    baseUrl: BASE,
    url: 'RagQuota',
    options: { guestKey },
    token: getPortalRagToken(),
  }) as Promise<RagQuotaStatus>;
}

export async function requestRagOtp(phoneNumber: string): Promise<{
  sent: boolean;
  phoneMasked?: string;
  expiresInSeconds?: number;
  reused?: boolean;
}> {
  return request.post({
    baseUrl: BASE,
    url: 'RagOtpRequest',
    options: { phoneNumber },
  }) as Promise<{
    sent: boolean;
    phoneMasked?: string;
    expiresInSeconds?: number;
    reused?: boolean;
  }>;
}

export async function verifyRagOtp(phoneNumber: string, code: string): Promise<PortalAuthResult> {
  const result = (await request.post({
    baseUrl: BASE,
    url: 'RagOtpVerify',
    options: { phoneNumber, code },
  })) as PortalAuthResult;
  if (result?.accessToken) setPortalRagToken(result.accessToken);
  return result;
}

export interface PortalBookingDoctor {
  doctorId: number;
  firstName: string;
  lastName: string;
}

export interface PortalOpenSlot {
  appointmentSlotId: number;
  doctorId: number;
  doctorName: string;
  startAt: string;
  endAt: string;
}

export interface PortalBookingService {
  serviceTypeId: number;
  title: string;
}

export interface PortalBookingItem {
  appointmentBookingId: number;
  appointmentSlotId: number;
  doctorId: number;
  doctorName?: string;
  startAt: string;
  endAt: string;
  status: number;
  firstName: string;
  lastName: string;
}

export function bookingDoctors() {
  return request.get({ baseUrl: BASE, url: 'BookingDoctors' }) as Promise<PortalBookingDoctor[]>;
}

export function bookingOpenSlots(params?: { doctorId?: number; fromDate?: string; toDate?: string }) {
  return request.get({
    baseUrl: BASE,
    url: 'BookingOpenSlots',
    options: params ?? {},
  }) as Promise<PortalOpenSlot[]>;
}

export function bookingServices() {
  return request.get({ baseUrl: BASE, url: 'BookingServices' }) as Promise<PortalBookingService[]>;
}

export function bookingLookupPatient(nationalCode: string) {
  return request.get({
    baseUrl: BASE,
    url: 'BookingLookupPatient',
    options: { nationalCode },
  }) as Promise<{
    found: boolean;
    patientId?: number;
    nationalCode: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }>;
}

export function bookingOtpRequest(phoneNumber: string) {
  return request.post({
    baseUrl: BASE,
    url: 'BookingOtpRequest',
    options: { phoneNumber },
  }) as Promise<{ sent: boolean; phoneMasked?: string; expiresInSeconds?: number; reused?: boolean }>;
}

export function bookingOtpVerify(payload: { phoneNumber: string; code: string; nationalCode: string }) {
  return request.post({
    baseUrl: BASE,
    url: 'BookingOtpVerify',
    options: payload,
  }) as Promise<{
    verified: boolean;
    bookingToken: string;
    expiresInSeconds: number;
    nationalCode: string;
    phoneNumber: string;
  }>;
}

export function bookingCreate(payload: Record<string, unknown>) {
  return request.post({
    baseUrl: BASE,
    url: 'BookingCreate',
    options: payload,
  }) as Promise<PortalBookingItem>;
}

export function bookingMyList(nationalCode: string, phoneNumber: string) {
  return request.get({
    baseUrl: BASE,
    url: 'BookingMyList',
    options: { nationalCode, phoneNumber },
  }) as Promise<PortalBookingItem[]>;
}

export function bookingCancel(payload: Record<string, unknown>) {
  return request.post({ baseUrl: BASE, url: 'BookingCancel', options: payload });
}

export function bookingReschedule(payload: Record<string, unknown>) {
  return request.post({
    baseUrl: BASE,
    url: 'BookingReschedule',
    options: payload,
  }) as Promise<PortalBookingItem>;
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
