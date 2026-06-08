const SESSION_COOKIE = "admin_session";

function adminPassword() {
  return (process.env.ADMIN_PASSWORD ?? "").trim();
}

export function getAdminSessionCookieName() {
  return SESSION_COOKIE;
}

export function isValidAdminPassword(password: string) {
  const expected = adminPassword();
  return expected.length > 0 && password.trim() === expected;
}

export function adminSessionToken() {
  return btoa(`admin:${adminPassword()}`);
}
