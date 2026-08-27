import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import type { User } from "../drizzle/schema";
import { ensureOwnerAccount, getAdminAccountByUsername, touchAdminAccount, verifyAdminPassword } from "./adminAccounts";

export const ADMIN_COOKIE_NAME = "pulcherrima_admin_session";
const ADMIN_SESSION_SECONDS = 60 * 60 * 8;
export type AdminRole = "owner" | "admin";
export type AdminSession = { sub: "pulcherrima-admin"; accountId: number; username: string; role: AdminRole; iat: number; exp: number };

function configuredValue(key: "PULCHERRIMA_ADMIN_USERNAME" | "PULCHERRIMA_ADMIN_PASSWORD") {
  return process.env[key] ?? "";
}

function equalSecret(input: string, expected: string) {
  if (!input || !expected) return false;
  const inputBytes = Buffer.from(input);
  const expectedBytes = Buffer.from(expected);
  return inputBytes.length === expectedBytes.length && timingSafeEqual(inputBytes, expectedBytes);
}

function signingSecret() {
  return process.env.JWT_SECRET ?? "";
}

function sign(payload: string) {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

export async function validateAdminCredentials(username: string, password: string): Promise<Pick<AdminSession, "accountId" | "username" | "role"> | null> {
  const ownerUsername = configuredValue("PULCHERRIMA_ADMIN_USERNAME");
  const ownerPassword = configuredValue("PULCHERRIMA_ADMIN_PASSWORD");
  if (equalSecret(username, ownerUsername) && equalSecret(password, ownerPassword)) {
    const owner = await ensureOwnerAccount(ownerUsername, ownerPassword);
    if (owner) {
      await touchAdminAccount(owner.id);
      return { accountId: owner.id, username: owner.username, role: "owner" };
    }
    return { accountId: 0, username: ownerUsername, role: "owner" };
  }
  const account = await getAdminAccountByUsername(username);
  if (!account || !account.active || !verifyAdminPassword(password, account.passwordHash)) return null;
  await touchAdminAccount(account.id);
  return { accountId: account.id, username: account.username, role: account.role };
}

export function createAdminSessionToken(account: Pick<AdminSession, "accountId" | "username" | "role">, now = Date.now()) {
  const session: AdminSession = { sub: "pulcherrima-admin", ...account, iat: Math.floor(now / 1000), exp: Math.floor(now / 1000) + ADMIN_SESSION_SECONDS };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSessionToken(token: string | undefined, now = Date.now()): AdminSession | null {
  if (!token || !signingSecret()) return null;
  const [payload, signature] = token.split(".");
  const expectedSignature = payload ? sign(payload) : "";
  if (!payload || !signature || signature.length !== expectedSignature.length) return null;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as AdminSession;
    if (session.sub !== "pulcherrima-admin" || session.exp <= Math.floor(now / 1000) || !session.username || !["owner", "admin"].includes(session.role)) return null;
    return session;
  } catch {
    return null;
  }
}

function getCookie(request: Request, name: string) {
  const cookies = request.headers.cookie?.split(";").map((cookie) => cookie.trim()) ?? [];
  const value = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  return value ? decodeURIComponent(value.slice(name.length + 1)) : undefined;
}

export function getAdminSession(request: Request) {
  return verifyAdminSessionToken(getCookie(request, ADMIN_COOKIE_NAME));
}

export function createAdminUser(session: AdminSession): User {
  const now = new Date();
  return { id: session.accountId, openId: `pulcherrima-admin-${session.accountId}`, name: session.username, email: null, loginMethod: "password", role: "admin", createdAt: now, updatedAt: now, lastSignedIn: now };
}

export const ADMIN_SESSION_MAX_AGE = ADMIN_SESSION_SECONDS * 1000;
