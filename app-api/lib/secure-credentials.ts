export function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET must be set and at least 32 characters.",
    );
  }
  return secret;
}

export function getUserSessionSecret() {
  const secret = process.env.USER_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "USER_SESSION_SECRET must be set and at least 32 characters.",
    );
  }
  return secret;
}
