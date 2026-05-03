import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("hashPassword", () => {
  it("returns a pbkdf2-formatted string", () => {
    const hash = hashPassword("ValidPass1!");
    const parts = hash.split("$");
    expect(parts).toHaveLength(4);
    expect(parts[0]).toBe("pbkdf2");
    expect(Number(parts[1])).toBe(120000);
    expect(parts[2]).toHaveLength(32); // 16-byte salt as hex
    expect(parts[3]).toHaveLength(128); // 64-byte key as hex
  });

  it("throws on password shorter than 8 characters", () => {
    expect(() => hashPassword("short")).toThrow(
      "Password must be at least 8 characters.",
    );
  });

  it("throws on empty password", () => {
    expect(() => hashPassword("")).toThrow(
      "Password must be at least 8 characters.",
    );
  });

  it("produces different salts for the same password", () => {
    const hash1 = hashPassword("SamePassword1!");
    const hash2 = hashPassword("SamePassword1!");
    const salt1 = hash1.split("$")[2];
    const salt2 = hash2.split("$")[2];
    expect(salt1).not.toBe(salt2);
  });
});

describe("verifyPassword", () => {
  it("returns true for matching password", () => {
    const hash = hashPassword("CorrectPass1!");
    expect(verifyPassword("CorrectPass1!", hash)).toBe(true);
  });

  it("returns false for wrong password", () => {
    const hash = hashPassword("CorrectPass1!");
    expect(verifyPassword("WrongPassword1!", hash)).toBe(false);
  });

  it("returns false for malformed hash", () => {
    expect(verifyPassword("anything", "not-a-valid-hash")).toBe(false);
  });

  it("returns false for empty scheme", () => {
    expect(verifyPassword("anything", "$120000$salt$hash")).toBe(false);
  });
});
