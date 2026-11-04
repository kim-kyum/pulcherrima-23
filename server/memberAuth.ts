import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { eq } from "drizzle-orm";
import { members, type Member } from "../drizzle/schema";
import { getDb } from "./db";
import { hashAdminPassword, verifyAdminPassword } from "./adminAccounts";
import { ensureMemberTables } from "./memberSchema";

export const MEMBER_COOKIE_NAME = "pulcherrima_member_session";
const MEMBER_SESSION_SECONDS = 60 * 60 * 24 * 14;
export const MEMBER_SESSION_MAX_AGE = MEMBER_SESSION_SECONDS * 1000;
export const MAX_MEMBER_ACCOUNTS = 500;

export type MemberSession = { sub: "pulcherrima-member"; memberId: number; username: string; displayName: string; iat: number; exp: number };
export type PublicMember = Pick<Member, "id" | "username" | "displayName" | "active" | "createdAt" | "lastSignedIn">;

function signingSecret() {
  return process.env.JWT_SECRET ?? "";
}

function sign(payload: string) {
  // A distinct prefix keeps member and admin signatures from being interchangeable.
  return createHmac("sha256", signingSecret()).update(`member:${payload}`).digest("base64url");
}

export function createMemberSessionToken(member: Pick<Member, "id" | "username" | "displayName">, now = Date.now()) {
  const iat = Math.floor(now / 1000);
  const session: MemberSession = { sub: "pulcherrima-member", memberId: member.id, username: member.username, displayName: member.displayName, iat, exp: iat + MEMBER_SESSION_SECONDS };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyMemberSessionToken(token: string | undefined, now = Date.now()): MemberSession | null {
  if (!token || !signingSecret()) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as MemberSession;
    if (session.sub !== "pulcherrima-member" || !session.memberId || session.exp <= Math.floor(now / 1000)) return null;
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

export function readMemberSession(request: Request) {
  return verifyMemberSessionToken(getCookie(request, MEMBER_COOKIE_NAME));
}

/** Verifies the signed cookie and that the account is still active. */
export async function getActiveMemberSession(request: Request) {
  const session = readMemberSession(request);
  if (!session) return null;
  const member = await getMemberById(session.memberId);
  if (!member || !member.active || member.username !== session.username) return null;
  return { ...session, displayName: member.displayName };
}

async function memberDb() {
  await ensureMemberTables();
  const db = await getDb();
  if (!db) throw new Error("데이터베이스에 연결할 수 없습니다.");
  return db;
}

export async function getMemberById(id: number) {
  const db = await memberDb();
  const rows = await db.select().from(members).where(eq(members.id, id)).limit(1);
  return rows[0];
}

export async function getMemberByUsername(username: string) {
  const db = await memberDb();
  const rows = await db.select().from(members).where(eq(members.username, username)).limit(1);
  return rows[0];
}

export async function validateMemberCredentials(username: string, password: string) {
  const member = await getMemberByUsername(username.trim());
  if (!member || !member.active || !verifyAdminPassword(password, member.passwordHash)) return null;
  const db = await memberDb();
  await db.update(members).set({ lastSignedIn: new Date() }).where(eq(members.id, member.id));
  return member;
}

export async function listMembers(): Promise<PublicMember[]> {
  const db = await memberDb();
  return db.select({ id: members.id, username: members.username, displayName: members.displayName, active: members.active, createdAt: members.createdAt, lastSignedIn: members.lastSignedIn }).from(members).orderBy(members.username);
}

export async function createMember(input: { username: string; displayName: string; password: string }) {
  const db = await memberDb();
  if (await getMemberByUsername(input.username)) throw new Error("이미 사용 중인 회원 아이디입니다.");
  const all = await listMembers();
  if (all.length >= MAX_MEMBER_ACCOUNTS) throw new Error(`회원 계정은 최대 ${MAX_MEMBER_ACCOUNTS}개까지 만들 수 있습니다.`);
  await db.insert(members).values({ username: input.username, displayName: input.displayName, passwordHash: hashAdminPassword(input.password), active: true });
  return getMemberByUsername(input.username);
}

export async function updateMember(input: { id: number; displayName?: string; password?: string; active?: boolean }) {
  const db = await memberDb();
  const member = await getMemberById(input.id);
  if (!member) throw new Error("회원 계정을 찾을 수 없습니다.");
  const updates: Partial<Pick<Member, "displayName" | "active" | "passwordHash">> = {};
  if (input.displayName !== undefined) updates.displayName = input.displayName;
  if (input.password !== undefined) updates.passwordHash = hashAdminPassword(input.password);
  if (input.active !== undefined) updates.active = input.active;
  if (Object.keys(updates).length > 0) await db.update(members).set(updates).where(eq(members.id, input.id));
  return { success: true } as const;
}

export function toPublicMember(member: Member): PublicMember {
  return { id: member.id, username: member.username, displayName: member.displayName, active: member.active, createdAt: member.createdAt, lastSignedIn: member.lastSignedIn };
}
