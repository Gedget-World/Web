import "server-only";

import crypto from "crypto";

export const OTP_EXPIRY_MS = 2 * 60 * 1000;
export const RESET_TOKEN_EXPIRY_MS = 10 * 60 * 1000;
export const MAX_OTP_ATTEMPTS = 5;

export type PasswordResetState =
  | { kind: "otp"; hash: string; attempts: number }
  | { kind: "reset"; hash: string };

export function hashResetValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function createOtp(): string {
  return crypto.randomInt(100_000, 1_000_000).toString();
}

export function createResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function serializeResetState(state: PasswordResetState): string {
  return JSON.stringify(state);
}

export function parseResetState(value: unknown): PasswordResetState | null {
  if (typeof value !== "string") return null;

  try {
    const parsed = JSON.parse(value) as Partial<PasswordResetState>;
    if (
      parsed.kind === "otp" &&
      typeof parsed.hash === "string" &&
      typeof parsed.attempts === "number"
    ) {
      return parsed as PasswordResetState;
    }
    if (parsed.kind === "reset" && typeof parsed.hash === "string") {
      return parsed as PasswordResetState;
    }
    return null;
  } catch {
    return null;
  }
}

export function matchesResetValue(hash: string, value: string): boolean {
  const expected = Buffer.from(hash, "hex");
  const actual = Buffer.from(hashResetValue(value), "hex");
  return (
    expected.length === actual.length &&
    crypto.timingSafeEqual(expected, actual)
  );
}
