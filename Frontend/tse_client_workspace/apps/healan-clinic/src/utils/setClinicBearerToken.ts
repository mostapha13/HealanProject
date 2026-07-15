import axios from 'axios';
import { removeItemFromSession, saveToSession } from '@tse/tools';

/** Shared session key — also read by @tse/tools axiosRequest interceptor. */
export const HEALAN_ACCESS_TOKEN_KEY = 'healan_access_token';

/** Attach Bearer for app axios + sessionStorage (tools axios reads session). */
export function setClinicBearerToken(accessToken: string | null | undefined) {
  if (accessToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    saveToSession(HEALAN_ACCESS_TOKEN_KEY, accessToken);
    return;
  }

  delete axios.defaults.headers.common['Authorization'];
  removeItemFromSession(HEALAN_ACCESS_TOKEN_KEY);
}
