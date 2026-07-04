import { createUserManager } from 'redux-oidc';
import { UserManagerSettings } from 'oidc-client';
import { IDENTITY_BASE_URL, IDENTITY_CLIENT_BASE_URL } from '../constants';

const userManagerConfig: UserManagerSettings = {
  client_id: 'TaxClient',
  // client_secret: 'T$e.!R*MarketMakerClient*E@M@M@A@M',
  redirect_uri: `${IDENTITY_CLIENT_BASE_URL}/callback`,
  // response_type: 'token id_token',
  response_type: 'code',
  scope: 'openid profile Content_Producer',
  authority: IDENTITY_BASE_URL,
  silent_redirect_uri: `${IDENTITY_CLIENT_BASE_URL}/silentRenew`,
  post_logout_redirect_uri: `${IDENTITY_CLIENT_BASE_URL}/loggedout.html`,
  revokeAccessTokenOnSignout: true,
  automaticSilentRenew: true,
  filterProtocolClaims: true,
  loadUserInfo: true,
  monitorSession: true,
};

export const userManager = createUserManager(userManagerConfig);
