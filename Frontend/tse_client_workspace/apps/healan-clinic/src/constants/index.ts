import { environment } from '../environments/environment';

export const HEALAN_API_URL = environment.healanApiUrl;
export const FILE_API_URL = environment.fileApiUrl;
export const USER_MANAGER_API = environment.userManagerApiUrl;
export const HEALAN_ACCESS_SYSTEM_ID = 11;
export const IDENTITY_BASE_URL = environment.production
  ? environment.identityUrl
  : environment.identityUrl || 'https://localhost:44320';
export const IDENTITY_CLIENT_BASE_URL = environment.production
  ? environment.clientUrl
  : environment.clientUrl || 'http://localhost:4201';
