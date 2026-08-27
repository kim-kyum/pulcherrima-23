export type EditableContentKey = "home" | "archive" | "videos" | "recruiting";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label}을(를) 입력하세요.`);
  return value.trim();
}

export function isSafeEditableUrl(value: unknown, options: { allowRelative?: boolean; allowMailto?: boolean } = {}) {
  if (typeof value !== "string" || !value.trim()) return false;
  const normalized = value.trim();
  if (options.allowRelative && normalized.startsWith("/")) return !normalized.startsWith("//");
  if (options.allowMailto && normalized.startsWith("mailto:")) return /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(normalized);
  try {
    const url = new URL(normalized);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function requiredUrl(value: unknown, label: string, options?: { allowRelative?: boolean; allowMailto?: boolean }) {
  if (!isSafeEditableUrl(value, options)) throw new Error(`${label}에는 http(s) 주소 또는 허용된 내부 주소를 입력하세요.`);
  return value as string;
}

function requiredYoutubeId(value: unknown, label: string) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{11}$/.test(value)) throw new Error(`${label}에는 11자리 YouTube 영상 ID를 입력하세요.`);
  return value;
}

function validateHome(content: JsonRecord) {
  const screens = content.screens;
  const ctas = content.ctas;
  if (!Array.isArray(screens) || screens.length === 0) throw new Error("홈 홍보에는 최소 한 개의 화면이 필요합니다.");
  if (!Array.isArray(ctas) || ctas.length === 0) throw new Error("홈 홍보에는 최소 한 개의 이동 버튼이 필요합니다.");
  screens.forEach((screen, index) => {
    if (!isRecord(screen)) throw new Error(`홈 화면 ${index + 1}의 형식을 확인하세요.`);
    requiredString(screen.line, `홈 화면 ${index + 1} 제목`);
    if (!["intro", "video", "image"].includes(String(screen.kind))) throw new Error(`홈 화면 ${index + 1}의 종류를 확인하세요.`);
    if (screen.kind === "video") requiredYoutubeId(screen.videoId, `홈 화면 ${index + 1} 영상`);
    if (screen.kind === "image") {
      requiredUrl(screen.imageUrl, `홈 화면 ${index + 1} 이미지`, { allowRelative: true });
      requiredString(screen.imageAlt, `홈 화면 ${index + 1} 이미지 대체 텍스트`);
    }
  });
  ctas.forEach((cta, index) => {
    if (!isRecord(cta)) throw new Error(`홈 이동 버튼 ${index + 1}의 형식을 확인하세요.`);
    requiredString(cta.label, `홈 이동 버튼 ${index + 1} 라벨`);
    requiredUrl(cta.href, `홈 이동 버튼 ${index + 1} 링크`, { allowRelative: true });
  });
}

function validateVideos(content: JsonRecord) {
  requiredString(content.title, "영상 목록 제목");
  requiredUrl(content.channelUrl, "YouTube 채널 링크");
  if (!Array.isArray(content.items) || content.items.length === 0) throw new Error("영상 목록에는 최소 한 개의 영상이 필요합니다.");
  content.items.forEach((item, index) => {
    if (!isRecord(item)) throw new Error(`영상 ${index + 1}의 형식을 확인하세요.`);
    requiredString(item.title, `영상 ${index + 1} 제목`);
    requiredYoutubeId(item.id, `영상 ${index + 1}`);
  });
}

function validateArchive(content: JsonRecord) {
  requiredString(content.intro, "활동기록소 소개 문구");
  requiredString(content.label, "활동기록소 학기 라벨");
  requiredString(content.period, "활동기록소 기간");
  if (!Array.isArray(content.entries)) throw new Error("활동기록소에는 기록 카드 배열이 필요합니다.");
  content.entries.forEach((entry, index) => {
    if (!isRecord(entry)) throw new Error(`기록 카드 ${index + 1}의 형식을 확인하세요.`);
    ["date", "type", "title", "excerpt"].forEach((field) => requiredString(entry[field], `기록 카드 ${index + 1} ${field}`));
    requiredUrl(entry.image, `기록 카드 ${index + 1} 이미지`, { allowRelative: true });
    requiredString(entry.imageAlt, `기록 카드 ${index + 1} 이미지 대체 텍스트`);
  });
}

function validateRecruiting(content: JsonRecord) {
  ["generation", "year", "title", "introCopy", "noticeTitle", "noticeCopy", "statusLabel", "contactEmail", "fitTitle"].forEach((field) => requiredString(content[field], `모집 안내 ${field}`));
  if (!/^\S+@\S+\.\S+$/.test(String(content.contactEmail))) throw new Error("문의 이메일 주소 형식을 확인하세요.");
  if (content.applyUrl !== "" && !isSafeEditableUrl(content.applyUrl, { allowMailto: true })) throw new Error("지원 링크에는 http(s) 주소 또는 mailto 주소를 입력하세요.");
  if (!Array.isArray(content.fitItems) || content.fitItems.some((item) => typeof item !== "string" || !item.trim())) throw new Error("지원 대상 항목을 확인하세요.");
  if (!Array.isArray(content.steps) || content.steps.some((step) => !isRecord(step) || !String(step.title ?? "").trim() || !String(step.copy ?? "").trim())) throw new Error("모집 진행 순서를 확인하세요.");
}

export function validateEditableContent(contentKey: EditableContentKey, contentValue: string): JsonRecord {
  let parsed: unknown;
  try {
    parsed = JSON.parse(contentValue);
  } catch {
    throw new Error("JSON 형식이 올바르지 않습니다.");
  }
  if (!isRecord(parsed)) throw new Error("콘텐츠 최상단은 객체 형식이어야 합니다.");
  if (contentKey === "home") validateHome(parsed);
  if (contentKey === "videos") validateVideos(parsed);
  if (contentKey === "archive") validateArchive(parsed);
  if (contentKey === "recruiting") validateRecruiting(parsed);
  return parsed;
}
