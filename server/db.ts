import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, siteContents, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

const DEFAULT_SITE_CONTENT: Record<string, string> = {
  archive: JSON.stringify({ intro: "관측이 끝난 뒤의 기록과 준비하는 동안의 질문을 남깁니다.", entries: [] }),
  recruiting: JSON.stringify({
    generation: "23기",
    year: "2027",
    title: "다음 관측을 같이 준비합니다.",
    noticeTitle: "지금은 다음 공지를 기다리는 시간입니다.",
    noticeCopy: "지원 일정과 방법은 확정 후 GBS 학교 공지와 풀체리마 공식 채널을 통해 안내합니다.",
    contactEmail: "recruit@pulcherrima.site",
    applyUrl: "",
  }),
};

export function getDefaultSiteContent(contentKey: string) {
  return {
    id: 0,
    contentKey,
    contentValue: DEFAULT_SITE_CONTENT[contentKey] ?? "{}",
    updatedAt: new Date(0),
  };
}

export async function listSiteContents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(siteContents);
}

export async function getSiteContent(contentKey: string) {
  const db = await getDb();
  if (!db) return getDefaultSiteContent(contentKey);
  const result = await db.select().from(siteContents).where(eq(siteContents.contentKey, contentKey)).limit(1);
  return result[0] ?? getDefaultSiteContent(contentKey);
}

export async function upsertSiteContent(contentKey: string, contentValue: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(siteContents).values({ contentKey, contentValue }).onDuplicateKeyUpdate({ set: { contentValue } });
  return getSiteContent(contentKey);
}
