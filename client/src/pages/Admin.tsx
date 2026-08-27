import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, ImagePlus, LogOut, Plus, Save, Shield, Trash2, UserCog } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { validateEditableContent } from "@shared/contentValidation";

type ContentKey = "home" | "videos" | "archive" | "recruiting";
type AdminPanel = ContentKey | "accounts";
type ArchiveEntry = { no: string; date: string; type: string; title: string; excerpt: string; image: string; imageAlt?: string };
type ArchiveDraft = { intro: string; label: string; period: string; entries: ArchiveEntry[] };
type AdminRole = "owner" | "admin";

const defaultObjects: Record<ContentKey, unknown> = {
  home: {
    eyebrow: "GBS 천체 관측 동아리 PULCHERRIMA",
    screens: [
      { no: "01", line: "학교의 가장 높은 곳,", kind: "intro", description: "망원경을 세우고 오늘의 대상을 고릅니다. 보이는 것을 기록하고, 다음 관측을 준비합니다." },
      { no: "02", line: "학교의 가장 어두운 곳에서,", kind: "video", videoId: "oxCAIxOCvL8", videoTitle: "2023 경기북과학고등학교 Pulcherrima 홍보영상" },
      { no: "03", line: "가장 밝게 빛나다", kind: "image", imageUrl: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=1500&q=88", imageAlt: "별이 가득한 밤하늘" },
    ],
    ctas: [{ label: "홍보 영상 보기", href: "/videos", kind: "primary" }, { label: "활동기록소", href: "/archive", kind: "text" }, { label: "지원하기", href: "/recruiting", kind: "text" }],
    footerNote: "공식 사이트 · 활동기록소 · 영상 · 모집 안내",
  },
  videos: {
    kicker: "풀체리마 유튜브",
    title: "영상으로 먼저 만나보세요.",
    intro: "동아리 소개, 학술발표회, 활동 돌아보기를 담은 풀체리마 채널의 영상 기록입니다. 목록에서 영상을 고르면 이 페이지에서 바로 재생할 수 있습니다.",
    periodLabel: "영상 기록 / 2020—",
    channelUrl: "https://www.youtube.com/channel/UCplIsa1QW2a_eQcvtJAymXw",
    items: [{ year: "2024", title: "Pulcherrima 과학동아리발표회 부스 홍보영상", id: "sk-etZM7EqQ", duration: "2:01" }, { year: "2024", title: "PULCHERRIMA 동아리 소개 영상", id: "hqkLYB7H0sE", duration: "1:10" }, { year: "2023", title: "경기북과학고등학교 Pulcherrima 홍보영상", id: "oxCAIxOCvL8", duration: "1:20", featured: true }],
  },
  archive: {
    intro: "관측이 끝난 뒤의 기록과 준비하는 동안의 질문을 남깁니다.", label: "이번 학기", period: "2026 하반기",
    entries: [{ no: "01", date: "2026. 08", type: "관측 기록", title: "여름 은하수 지도", excerpt: "학교 옥상에서 보이는 별을 하나씩 이어 다음 관측을 위한 지도로 남긴 기록입니다.", image: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=1100&q=88", imageAlt: "여름 밤하늘과 은하수" }, { no: "02", date: "2026. 05", type: "현장 기록", title: "초점을 맞추는 동안", excerpt: "망원경을 처음 조립한 날입니다. 오래 걸려도 같은 대상을 함께 확인한 기록입니다.", image: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1100&q=88", imageAlt: "별이 있는 밤하늘" }],
  },
  recruiting: {
    generation: "23기", year: "2027", title: "다음 관측을 같이 준비합니다.", introCopy: "지원에 필요한 내용을 따로 정리합니다. 모집 일정과 방법은 이곳과 GBS 학교 공지에서 확인할 수 있습니다.", noticeTitle: "지금은 다음 공지를 기다리는 시간입니다.", noticeCopy: "지원 일정과 방법은 확정 후 GBS 학교 공지와 풀체리마 공식 채널을 통해 안내합니다.", statusLabel: "모집 안내", contactEmail: "recruit@pulcherrima.site", applyUrl: "", fitTitle: "별을 잘 몰라도 괜찮습니다.", fitItems: ["직접 보고 확인하는 것을 좋아하는 사람", "모르는 것을 질문하고 함께 배우는 사람", "작은 관측도 기록으로 남기고 싶은 사람"], steps: [{ title: "공지 확인", copy: "풀체리마 공식 채널과 GBS 학교 공지에서 모집 일정을 확인합니다." }, { title: "지원하기", copy: "지원 방법이 열리면 안내된 방식으로 지원합니다." }, { title: "첫 관측", copy: "새로운 질문을 들고 첫 관측을 준비합니다." }],
  },
};
const defaults = Object.fromEntries(Object.entries(defaultObjects).map(([key, value]) => [key, JSON.stringify(value, null, 2)])) as Record<ContentKey, string>;
const labels: Record<ContentKey, string> = { home: "홈 홍보", videos: "영상 목록", archive: "활동기록소", recruiting: "모집 안내" };
const emptyEntry = (index: number): ArchiveEntry => ({ no: String(index + 1).padStart(2, "0"), date: "2027. 00", type: "활동 기록", title: "새 기록", excerpt: "기록 내용을 입력합니다.", image: "", imageAlt: "" });

function parseArchive(raw: string): ArchiveDraft {
  try {
    const parsed = JSON.parse(raw) as Partial<ArchiveDraft>;
    return { intro: parsed.intro ?? "", label: parsed.label ?? "이번 학기", period: parsed.period ?? "", entries: Array.isArray(parsed.entries) ? parsed.entries as ArchiveEntry[] : [] };
  } catch { return JSON.parse(defaults.archive) as ArchiveDraft; }
}

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [activePanel, setActivePanel] = useState<AdminPanel>("archive");
  const [drafts, setDrafts] = useState(defaults);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [accountForm, setAccountForm] = useState({ username: "", password: "", role: "admin" as AdminRole });
  const session = trpc.admin.me.useQuery();
  const login = trpc.admin.login.useMutation({ onSuccess: (result) => { setLoggedIn(true); setRole(result.role); setPassword(""); setError(""); session.refetch(); }, onError: (err) => setError(err.message) });
  const logout = trpc.admin.logout.useMutation({ onSuccess: () => { setLoggedIn(false); setRole(null); } });
  const contents = trpc.admin.content.list.useQuery(undefined, { enabled: loggedIn });
  const save = trpc.admin.content.update.useMutation({ onSuccess: () => { contents.refetch(); setError(""); setNotice("변경 사항을 저장했고 공개 페이지에 반영했습니다."); }, onError: (err) => { setNotice(""); setError(err.message); } });
  const accounts = trpc.admin.accounts.list.useQuery(undefined, { enabled: loggedIn && role === "owner" });
  const createAccount = trpc.admin.accounts.create.useMutation({ onSuccess: () => { setAccountForm({ username: "", password: "", role: "admin" }); accounts.refetch(); setError(""); setNotice("관리자 계정을 추가했습니다."); }, onError: (err) => { setNotice(""); setError(err.message); } });
  const updateAccount = trpc.admin.accounts.update.useMutation({ onSuccess: () => { accounts.refetch(); setError(""); setNotice("관리자 계정 정보를 저장했습니다."); }, onError: (err) => { setNotice(""); setError(err.message); } });
  const uploadArchiveImage = trpc.admin.media.uploadArchiveImage.useMutation({ onError: (err) => { setNotice(""); setError(err.message); } });

  useEffect(() => { if (session.data?.authenticated) { setLoggedIn(true); setRole(session.data.role as AdminRole); } }, [session.data]);
  useEffect(() => { if (!contents.data) return; const next = { ...defaults }; contents.data.forEach((item) => { if (item.contentKey in next) next[item.contentKey as ContentKey] = item.contentValue; }); setDrafts(next); }, [contents.data]);
  const activeKey = activePanel === "accounts" ? "archive" : activePanel;
  const archive = useMemo(() => parseArchive(drafts.archive), [drafts.archive]);

  const saveDraft = (key: ContentKey = activeKey) => {
    try {
      const parsed = validateEditableContent(key, drafts[key]);
      setError("");
      setNotice("");
      save.mutate({ contentKey: key, contentValue: JSON.stringify(parsed, null, 2) });
    } catch (validationError) { setNotice(""); setError(validationError instanceof Error ? validationError.message : "입력 형식을 확인하세요."); }
  };
  const setArchive = (next: ArchiveDraft) => setDrafts((current) => ({ ...current, archive: JSON.stringify(next, null, 2) }));
  const updateEntry = (index: number, field: keyof ArchiveEntry, value: string) => setArchive({ ...archive, entries: archive.entries.map((entry, entryIndex) => entryIndex === index ? { ...entry, [field]: value } : entry) });
  const moveEntry = (index: number, direction: -1 | 1) => { const target = index + direction; if (target < 0 || target >= archive.entries.length) return; const entries = [...archive.entries]; [entries[index], entries[target]] = [entries[target], entries[index]]; setArchive({ ...archive, entries: entries.map((entry, entryIndex) => ({ ...entry, no: String(entryIndex + 1).padStart(2, "0") })) }); };
  const handleArchiveImageUpload = (index: number, file: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) { setNotice(""); setError("JPG, PNG, GIF 또는 WebP 파일만 업로드할 수 있습니다."); return; }
    if (file.size > 8 * 1024 * 1024) { setNotice(""); setError("이미지 파일은 8MB 이하만 업로드할 수 있습니다."); return; }
    const reader = new FileReader();
    reader.onerror = () => { setNotice(""); setError("사진 파일을 읽지 못했습니다."); };
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const base64 = result.split(",")[1];
      if (!base64) { setNotice(""); setError("사진 파일 형식을 확인하세요."); return; }
      setError("");
      setNotice("");
      uploadArchiveImage.mutate({ fileName: file.name, contentType: file.type, base64 }, { onSuccess: (uploaded) => { updateEntry(index, "image", uploaded.url); setNotice("사진을 업로드했습니다. 기록 저장을 누르면 공개 페이지에 반영됩니다."); } });
    };
    reader.readAsDataURL(file);
  };

  if (!loggedIn) return <main className="admin-login-page"><div className="admin-login-card"><p className="section-kicker">PULCHERRIMA / PRIVATE LOG</p><h1>관측 기록을<br />관리합니다.</h1><p>관리자 계정으로 로그인하면 홈 홍보, 영상, 활동기록소와 모집 안내를 수정할 수 있습니다.</p><form onSubmit={(event) => { event.preventDefault(); login.mutate({ username, password }); }}><label>아이디<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></label><label>비밀번호<input value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" type="password" required /></label>{error && <div className="admin-error" role="alert">{error}</div>}<Button type="submit" disabled={login.isPending}>{login.isPending ? "확인 중" : "관리자 로그인"}</Button></form><Link href="/">공식 사이트로 돌아가기</Link></div></main>;

  const accountPanel = role === "owner" && activePanel === "accounts";
  return <main className="admin-page"><header className="admin-topbar"><div><p className="section-kicker">PULCHERRIMA / {role === "owner" ? "OWNER" : "ADMIN"}</p><h1>사이트 콘텐츠</h1></div><div className="admin-top-actions"><Link href="/"><ArrowLeft size={16} /> 사이트 보기</Link><button type="button" onClick={() => logout.mutate()}><LogOut size={16} /> 로그아웃</button></div></header><section className="admin-editor"><aside aria-label="편집 대상">{(Object.keys(labels) as ContentKey[]).map((key) => <button key={key} className={activePanel === key ? "is-active" : ""} onClick={() => { setActivePanel(key); setError(""); setNotice(""); }} type="button">{labels[key]}</button>)}{role === "owner" && <button className={accountPanel ? "is-active" : ""} onClick={() => { setActivePanel("accounts"); setError(""); setNotice(""); }} type="button"><UserCog size={15} /> 관리자 계정</button>}</aside>{accountPanel ? <section className="admin-editor-main account-manager"><div className="admin-editor-heading"><div><p className="section-kicker">총괄관리자 전용</p><h2>관리자 계정</h2></div><span className="account-count">{accounts.data?.filter((account) => account.active).length ?? 0} / 18</span></div><p className="admin-help">총괄관리자만 계정을 추가하고 역할·비밀번호·활성 상태를 관리할 수 있다. 마지막 총괄관리자 계정은 비활성화하거나 일반 관리자로 변경할 수 없다.</p><form className="new-account-form" onSubmit={(event) => { event.preventDefault(); createAccount.mutate(accountForm); }}><input placeholder="새 아이디" value={accountForm.username} onChange={(event) => setAccountForm({ ...accountForm, username: event.target.value })} required /><input placeholder="임시 비밀번호 (10자 이상)" type="password" value={accountForm.password} onChange={(event) => setAccountForm({ ...accountForm, password: event.target.value })} minLength={10} required /><select value={accountForm.role} onChange={(event) => setAccountForm({ ...accountForm, role: event.target.value as AdminRole })}><option value="admin">일반 관리자</option><option value="owner">총괄관리자</option></select><button type="submit" disabled={createAccount.isPending}><Plus size={16} /> 계정 추가</button></form><div className="account-list">{accounts.data?.map((account) => <AccountRow key={account.id} account={account} onSave={(input) => updateAccount.mutate(input)} saving={updateAccount.isPending} />)}{accounts.isLoading && <p className="admin-help">계정 목록을 불러오는 중이다.</p>}</div>{notice && <div className="admin-success" role="status"><CheckCircle2 size={16} /> {notice}</div>}{error && <div className="admin-error" role="alert">{error}</div>}</section> : <section className="admin-editor-main">{activePanel === "archive" ? <ArchiveEditor archive={archive} setArchive={setArchive} updateEntry={updateEntry} moveEntry={moveEntry} onSave={() => saveDraft("archive")} saving={save.isPending} uploading={uploadArchiveImage.isPending} onUpload={handleArchiveImageUpload} /> : <><div className="admin-editor-heading"><div><p className="section-kicker">편집 중</p><h2>{labels[activeKey]}</h2></div><button className="admin-save-button" type="button" disabled={save.isPending} onClick={() => saveDraft()}><Save size={16} /> {save.isPending ? "저장 중" : "저장"}</button></div><p className="admin-help">홈 화면·영상 목록·모집 안내는 JSON 형식으로 관리한다. 저장 전 링크·이미지 URL·YouTube ID·필수 텍스트를 검사한다.</p><textarea value={drafts[activeKey]} onChange={(event) => setDrafts((current) => ({ ...current, [activeKey]: event.target.value }))} spellCheck={false} aria-label={`${labels[activeKey]} JSON 편집`} /></>}{notice && <div className="admin-success" role="status"><CheckCircle2 size={16} /> {notice}</div>}{error && <div className="admin-error" role="alert">{error}</div>}</section>}</section></main>;
}

