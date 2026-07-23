import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { PortalAuthResult } from '../api/portal';

const KEY = 'healan_patient_session_v1';

export type PatientSession = {
  accessToken: string;
  phoneNumber: string;
  phoneMasked?: string;
  userId?: string;
  expiresAtUtc?: string;
  patientId?: number;
  firstName?: string;
  lastName?: string;
  nationalCode?: string;
};

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function storageSet(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function storageRemove(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export function sessionFromAuth(result: PortalAuthResult): PatientSession {
  return {
    accessToken: result.accessToken,
    phoneNumber: result.phoneNumber,
    phoneMasked: result.phoneMasked,
    userId: result.userId,
    expiresAtUtc: result.expiresAtUtc,
    patientId: result.patientId,
    firstName: result.firstName,
    lastName: result.lastName,
    nationalCode: result.nationalCode,
  };
}

export async function loadSession(): Promise<PatientSession | null> {
  const raw = await storageGet(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PatientSession;
  } catch {
    return null;
  }
}

export async function saveSession(session: PatientSession) {
  await storageSet(KEY, JSON.stringify(session));
}

export async function clearSession() {
  await storageRemove(KEY);
}

export function isSessionExpired(session: PatientSession): boolean {
  if (!session.expiresAtUtc) return false;
  const t = new Date(session.expiresAtUtc).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() > t - 60_000;
}
