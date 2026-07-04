import { createUserManager } from 'redux-oidc';
import { UserManagerSettings } from 'oidc-client';
import { IDENTITY_BASE_URL, IDENTITY_CLIENT_BASE_URL } from '../constants';

/** تنظیمات OIDC — کلاینت HealanClient روی IdentityServer */
const userManagerConfig: UserManagerSettings = {
  client_id: 'HealanClient',
  redirect_uri: `${IDENTITY_CLIENT_BASE_URL}/callback`,
  response_type: 'code',
  scope: 'openid profile Content_Producer',
  authority: IDENTITY_BASE_URL,
  silent_redirect_uri: `${IDENTITY_CLIENT_BASE_URL}/silentRenew.html`,
  post_logout_redirect_uri: `${IDENTITY_CLIENT_BASE_URL}/loggedout.html`,
  revokeAccessTokenOnSignout: true,
  automaticSilentRenew: true,
  filterProtocolClaims: true,
  loadUserInfo: true,
  monitorSession: true,
};

export const userManager = createUserManager(userManagerConfig);
