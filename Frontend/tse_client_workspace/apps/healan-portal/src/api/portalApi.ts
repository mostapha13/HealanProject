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

export interface RagSpeechToTextResult {
  text: string;
  language?: string;
  durationSeconds?: number;
  model?: string;
}

/** Whisper STT via Healan → python-rag. User should review text before sending. */
export async function fetchRagSpeechToText(
  blob: Blob,
  fileName = 'voice.webm',
  signal?: AbortSignal
): Promise<RagSpeechToTextResult> {
  const formData = new FormData();
  formData.append('file', blob, fileName);
  const token = getPortalRagToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}RagSpeechToText`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers,
    signal,
  });

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    const body = raw as {
      title?: string;
      detail?: string;
      message?: string;
      errors?: string[];
      Errors?: string[];
    };
    const fromErrors = body.errors?.[0] || body.Errors?.[0];
    // Prefer Errors[] (Persian) over Title ("The Request Is Not Correct.")
    const title =
      (typeof fromErrors === 'string' && fromErrors.trim()) ||
      body.detail ||
      body.message ||
      body.title ||
      'تبدیل گفتار به متن ناموفق بود';
    throw { data: raw, status: res.status, message: title };
  }

  const rec = raw as {
    text?: unknown;
    Text?: unknown;
    language?: unknown;
    Language?: unknown;
    durationSeconds?: unknown;
    DurationSeconds?: unknown;
    model?: unknown;
    Model?: unknown;
  };
  const text = String(rec.text ?? rec.Text ?? '').trim();
  if (!text) {
    throw { message: 'گفتاری تشخیص داده نشد. لطفاً دوباره صحبت کنید.' };
  }
  return {
    text,
    language: String(rec.language ?? rec.Language ?? 'fa'),
    durationSeconds:
      typeof rec.durationSeconds === 'number'
        ? rec.durationSeconds
        : typeof rec.DurationSeconds === 'number'
          ? rec.DurationSeconds
          : undefined,
    model: (rec.model ?? rec.Model) as string | undefined,
  };
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

export function bookingLookupPatient(params: { phoneNumber?: string; nationalCode?: string }) {
  return request.get({
    baseUrl: BASE,
    url: 'BookingLookupPatient',
    options: params,
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

export interface BookingOtpVerifyResult {
  verified: boolean;
  bookingToken: string;
  accessToken: string;
  expiresInSeconds: number;
  expiresAtUtc?: string;
  phoneNumber: string;
  phoneMasked?: string;
  userId?: string;
  isPatient?: boolean;
  patientId?: number;
  firstName?: string;
  lastName?: string;
  nationalCode?: string;
  patient?: {
    found: boolean;
    patientId?: number;
    nationalCode?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  };
}

export function bookingOtpVerify(payload: { phoneNumber: string; code: string }) {
  return request
    .post({
      baseUrl: BASE,
      url: 'BookingOtpVerify',
      options: payload,
    })
    .then((result) => {
      const res = result as BookingOtpVerifyResult;
      if (res?.accessToken) setPortalRagToken(res.accessToken);
      return res;
    }) as Promise<BookingOtpVerifyResult>;
}

export interface PortalBookingAuthResult {
  isAuthenticated?: boolean;
  isPatient?: boolean;
  accessToken: string;
  phoneNumber: string;
  phoneMasked?: string;
  userId?: string;
  expiresAtUtc?: string;
  patientId?: number;
  firstName?: string;
  lastName?: string;
  nationalCode?: string;
}

export function bookingRegisterOtpRequest(payload: {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  nationalCode: string;
}) {
  return request.post({
    baseUrl: BASE,
    url: 'BookingRegisterOtpRequest',
    options: payload,
  }) as Promise<{ sent: boolean; phoneMasked?: string; expiresInSeconds?: number }>;
}

export function bookingRegisterOtpVerify(payload: { phoneNumber: string; code: string }) {
  return request.post({
    baseUrl: BASE,
    url: 'BookingRegisterOtpVerify',
    options: payload,
  }).then((result) => {
    const res = result as PortalBookingAuthResult;
    if (res?.accessToken) setPortalRagToken(res.accessToken);
    return res;
  }) as Promise<PortalBookingAuthResult>;
}

export function bookingCompleteProfile(payload: {
  firstName: string;
  lastName: string;
  nationalCode: string;
  phoneNumber?: string;
}) {
  return request.post({
    baseUrl: BASE,
    url: 'BookingCompleteProfile',
    options: payload,
    token: getPortalRagToken(),
  }).then((result) => {
    const res = result as PortalBookingAuthResult;
    if (res?.accessToken) setPortalRagToken(res.accessToken);
    return res;
  }) as Promise<PortalBookingAuthResult>;
}

export function bookingProfileStatus() {
  return request.get({
    baseUrl: BASE,
    url: 'BookingProfileStatus',
    token: getPortalRagToken(),
  }) as Promise<PortalBookingAuthResult>;
}

export function bookingCreate(payload: Record<string, unknown>) {
  return request.post({
    baseUrl: BASE,
    url: 'BookingCreate',
    options: payload,
    token: getPortalRagToken(),
  }) as Promise<PortalBookingItem>;
}

export function bookingMyList(phoneNumber?: string, nationalCode?: string) {
  return request.get({
    baseUrl: BASE,
    url: 'BookingMyList',
    options: { phoneNumber, nationalCode },
    token: getPortalRagToken(),
  }) as Promise<PortalBookingItem[]>;
}

export function bookingCancel(payload: Record<string, unknown>) {
  return request.post({
    baseUrl: BASE,
    url: 'BookingCancel',
    options: payload,
    token: getPortalRagToken(),
  });
}

export function bookingReschedule(payload: Record<string, unknown>) {
  return request.post({
    baseUrl: BASE,
    url: 'BookingReschedule',
    options: payload,
    token: getPortalRagToken(),
  }) as Promise<PortalBookingItem>;
}

export type PortalMyHistory = {
  bookings?: Array<{
    appointmentBookingId?: number;
    doctorName?: string;
    startAt?: string;
    status?: number;
    statusTitle?: string;
  }>;
  visits?: Array<{
    appointmentId: number;
    appointmentDate: string;
    appointmentStatus?: string;
    doctorName?: string;
    prescriptionId?: number;
    prescriptionIssueDate?: string;
    prescriptionNotes?: string;
    hasEchoReport?: boolean;
    echoConclusion?: string;
    echoRecommendation?: string;
    drugs?: Array<{ drugName?: string; dosage?: string; usageInstructions?: string }>;
    labs?: Array<{
      labTestType?: string;
      notes?: string;
      attachmentId?: string;
      attachmentLink?: string;
      attachmentFileName?: string;
    }>;
    imaging?: Array<{
      imageTypeName?: string;
      notes?: string;
      attachmentId?: string;
      attachmentLink?: string;
      attachmentFileName?: string;
    }>;
  }>;
};

export type PortalBloodPressureItem = {
  id: number;
  systolic: number;
  diastolic: number;
  pulse?: number | null;
  measuredAt: string;
  periodOfDay?: number | null;
  periodTitle?: string | null;
  measuredTime?: string | null;
  note?: string | null;
};

export type PortalMedicationItem = {
  id: number;
  medicationName: string;
  dose?: string | null;
  intervalHours?: number;
  firstDoseTime?: string;
  timesOfDay: string;
  isActive: boolean;
};

export function patientMyHistory() {
  return request.get({
    baseUrl: BASE,
    url: 'MyHistory',
    token: getPortalRagToken(),
  }) as Promise<PortalMyHistory>;
}

export function patientBloodPressureList() {
  return request.get({
    baseUrl: BASE,
    url: 'MyBloodPressure',
    token: getPortalRagToken(),
  }) as Promise<PortalBloodPressureItem[]>;
}

export function patientBloodPressureSave(payload: {
  id?: number;
  systolic: number;
  diastolic: number;
  pulse?: number | null;
  measuredAt?: string;
  periodOfDay?: number | null;
  measuredTime?: string | null;
  note?: string;
}) {
  return request.post({
    baseUrl: BASE,
    url: 'MyBloodPressureSave',
    options: payload,
    token: getPortalRagToken(),
  }) as Promise<PortalBloodPressureItem>;
}

export function patientBloodPressureDelete(id: number) {
  return request.post({
    baseUrl: BASE,
    url: 'MyBloodPressureDelete',
    options: { id },
    token: getPortalRagToken(),
  });
}

export function patientMedicationList() {
  return request.get({
    baseUrl: BASE,
    url: 'MyMedications',
    token: getPortalRagToken(),
  }) as Promise<PortalMedicationItem[]>;
}

export function patientMedicationSave(payload: {
  id?: number;
  medicationName: string;
  dose?: string;
  intervalHours: number;
  firstDoseTime: string;
  isActive?: boolean;
}) {
  return request.post({
    baseUrl: BASE,
    url: 'MyMedicationSave',
    options: payload,
    token: getPortalRagToken(),
  }) as Promise<PortalMedicationItem>;
}

export function patientMedicationDelete(id: number) {
  return request.post({
    baseUrl: BASE,
    url: 'MyMedicationDelete',
    options: { id },
    token: getPortalRagToken(),
  });
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
