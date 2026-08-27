import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import type { User } from "../drizzle/schema";

export const ADMIN_COOKIE_NAME = "pulcherrima_admin_session";
const ADMIN_SESSION_SECONDS = 60 * 60 * 8;

type AdminSession = { sub: "pulcherrima-admin"; iat: number; exp: number };

function configuredValue(key: "PULCHERRIMA_ADMIN_USERNAME" | "PULCHERRIMA_ADMIN_PASSWORD") {
  return process.env[key] ?? "";
}

function equalSecret(input: string, expected: string) {
  if (!input || !expected) return false;
  const inputBytes = Buffer.from(input);
  const expectedBytes = Buffer.from(expected);
  return inputBytes.length === expectedBytes.length && timingSafeEqual(inputBytes, expectedBytes);
}

export function areAdminCredentialsValid(username: string, password: string) {
  return equalSecret(username, configuredValue("PULCHERRIMA_ADMIN_USERNAME")) && equalSecret(password, configuredValue("PULCHERRIMA_ADMIN_PASSWORD"));
}

function signingSecret() {
  return process.env.JWT_SECRET ?? "";
}

function sign(payload: string) {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

export function createAdminSessionToken(now = Date.now()) {
  const session: AdminSession = {
    sub: "pulcherrima-admin",
    iat: Math.floor(now / 1000),
    exp: Math.floor(now / 1000) + ADMIN_SESSION_SECONDS,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSessionToken(token: string | undefined, now = Date.now()) {
  if (!token || !signingSecret()) return false;
  const [payload, signature] = token.split(".");
  const expectedSignature = sign(payload);
  if (!payload || !signature || signature.length !== expectedSignature.length) return false;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return false;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as AdminSession;
    return session.sub === "pulcherrima-admin" && session.exp > Math.floor(now / 1000);
  } catch {
    return false;
  }
}

function getCookie(request: Request, name: string) {
  const cookies = request.headers.cookie?.split(";").map((cookie) => cookie.trim()) ?? [];
  const value = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  return value ? decodeURIComponent(value.slice(name.length + 1)) : undefined;
}

export function hasAdminSession(request: Request) {
  return verifyAdminSessionToken(getCookie(request, ADMIN_COOKIE_NAME));
}

export function createAdminUser(): User {
  const now = new Date();
  return {
    id: 0,
    openId: "pulcherrima-admin",
    name: "Pulcherrima 관리자",
    email: null,
    loginMethod: "password",
    role: "admin",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
}

export const ADMIN_SESSION_MAX_AGE = ADMIN_SESSION_SECONDS * 1000;
