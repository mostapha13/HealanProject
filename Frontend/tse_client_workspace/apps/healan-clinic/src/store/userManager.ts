import { createUserManager } from 'redux-oidc';
import { UserManagerSettings } from 'oidc-client';
import { IDENTITY_BASE_URL, IDENTITY_CLIENT_BASE_URL } from '../constants';
import { environment } from '../environments/environment';

const identityAuthority = IDENTITY_BASE_URL;

/** در Development متادیتا از قبل ست می‌شود تا درخواست discovery اضافه نباشد */
const developmentMetadata = environment.production
  ? undefined
  : {
      issuer: identityAuthority,
      authorization_endpoint: `${identityAuthority}/connect/authorize`,
      token_endpoint: `${identityAuthority}/connect/token`,
      userinfo_endpoint: `${identityAuthority}/connect/userinfo`,
      end_session_endpoint: `${identityAuthority}/connect/endsession`,
      jwks_uri: `${identityAuthority}/.well-known/openid-configuration/jwks`,
      check_session_iframe: `${identityAuthority}/connect/checksession`,
    };

/** تنظیمات OIDC — کلاینت HealanClient روی IdentityServer */
const userManagerConfig: UserManagerSettings = {
  client_id: 'HealanClient',
  redirect_uri: `${IDENTITY_CLIENT_BASE_URL}/callback`,
  response_type: 'code',
  scope: 'openid profile Content_Producer',
  authority: identityAuthority,
  metadata: developmentMetadata,
  silent_redirect_uri: `${IDENTITY_CLIENT_BASE_URL}/silentRenew.html`,
  post_logout_redirect_uri: `${IDENTITY_CLIENT_BASE_URL}/loggedout.html`,
  revokeAccessTokenOnSignout: true,
  automaticSilentRenew: environment.production,
  filterProtocolClaims: true,
  loadUserInfo: true,
  monitorSession: environment.production,
};

export const userManager = createUserManager(userManagerConfig);
