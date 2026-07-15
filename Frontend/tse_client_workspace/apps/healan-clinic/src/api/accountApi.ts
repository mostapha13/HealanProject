import { request } from '@tse/tools';
import { USER_MANAGER_API } from '../constants';
import { userManager } from '../store/userManager';
import { setClinicBearerToken } from '../utils/setClinicBearerToken';

async function accessToken(): Promise<string | undefined> {
  try {
    const user = await userManager.getUser();
    if (user?.access_token && !user.expired) {
      setClinicBearerToken(user.access_token);
      return user.access_token;
    }
  } catch {
    // ignore
  }
  return undefined;
}

export async function changePassword(payload: {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<void> {
  const token = await accessToken();
  await request.post({
    baseUrl: USER_MANAGER_API,
    url: 'Account/ChangePassword',
    options: payload,
    token,
  });
}

export async function updateIdentityProfile(payload: {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}): Promise<void> {
  const token = await accessToken();
  await request.post({
    baseUrl: USER_MANAGER_API,
    url: 'Account/UpdateProfile',
    options: payload,
    token,
  });
}
