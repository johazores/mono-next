import crypto from "crypto";

const iterations = 120000;
const keyLength = 64;
const digest = "sha512";

// Pre-computed hash used to prevent timing attacks when a user is not found.
// verifyPassword is always called so the response time is constant regardless
// of whether the account exists.
export const DUMMY_HASH = [
  "pbkdf2",
  String(iterations),
  "0".repeat(32),
  "0".repeat(128),
].join("$");

export function validatePasswordStrength(password: string): string | null {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one digit.";
  }
  return null;
}

export function hashPassword(password: string) {
  const error = validatePasswordStrength(password);
  if (error) throw new Error(error);

  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, iterations, keyLength, digest)
    .toString("hex");
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [scheme, iterationValue, salt, expectedHash] = storedHash.split("$");

  if (scheme !== "pbkdf2" || !iterationValue || !salt || !expectedHash) {
    return false;
  }

  const calculated = crypto
    .pbkdf2Sync(password, salt, Number(iterationValue), keyLength, digest)
    .toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(calculated, "hex"),
    Buffer.from(expectedHash, "hex"),
  );
}
