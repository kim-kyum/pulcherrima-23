import { bigint, boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const adminAccounts = mysqlTable("adminAccounts", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["owner", "admin"]).default("admin").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type AdminAccount = typeof adminAccounts.$inferSelect;
export type InsertAdminAccount = typeof adminAccounts.$inferInsert;

export const siteContents = mysqlTable("siteContents", {
  id: int("id").autoincrement().primaryKey(),
  contentKey: varchar("contentKey", { length: 120 }).notNull().unique(),
  contentValue: text("contentValue").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteContent = typeof siteContents.$inferSelect;
export type InsertSiteContent = typeof siteContents.$inferInsert;

/**
 * Club members who can log in at /gallery and upload photo data.
 * Accounts are issued by administrators in /admin (no open sign-up), so the
 * paid object storage cannot be filled by strangers.
 * The table is also created at runtime by server/memberSchema.ts.
 */
export const members = mysqlTable("members", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  displayName: varchar("displayName", { length: 64 }).notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type Member = typeof members.$inferSelect;

/**
 * Photo data uploaded straight from the browser to S3-compatible storage.
 * `status` is "uploading" while a multipart upload is open and "ready" once
 * the object exists. Uploading rows count toward the storage quota.
 */
export const photos = mysqlTable("photos", {
  id: int("id").autoincrement().primaryKey(),
  uploaderKind: mysqlEnum("uploaderKind", ["member", "admin"]).notNull(),
  uploaderId: int("uploaderId").notNull(),
  uploaderName: varchar("uploaderName", { length: 64 }).notNull(),
  objectKey: varchar("objectKey", { length: 512 }).notNull().unique(),
  uploadId: varchar("uploadId", { length: 1024 }),
  thumbKey: varchar("thumbKey", { length: 512 }),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  contentType: varchar("contentType", { length: 128 }).notNull(),
  sizeBytes: bigint("sizeBytes", { mode: "number" }).notNull(),
  title: varchar("title", { length: 200 }),
  description: text("description"),
  status: mysqlEnum("status", ["uploading", "ready"]).default("uploading").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => [index("photos_status_idx").on(table.status, table.id), index("photos_uploader_idx").on(table.uploaderKind, table.uploaderId)]);

export type Photo = typeof photos.$inferSelect;
