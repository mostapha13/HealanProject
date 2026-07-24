/**
 * Runtime config for Healan Clinic mobile.
 * Override with EXPO_PUBLIC_* env vars (EAS / .env).
 */
const trimSlash = (url: string) => url.replace(/\/+$/, '');

export const config = {
  /** OIDC authority (IdentityServer) */
  identityUrl: trimSlash(
    process.env.EXPO_PUBLIC_IDENTITY_URL ?? 'https://auth.drshahrooei.ir'
  ),
  clientId: process.env.EXPO_PUBLIC_CLIENT_ID ?? 'HealanClinicMobile',
  scopes: ['openid', 'profile', 'Content_Producer', 'offline_access'] as string[],
  /** App scheme registered in app.json + Identity redirect URIs */
  scheme: 'healanclinic',
  healanApiUrl: trimSlash(
    process.env.EXPO_PUBLIC_HEALAN_API_URL ?? 'https://clinic.drshahrooei.ir/Healan/api/v1'
  ),
  userManagerApiUrl: trimSlash(
    process.env.EXPO_PUBLIC_USER_MANAGER_API_URL ??
      'https://clinic.drshahrooei.ir/UserManager/api/v1'
  ),
  fileApiUrl: trimSlash(
    process.env.EXPO_PUBLIC_FILE_API_URL ?? 'https://clinic.drshahrooei.ir/File'
  ),
  /** تصویر پیش‌فرض بلاگ وقتی تصویر شاخص انتخاب نشده */
  defaultBlogCoverUrl:
    process.env.EXPO_PUBLIC_DEFAULT_BLOG_COVER_URL ??
    'https://www.drshahrooei.ir/assets/blog-cover-default.jpg',
  accessSystemId: 11,
  /** MVP paths shown in bottom tabs when user has access */
  mvpPaths: {
    dashboard: '/',
    queue: '/queue',
    appointments: '/appointments',
    patients: '/patients',
  } as const,
};