function ArchiveEditor({ archive, setArchive, updateEntry, moveEntry, onSave, saving, uploading, onUpload }: { archive: ArchiveDraft; setArchive: (next: ArchiveDraft) => void; updateEntry: (index: number, field: keyof ArchiveEntry, value: string) => void; moveEntry: (index: number, direction: -1 | 1) => void; onSave: () => void; saving: boolean; uploading: boolean; onUpload: (index: number, file: File) => void }) {
  return <><div className="admin-editor-heading"><div><p className="section-kicker">카드 단위 편집</p><h2>활동기록소</h2></div><button className="admin-save-button" type="button" disabled={saving || uploading} onClick={onSave}><Save size={16} /> {saving ? "저장 중" : "기록 저장"}</button></div><p className="admin-help">기록 카드를 직접 추가·수정·삭제하고 순서를 바꿀 수 있다. JPG·PNG·GIF·WebP 사진은 8MB 이하로 업로드할 수 있으며, 업로드 뒤 기록 저장을 눌러야 공개 활동기록소에 반영된다.</p><div className="archive-settings"><label>소개 문구<textarea value={archive.intro} onChange={(event) => setArchive({ ...archive, intro: event.target.value })} /></label><label>학기 라벨<input value={archive.label} onChange={(event) => setArchive({ ...archive, label: event.target.value })} /></label><label>기간<input value={archive.period} onChange={(event) => setArchive({ ...archive, period: event.target.value })} /></label></div><div className="archive-editor-list">{archive.entries.map((entry, index) => <article className="archive-editor-card" key={`${entry.no}-${index}`}><header><span>{String(index + 1).padStart(2, "0")}</span><div><button type="button" onClick={() => moveEntry(index, -1)} aria-label="기록 위로 이동"><ArrowUp size={15} /></button><button type="button" onClick={() => moveEntry(index, 1)} aria-label="기록 아래로 이동"><ArrowDown size={15} /></button><button type="button" onClick={() => setArchive({ ...archive, entries: archive.entries.filter((_, entryIndex) => entryIndex !== index).map((item, itemIndex) => ({ ...item, no: String(itemIndex + 1).padStart(2, "0") })) })} aria-label="기록 삭제"><Trash2 size={15} /></button></div></header><div className="archive-editor-fields"><label>날짜<input value={entry.date} onChange={(event) => updateEntry(index, "date", event.target.value)} /></label><label>종류<input value={entry.type} onChange={(event) => updateEntry(index, "type", event.target.value)} /></label><label className="span-two">제목<input value={entry.title} onChange={(event) => updateEntry(index, "title", event.target.value)} /></label><label className="span-two">설명<textarea value={entry.excerpt} onChange={(event) => updateEntry(index, "excerpt", event.target.value)} /></label><label className="span-two image-upload-field">사진 업로드<input type="file" accept="image/jpeg,image/png,image/gif,image/webp" disabled={uploading} onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) onUpload(index, file); event.currentTarget.value = ""; }} /><span><ImagePlus size={15} /> {uploading ? "업로드 중" : "JPG·PNG·GIF·WebP · 최대 8MB"}</span></label><label className="span-two">이미지 URL<input value={entry.image} onChange={(event) => updateEntry(index, "image", event.target.value)} placeholder="사진 업로드 후 자동 입력" /></label>{entry.image && <div className="archive-image-preview span-two"><img src={entry.image} alt={entry.imageAlt || "업로드한 기록 사진 미리보기"} /><span>현재 사진 미리보기</span></div>}<label className="span-two">이미지 대체 텍스트<input value={entry.imageAlt ?? ""} onChange={(event) => updateEntry(index, "imageAlt", event.target.value)} placeholder="사진에 무엇이 담겼는지 적기" /></label></div></article>)}</div><button className="add-record-button" type="button" onClick={() => setArchive({ ...archive, entries: [...archive.entries, emptyEntry(archive.entries.length)] })}><Plus size={16} /> 기록 카드 추가</button></>;
}

function AccountRow({ account, onSave, saving }: { account: { id: number; username: string; role: AdminRole; active: boolean }; onSave: (input: { id: number; username?: string; password?: string; role?: AdminRole; active?: boolean }) => void; saving: boolean }) {
  const [username, setUsername] = useState(account.username);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>(account.role);
  const [active, setActive] = useState(account.active);
  return <article className="account-row"><div><input aria-label="관리자 아이디" value={username} onChange={(event) => setUsername(event.target.value)} /><span className={role === "owner" ? "role-owner" : "role-admin"}>{role === "owner" ? <><Shield size={13} /> 총괄관리자</> : "일반 관리자"}</span></div><div><input aria-label="새 비밀번호" placeholder="비밀번호 변경 (선택)" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={10} /><select aria-label="관리자 역할" value={role} onChange={(event) => setRole(event.target.value as AdminRole)}><option value="admin">일반 관리자</option><option value="owner">총괄관리자</option></select><label className="account-active"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> 활성</label><button type="button" disabled={saving} onClick={() => onSave({ id: account.id, username, password: password || undefined, role, active })}>저장</button></div></article>;
}
