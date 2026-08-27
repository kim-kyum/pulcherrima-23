import { eq, sql } from "drizzle-orm";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { adminAccounts, type AdminAccount } from "../drizzle/schema";
import { getDb } from "./db";

export const MAX_ACTIVE_ADMIN_ACCOUNTS = 18;

export function hashAdminPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const digest = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${digest}`;
}

export function verifyAdminPassword(password: string, encoded: string) {
  const [algorithm, salt, expected] = encoded.split("$");
  if (algorithm !== "scrypt" || !salt || !expected) return false;
  const actual = scryptSync(password, salt, 64).toString("hex");
  const actualBytes = Buffer.from(actual, "hex");
  const expectedBytes = Buffer.from(expected, "hex");
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

export async function getAdminAccountByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(adminAccounts).where(eq(adminAccounts.username, username)).limit(1);
  return result[0];
}

export async function getAdminAccountById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(adminAccounts).where(eq(adminAccounts.id, id)).limit(1);
  return result[0];
}

export async function listAdminAccounts() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ id: adminAccounts.id, username: adminAccounts.username, role: adminAccounts.role, active: adminAccounts.active, createdAt: adminAccounts.createdAt, updatedAt: adminAccounts.updatedAt, lastSignedIn: adminAccounts.lastSignedIn }).from(adminAccounts);
  return rows;
}

export async function countActiveAdminAccounts() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(adminAccounts).where(eq(adminAccounts.active, true));
  return Number(result[0]?.count ?? 0);
}

export async function countActiveOwners() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(adminAccounts).where(sql`${adminAccounts.active} = true and ${adminAccounts.role} = 'owner'`);
  return Number(result[0]?.count ?? 0);
}

export async function ensureOwnerAccount(username: string, password: string) {
  const existing = await getAdminAccountByUsername(username);
  if (existing) return existing;
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(adminAccounts).values({ username, passwordHash: hashAdminPassword(password), role: "owner", active: true });
  return getAdminAccountByUsername(username);
}

export async function createAdminAccount(input: { username: string; password: string; role: "admin" | "owner" }) {
  const db = await getDb();
  if (!db) throw new Error("관리자 계정 데이터베이스를 사용할 수 없습니다.");
  if (await countActiveAdminAccounts() >= MAX_ACTIVE_ADMIN_ACCOUNTS) throw new Error(`활성 관리자 계정은 최대 ${MAX_ACTIVE_ADMIN_ACCOUNTS}명까지 만들 수 있습니다.`);
  await db.insert(adminAccounts).values({ username: input.username, passwordHash: hashAdminPassword(input.password), role: input.role, active: true });
  return getAdminAccountByUsername(input.username);
}

export async function updateAdminAccount(input: { id: number; username?: string; password?: string; role?: "admin" | "owner"; active?: boolean }) {
  const account = await getAdminAccountById(input.id);
  if (!account) throw new Error("관리자 계정을 찾을 수 없습니다.");
  const db = await getDb();
  if (!db) throw new Error("관리자 계정 데이터베이스를 사용할 수 없습니다.");
  const removesOwnerRole = account.role === "owner" && (input.role === "admin" || input.active === false);
  if (removesOwnerRole && await countActiveOwners() <= 1) throw new Error("마지막 총괄관리자 계정은 권한을 낮추거나 비활성화할 수 없습니다.");
  const updates: Partial<Pick<AdminAccount, "username" | "role" | "active">> & { passwordHash?: string } = {};
  if (input.username !== undefined) updates.username = input.username;
  if (input.password !== undefined) updates.passwordHash = hashAdminPassword(input.password);
  if (input.role !== undefined) updates.role = input.role;
  if (input.active !== undefined) updates.active = input.active;
  if (Object.keys(updates).length === 0) return account;
  await db.update(adminAccounts).set(updates).where(eq(adminAccounts.id, input.id));
  return getAdminAccountById(input.id);
}

export async function touchAdminAccount(id: number) {
  const db = await getDb();
  if (!db || id <= 0) return;
  await db.update(adminAccounts).set({ lastSignedIn: new Date() }).where(eq(adminAccounts.id, id));
}
