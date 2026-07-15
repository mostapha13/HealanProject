export const environment = {
  production: true,
  clinicAppUrl: 'http://clinic.drshahrooei.ir/',
  // Login form on Identity, then return to clinic (AuthGuard completes OIDC)
  authLoginUrl: 'http://auth.drshahrooei.ir/Account/Login?ReturnUrl=http%3A%2F%2Fclinic.drshahrooei.ir%2F',
  healanApiUrl: '/Healan/api/v1/',
  fileApiUrl: '/File/',
  identityUrl: 'http://auth.drshahrooei.ir',
  phone: '09025103867',
  phoneDisplay: '۰۹۰۲۵۱۰۳۸۶۷',
};
