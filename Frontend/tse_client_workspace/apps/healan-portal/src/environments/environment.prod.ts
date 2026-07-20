export const environment = {
  production: true,
  clinicAppUrl: 'https://clinic.drshahrooei.ir/',
  // Login form on Identity, then return to clinic (AuthGuard completes OIDC)
  authLoginUrl:
    'https://auth.drshahrooei.ir/Account/Login?ReturnUrl=https%3A%2F%2Fclinic.drshahrooei.ir%2F',
  healanApiUrl: '/Healan/api/v1/',
  fileApiUrl: '/File/',
  identityUrl: 'https://auth.drshahrooei.ir',
  phone: '09025103867',
  phoneDisplay: '۰۹۰۲۵۱۰۳۸۶۷',
};
