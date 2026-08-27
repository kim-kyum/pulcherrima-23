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
  home: JSON.stringify({
    eyebrow: "GBS 천체 관측 동아리 PULCHERRIMA",
    screens: [
      { no: "01", line: "학교의 가장 높은 곳,", kind: "intro", description: "망원경을 세우고 오늘의 대상을 고릅니다. 보이는 것을 기록하고, 다음 관측을 준비합니다." },
      { no: "02", line: "학교의 가장 어두운 곳에서,", kind: "video", videoId: "oxCAIxOCvL8", videoTitle: "2023 경기북과학고등학교 Pulcherrima 홍보영상" },
      { no: "03", line: "가장 밝게 빛나다", kind: "image", imageUrl: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=1500&q=88", imageAlt: "별이 가득한 밤하늘" },
    ],
    ctas: [
      { label: "홍보 영상 보기", href: "/videos", kind: "primary" },
      { label: "활동기록소", href: "/archive", kind: "text" },
      { label: "지원하기", href: "/recruiting", kind: "text" },
    ],
    footerNote: "공식 사이트 · 활동기록소 · 영상 · 모집 안내",
  }),
  videos: JSON.stringify({
    kicker: "풀체리마 유튜브",
    title: "영상으로 먼저 만나보세요.",
    intro: "동아리 소개, 학술발표회, 활동 돌아보기를 담은 풀체리마 채널의 영상 기록입니다. 목록에서 영상을 고르면 이 페이지에서 바로 재생할 수 있습니다.",
    periodLabel: "영상 기록 / 2020—",
    channelUrl: "https://www.youtube.com/channel/UCplIsa1QW2a_eQcvtJAymXw",
    items: [
      { year: "2024", title: "Pulcherrima 과학동아리발표회 부스 홍보영상", id: "sk-etZM7EqQ", duration: "2:01" },
      { year: "2024", title: "PULCHERRIMA 동아리 소개 영상", id: "hqkLYB7H0sE", duration: "1:10" },
      { year: "2023", title: "풀체리마 부스 뭐 해요?", id: "0qf_fXZ-Sb0", duration: "0:11" },
      { year: "2023", title: "아니 그래서 풀체리마 뭐 하는 동아리에요?", id: "uUaVF_6sLoI", duration: "1:05" },
      { year: "2023", title: "경기북과학고등학교 Pulcherrima 홍보영상", id: "oxCAIxOCvL8", duration: "1:20", featured: true },
      { year: "2022", title: "풀체리마 소개영상", id: "6jxOhJ7LToQ", duration: "0:46" },
      { year: "2020", title: "풀체리마 활동 돌아보기", id: "1r0Wan3ns6Q", duration: "6:40" },
      { year: "2020", title: "풀체리마 소개영상", id: "cNuInvHCMTE", duration: "1:40" },
      { year: "2020", title: "동아리 소개 및 2020 돌아보기 — 통합본", id: "bgZE82axgzY", duration: "8:19" },
    ],
  }),
  archive: JSON.stringify({
    intro: "관측이 끝난 뒤의 기록과 준비하는 동안의 질문을 남깁니다.",
    label: "이번 학기",
    period: "2026 하반기",
    entries: [],
  }),
  recruiting: JSON.stringify({
    generation: "23기",
    year: "2027",
    title: "다음 관측을 같이 준비합니다.",
    introCopy: "지원에 필요한 내용을 따로 정리합니다. 모집 일정과 방법은 이곳과 GBS 학교 공지에서 확인할 수 있습니다.",
    noticeTitle: "지금은 다음 공지를 기다리는 시간입니다.",
    noticeCopy: "지원 일정과 방법은 확정 후 GBS 학교 공지와 풀체리마 공식 채널을 통해 안내합니다.",
    statusLabel: "모집 안내",
    contactEmail: "recruit@pulcherrima.site",
    applyUrl: "",
    fitTitle: "별을 잘 몰라도 괜찮습니다.",
    fitItems: ["직접 보고 확인하는 것을 좋아하는 사람", "모르는 것을 질문하고 함께 배우는 사람", "작은 관측도 기록으로 남기고 싶은 사람"],
    steps: [
      { title: "공지 확인", copy: "풀체리마 공식 채널과 GBS 학교 공지에서 모집 일정을 확인합니다." },
      { title: "지원하기", copy: "지원 방법이 열리면 안내된 방식으로 지원합니다." },
      { title: "첫 관측", copy: "새로운 질문을 들고 첫 관측을 준비합니다." },
    ],
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
