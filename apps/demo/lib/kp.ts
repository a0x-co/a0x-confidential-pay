import { createHmac, timingSafeEqual, randomUUID } from "crypto";

export const KP_COOKIE = "kp";
export const KP_TTL_S = 30 * 60;

export type KpPayload = {
  jti: string;
  wallet: `0x${string}`;
  iat: number;
};

export function getSecret(): string {
  const s = process.env.KP_SECRET;
  if (!s) throw new Error("KP_SECRET env var is required");
  return s;
}

export function signKp(payload: KpPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyKp(cookie: string | undefined): KpPayload | null {
  if (!cookie) return null;
  const [body, sig] = cookie.split(".");
  if (!body || !sig) return null;

  const expected = createHmac("sha256", getSecret())
    .update(body)
    .digest();
  let provided: Buffer;
  try {
    provided = Buffer.from(sig, "base64url");
  } catch {
    return null;
  }

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as KpPayload;
    const ageS = Math.floor(Date.now() / 1000) - payload.iat;
    if (!payload.jti || !payload.wallet || ageS > KP_TTL_S) return null;
    return payload;
  } catch {
    return null;
  }
}

export function newKpPayload(wallet: `0x${string}`): KpPayload {
  return { jti: randomUUID(), wallet, iat: Math.floor(Date.now() / 1000) };
}

export function kpCookieHeader(wallet: `0x${string}`): string {
  const payload = newKpPayload(wallet);
  const token = signKp(payload);
  return `${KP_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=${KP_TTL_S}`;
}

export function forgetKpCookie(): string {
  return `${KP_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=0`;
}