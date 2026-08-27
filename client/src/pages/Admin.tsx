import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, LogOut, Save } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

const defaults = {
  archive: JSON.stringify({ intro: "관측이 끝난 뒤의 기록과 준비하는 동안의 질문을 남깁니다.", entries: [] }, null, 2),
  recruiting: JSON.stringify({ generation: "23기", year: "2027", title: "다음 관측을 같이 준비합니다.", noticeTitle: "지금은 다음 공지를 기다리는 시간입니다.", noticeCopy: "지원 일정과 방법은 확정 후 GBS 학교 공지와 풀체리마 공식 채널을 통해 안내합니다.", contactEmail: "recruit@pulcherrima.site", applyUrl: "" }, null, 2),
};

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const session = trpc.admin.me.useQuery();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [activeKey, setActiveKey] = useState<"archive" | "recruiting">("archive");
  const [drafts, setDrafts] = useState(defaults);
  const [error, setError] = useState("");
  const login = trpc.admin.login.useMutation({ onSuccess: () => { setLoggedIn(true); setPassword(""); setError(""); }, onError: (err) => setError(err.message) });
  const logout = trpc.admin.logout.useMutation({ onSuccess: () => setLoggedIn(false) });
  const contents = trpc.admin.content.list.useQuery(undefined, { enabled: loggedIn });
  const save = trpc.admin.content.update.useMutation({ onSuccess: () => contents.refetch(), onError: (err) => setError(err.message) });

  useEffect(() => {
    if (session.data?.authenticated) setLoggedIn(true);
  }, [session.data?.authenticated]);

  useEffect(() => {
    if (!contents.data) return;
    const next = { ...defaults };
    contents.data.forEach((item) => { if (item.contentKey === "archive" || item.contentKey === "recruiting") next[item.contentKey] = item.contentValue; });
    setDrafts(next);
  }, [contents.data]);

  const label = useMemo(() => activeKey === "archive" ? "활동기록소" : "모집 안내", [activeKey]);
  const saveDraft = () => {
    try {
      const parsed = JSON.parse(drafts[activeKey]) as Record<string, unknown>;
      if (activeKey === "archive" && (!Array.isArray(parsed.entries) || typeof parsed.intro !== "string")) throw new Error("활동기록소는 intro 문자열과 entries 배열이 필요합니다.");
      if (activeKey === "recruiting" && ["generation", "year", "title", "noticeTitle", "noticeCopy"].some((key) => typeof parsed[key] !== "string")) throw new Error("모집 안내의 generation, year, title, noticeTitle, noticeCopy를 확인하세요.");
      setError("");
      save.mutate({ contentKey: activeKey, contentValue: JSON.stringify(parsed, null, 2) });
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : "JSON 형식을 확인하세요.");
    }
  };
  if (!loggedIn) return <main className="admin-login-page"><div className="admin-login-card"><p className="section-kicker">PULCHERRIMA / PRIVATE LOG</p><h1>관측 기록을<br />관리합니다.</h1><p>관리자 계정으로 로그인하면 활동기록소와 모집 안내를 수정할 수 있습니다.</p><form onSubmit={(event) => { event.preventDefault(); login.mutate({ username, password }); }}><label>아이디<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></label><label>비밀번호<input value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" type="password" required /></label>{error && <div className="admin-error" role="alert">{error}</div>}<Button type="submit" disabled={login.isPending}>{login.isPending ? "확인 중" : "관리자 로그인"}</Button></form><Link href="/">공식 사이트로 돌아가기</Link></div></main>;

  return <main className="admin-page"><header className="admin-topbar"><div><p className="section-kicker">PULCHERRIMA / ADMIN</p><h1>사이트 콘텐츠</h1></div><div className="admin-top-actions"><Link href="/"><ArrowLeft size={16} /> 사이트 보기</Link><button type="button" onClick={() => logout.mutate()}><LogOut size={16} /> 로그아웃</button></div></header><section className="admin-editor"><aside><button className={activeKey === "archive" ? "is-active" : ""} onClick={() => setActiveKey("archive")} type="button">활동기록소</button><button className={activeKey === "recruiting" ? "is-active" : ""} onClick={() => setActiveKey("recruiting")} type="button">모집 안내</button></aside><div className="admin-editor-main"><div className="admin-editor-heading"><div><p className="section-kicker">편집 중</p><h2>{label}</h2></div><button className="admin-save-button" type="button" disabled={save.isPending} onClick={saveDraft}><Save size={16} /> {save.isPending ? "저장 중" : "저장"}</button></div><p className="admin-help">JSON 형식으로 저장합니다. 기본 사이트 구조와 색상은 관리자 편집 대상이 아닙니다.</p><textarea value={drafts[activeKey]} onChange={(event) => setDrafts((current) => ({ ...current, [activeKey]: event.target.value }))} spellCheck={false} aria-label={`${label} JSON 편집`} />{error && <div className="admin-error" role="alert">{error}</div>}</div></section></main>;
}
