import crypto from "crypto";

const iterations = 120000;
const keyLength = 64;
const digest = "sha512";

export function hashPassword(password: string) {
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

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
