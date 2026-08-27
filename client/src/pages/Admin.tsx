import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, LogOut, Save } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

type ContentKey = "home" | "videos" | "archive" | "recruiting";
const defaultObjects: Record<ContentKey, unknown> = {
  home: { eyebrow: "GBS 천체 관측 동아리 PULCHERRIMA", screens: [{ no: "01", line: "학교의 가장 높은 곳,", kind: "intro", description: "망원경을 세우고 오늘의 대상을 고릅니다. 보이는 것을 기록하고, 다음 관측을 준비합니다." }, { no: "02", line: "학교의 가장 어두운 곳에서,", kind: "video", videoId: "oxCAIxOCvL8", videoTitle: "2023 경기북과학고등학교 Pulcherrima 홍보영상" }, { no: "03", line: "가장 밝게 빛나다", kind: "image", imageUrl: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=1500&q=88", imageAlt: "별이 가득한 밤하늘" }], ctas: [{ label: "홍보 영상 보기", href: "/videos", kind: "primary" }, { label: "활동기록소", href: "/archive", kind: "text" }, { label: "지원하기", href: "/recruiting", kind: "text" }], footerNote: "공식 사이트 · 활동기록소 · 영상 · 모집 안내" },
  videos: { kicker: "풀체리마 유튜브", title: "영상으로 먼저 만나보세요.", intro: "동아리 소개, 학술발표회, 활동 돌아보기를 담은 풀체리마 채널의 영상 기록입니다. 목록에서 영상을 고르면 이 페이지에서 바로 재생할 수 있습니다.", periodLabel: "영상 기록 / 2020—", channelUrl: "https://www.youtube.com/channel/UCplIsa1QW2a_eQcvtJAymXw", items: [{ year: "2024", title: "Pulcherrima 과학동아리발표회 부스 홍보영상", id: "sk-etZM7EqQ", duration: "2:01" }, { year: "2024", title: "PULCHERRIMA 동아리 소개 영상", id: "hqkLYB7H0sE", duration: "1:10" }, { year: "2023", title: "풀체리마 부스 뭐 해요?", id: "0qf_fXZ-Sb0", duration: "0:11" }, { year: "2023", title: "아니 그래서 풀체리마 뭐 하는 동아리에요?", id: "uUaVF_6sLoI", duration: "1:05" }, { year: "2023", title: "경기북과학고등학교 Pulcherrima 홍보영상", id: "oxCAIxOCvL8", duration: "1:20", featured: true }, { year: "2022", title: "풀체리마 소개영상", id: "6jxOhJ7LToQ", duration: "0:46" }, { year: "2020", title: "풀체리마 활동 돌아보기", id: "1r0Wan3ns6Q", duration: "6:40" }, { year: "2020", title: "풀체리마 소개영상", id: "cNuInvHCMTE", duration: "1:40" }, { year: "2020", title: "동아리 소개 및 2020 돌아보기 — 통합본", id: "bgZE82axgzY", duration: "8:19" }] },
  archive: { intro: "관측이 끝난 뒤의 기록과 준비하는 동안의 질문을 남깁니다.", label: "이번 학기", period: "2026 하반기", entries: [{ no: "01", date: "2026. 08", type: "관측 기록", title: "여름 은하수 지도", excerpt: "학교 옥상에서 보이는 별을 하나씩 이어 다음 관측을 위한 지도로 남긴 기록입니다.", image: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=1100&q=88", imageAlt: "여름 밤하늘과 은하수" }, { no: "02", date: "2026. 05", type: "현장 기록", title: "초점을 맞추는 동안", excerpt: "망원경을 처음 조립한 날입니다. 오래 걸려도 같은 대상을 함께 확인한 기록입니다.", image: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1100&q=88", imageAlt: "별이 있는 밤하늘" }, { no: "03", date: "2026. 03", type: "동아리 기록", title: "첫 관측을 위한 준비", excerpt: "관측 전 체크리스트와 장비를 정리하며 다음 질문을 고른 기록입니다.", image: "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=1100&q=88", imageAlt: "망원경으로 바라본 하늘" }] },
  recruiting: { generation: "23기", year: "2027", title: "다음 관측을 같이 준비합니다.", introCopy: "지원에 필요한 내용을 따로 정리합니다. 모집 일정과 방법은 이곳과 GBS 학교 공지에서 확인할 수 있습니다.", noticeTitle: "지금은 다음 공지를 기다리는 시간입니다.", noticeCopy: "지원 일정과 방법은 확정 후 GBS 학교 공지와 풀체리마 공식 채널을 통해 안내합니다.", statusLabel: "모집 안내", contactEmail: "recruit@pulcherrima.site", applyUrl: "", fitTitle: "별을 잘 몰라도 괜찮습니다.", fitItems: ["직접 보고 확인하는 것을 좋아하는 사람", "모르는 것을 질문하고 함께 배우는 사람", "작은 관측도 기록으로 남기고 싶은 사람"], steps: [{ title: "공지 확인", copy: "풀체리마 공식 채널과 GBS 학교 공지에서 모집 일정을 확인합니다." }, { title: "지원하기", copy: "지원 방법이 열리면 안내된 방식으로 지원합니다." }, { title: "첫 관측", copy: "새로운 질문을 들고 첫 관측을 준비합니다." }] },
};
const defaults = Object.fromEntries(Object.entries(defaultObjects).map(([key, value]) => [key, JSON.stringify(value, null, 2)])) as Record<ContentKey, string>;
const labels: Record<ContentKey, string> = { home: "홈 홍보", videos: "영상 목록", archive: "활동기록소", recruiting: "모집 안내" };

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const session = trpc.admin.me.useQuery();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [activeKey, setActiveKey] = useState<ContentKey>("home");
  const [drafts, setDrafts] = useState(defaults);
  const [error, setError] = useState("");
  const login = trpc.admin.login.useMutation({ onSuccess: () => { setLoggedIn(true); setPassword(""); setError(""); }, onError: (err) => setError(err.message) });
  const logout = trpc.admin.logout.useMutation({ onSuccess: () => setLoggedIn(false) });
  const contents = trpc.admin.content.list.useQuery(undefined, { enabled: loggedIn });
  const save = trpc.admin.content.update.useMutation({ onSuccess: () => contents.refetch(), onError: (err) => setError(err.message) });
  useEffect(() => { if (session.data?.authenticated) setLoggedIn(true); }, [session.data?.authenticated]);
  useEffect(() => { if (!contents.data) return; const next = { ...defaults }; contents.data.forEach((item) => { if (item.contentKey in next) next[item.contentKey as ContentKey] = item.contentValue; }); setDrafts(next); }, [contents.data]);
  const saveDraft = () => {
    try {
      const parsed = JSON.parse(drafts[activeKey]) as Record<string, unknown>;
      if (activeKey === "home" && (!Array.isArray(parsed.screens) || !Array.isArray(parsed.ctas))) throw new Error("홈 홍보에는 screens 배열과 ctas 배열이 필요합니다.");
      if (activeKey === "videos" && (!Array.isArray(parsed.items) || typeof parsed.title !== "string")) throw new Error("영상 목록에는 title 문자열과 items 배열이 필요합니다.");
      if (activeKey === "archive" && (!Array.isArray(parsed.entries) || typeof parsed.intro !== "string")) throw new Error("활동기록소에는 intro 문자열과 entries 배열이 필요합니다.");
      if (activeKey === "recruiting" && ["generation", "year", "title", "noticeTitle", "noticeCopy"].some((key) => typeof parsed[key] !== "string")) throw new Error("모집 안내의 기본 문자열 필드를 확인하세요.");
      setError(""); save.mutate({ contentKey: activeKey, contentValue: JSON.stringify(parsed, null, 2) });
    } catch (validationError) { setError(validationError instanceof Error ? validationError.message : "JSON 형식을 확인하세요."); }
  };
  if (!loggedIn) return <main className="admin-login-page"><div className="admin-login-card"><p className="section-kicker">PULCHERRIMA / PRIVATE LOG</p><h1>관측 기록을<br />관리합니다.</h1><p>관리자 계정으로 로그인하면 홈 홍보, 영상, 활동기록소와 모집 안내를 수정할 수 있습니다.</p><form onSubmit={(event) => { event.preventDefault(); login.mutate({ username, password }); }}><label>아이디<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></label><label>비밀번호<input value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" type="password" required /></label>{error && <div className="admin-error" role="alert">{error}</div>}<Button type="submit" disabled={login.isPending}>{login.isPending ? "확인 중" : "관리자 로그인"}</Button></form><Link href="/">공식 사이트로 돌아가기</Link></div></main>;
  return <main className="admin-page"><header className="admin-topbar"><div><p className="section-kicker">PULCHERRIMA / ADMIN</p><h1>사이트 콘텐츠</h1></div><div className="admin-top-actions"><Link href="/"><ArrowLeft size={16} /> 사이트 보기</Link><button type="button" onClick={() => logout.mutate()}><LogOut size={16} /> 로그아웃</button></div></header><section className="admin-editor"><aside aria-label="편집 대상">{(Object.keys(labels) as ContentKey[]).map((key) => <button key={key} className={activeKey === key ? "is-active" : ""} onClick={() => { setActiveKey(key); setError(""); }} type="button">{labels[key]}</button>)}</aside><div className="admin-editor-main"><div className="admin-editor-heading"><div><p className="section-kicker">편집 중</p><h2>{labels[activeKey]}</h2></div><button className="admin-save-button" type="button" disabled={save.isPending} onClick={saveDraft}><Save size={16} /> {save.isPending ? "저장 중" : "저장"}</button></div><p className="admin-help">JSON 형식으로 저장합니다. 화면에 표시되는 문구·링크·영상 ID·이미지 URL·기록 카드·지원 안내를 관리할 수 있습니다.</p><textarea value={drafts[activeKey]} onChange={(event) => setDrafts((current) => ({ ...current, [activeKey]: event.target.value }))} spellCheck={false} aria-label={`${labels[activeKey]} JSON 편집`} />{error && <div className="admin-error" role="alert">{error}</div>}</div></section></main>;
}
