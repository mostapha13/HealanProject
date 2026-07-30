"use client";

import { UserManager, WebStorageStateStore } from "oidc-client-ts";

const authority = process.env.NEXT_PUBLIC_IDENTITY_BASE_URL ?? "http://localhost:5005";
let instance: UserManager | undefined;

export function authManager() {
  if (typeof window === "undefined") throw new Error("OIDC is only available in the browser.");
  instance ??= new UserManager({
    authority,
    client_id: "NegareshAIWeb",
    redirect_uri: `${window.location.origin}/auth/callback`,
    post_logout_redirect_uri: window.location.origin,
    response_type: "code",
    scope: "openid profile offline_access Content_Producer",
    automaticSilentRenew: true,
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  });
  return instance;
}

export async function requireAuthenticatedUser() {
  const manager = authManager();
  const user = await manager.getUser();
  if (user && !user.expired) {
    window.localStorage.setItem("negareshai.access_token", user.access_token);
    return user;
  }
  window.sessionStorage.setItem("negareshai.return_url", window.location.href);
  await manager.signinRedirect();
  return null;
}

export async function finishSignin() {
  const user = await authManager().signinRedirectCallback();
  window.localStorage.setItem("negareshai.access_token", user.access_token);
  return window.sessionStorage.getItem("negareshai.return_url") || "/";
}

export async function signOut() {
  window.localStorage.removeItem("negareshai.access_token");
  await authManager().signoutRedirect();
}
