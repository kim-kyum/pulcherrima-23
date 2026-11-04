import { sql } from "drizzle-orm";
import { getDb } from "./db";

/*
 * Creates the members/photos tables on first use, so the feature works on
 * Vercel without anyone running `pnpm db:push` from a laptop.
 * Keep these definitions in sync with drizzle/schema.ts.
 */
let ensured: Promise<void> | null = null;

async function createTables() {
  const db = await getDb();
  if (!db) throw new Error("데이터베이스에 연결할 수 없습니다.");
  await db.execute(sql`CREATE TABLE IF NOT EXISTS \`members\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`username\` varchar(64) NOT NULL,
    \`displayName\` varchar(64) NOT NULL,
    \`passwordHash\` varchar(255) NOT NULL,
    \`active\` boolean NOT NULL DEFAULT true,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    \`lastSignedIn\` timestamp NULL,
    CONSTRAINT \`members_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`members_username_unique\` UNIQUE(\`username\`)
  )`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS \`photos\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`uploaderKind\` enum('member','admin') NOT NULL,
    \`uploaderId\` int NOT NULL,
    \`uploaderName\` varchar(64) NOT NULL,
    \`objectKey\` varchar(512) NOT NULL,
    \`uploadId\` varchar(1024) NULL,
    \`thumbKey\` varchar(512) NULL,
    \`fileName\` varchar(255) NOT NULL,
    \`contentType\` varchar(128) NOT NULL,
    \`sizeBytes\` bigint NOT NULL,
    \`title\` varchar(200) NULL,
    \`description\` text NULL,
    \`status\` enum('uploading','ready') NOT NULL DEFAULT 'uploading',
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`completedAt\` timestamp NULL,
    CONSTRAINT \`photos_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`photos_objectKey_unique\` UNIQUE(\`objectKey\`),
    INDEX \`photos_status_idx\` (\`status\`, \`id\`),
    INDEX \`photos_uploader_idx\` (\`uploaderKind\`, \`uploaderId\`)
  )`);
}

export function ensureMemberTables() {
  if (!ensured) {
    ensured = createTables().catch((error) => {
      ensured = null;
      throw error;
    });
  }
  return ensured;
}
