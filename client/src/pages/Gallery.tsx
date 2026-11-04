/*
 * Pulcherrima member photo library (/gallery)
 * Members log in with an account issued in /admin, then upload observation data —
 * JPG/TIFF finals, RAW frames, FITS/XISF stacks, SER/AVI planetary video — straight
 * to object storage. Nothing here is public; every file URL checks the login cookie.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, Download, ExternalLink, FileImage, LogOut, Trash2, UploadCloud, X } from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import { trpc } from "@/lib/trpc";
import { formatBytes, uploadPhoto, type UploadApi, type UploadHandle } from "@/lib/photoUpload";

type QueueItem = { id: string; file: File; title: string; progress: number; state: "waiting" | "uploading" | "done" | "error" | "cancelled"; message?: string };

const ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.avif,.tif,.tiff,.bmp,.fits,.fit,.fts,.fz,.xisf,.cr2,.cr3,.nef,.arw,.raf,.orf,.rw2,.dng,.pef,.srw,.ser,.avi,.mov,.mp4,.zip";
const BROWSER_VIEWABLE = ["jpg", "jpeg", "png", "webp", "gif", "avif", "bmp", "mp4", "mov"];

function stripExtension(name: string) {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

export default function Gallery() {
  const me = trpc.member.me.useQuery();
  if (me.isLoading) return <GalleryShell><p className="gallery-muted">불러오는 중…</p></GalleryShell>;
  const data = me.data;
  if (!data || !data.authenticated) return <GalleryShell><MemberLogin onDone={() => me.refetch()} /></GalleryShell>;
  return <GalleryShell><Library name={data.name} isAdmin={data.isAdmin} kind={data.kind} storageReady={data.storageReady} onLogout={() => me.refetch()} /></GalleryShell>;
}

function GalleryShell({ children }: { children: ReactNode }) {
  return (
    <div className="inner-page gallery-page">
      <SiteHeader />
      <main className="inner-main">
        <section className="page-intro gallery-intro">
          <div className="page-intro-meta"><span>GBS / 풀체리마</span><span>회원 전용</span></div>
          <div className="page-intro-grid"><div><p className="section-kicker">풀체리마 관측 데이터</p><h1>찍은 하늘을 <span>한곳에</span></h1></div><p className="page-intro-copy">관측 사진과 원본 데이터를 회원끼리 모아 둡니다. RAW·FITS 같은 큰 파일도 그대로 올릴 수 있고, 회원만 보고 내려받을 수 있습니다.</p></div>
        </section>
        <section className="gallery-body">{children}</section>
      </main>
      <footer className="site-footer inner-footer"><p>GBS ASTRONOMY CLUB · PULCHERRIMA</p><Link href="/">공식 사이트 홈 <ArrowUpRight size={14} /></Link></footer>
    </div>
  );
}

function MemberLogin({ onDone }: { onDone: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const login = trpc.member.login.useMutation({ onSuccess: () => { setPassword(""); onDone(); } });
  return (
    <div className="admin-login-card gallery-login">
      <p className="section-kicker">MEMBERS ONLY</p>
      <h2>회원 로그인</h2>
      <p>동아리 관리자에게 받은 회원 아이디로 로그인하세요. 관리자 계정으로 /admin에 로그인해 있어도 이 페이지를 쓸 수 있습니다.</p>
      <form onSubmit={(event) => { event.preventDefault(); login.mutate({ username, password }); }}>
        <label>아이디<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" autoCapitalize="none" required /></label>
        <label>비밀번호<input value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" type="password" required /></label>
        {login.error && <div className="admin-error" role="alert">{login.error.message}</div>}
        <button className="gallery-primary" type="submit" disabled={login.isPending}>{login.isPending ? "확인 중" : "로그인"}</button>
      </form>
    </div>
  );
}

function Library({ name, isAdmin, kind, storageReady, onLogout }: { name: string; isAdmin: boolean; kind: "member" | "admin"; storageReady: boolean; onLogout: () => void }) {
  const [mine, setMine] = useState(false);
  const utils = trpc.useUtils();
  const usage = trpc.photos.usage.useQuery();
  const list = trpc.photos.list.useInfiniteQuery({ limit: 30, mine }, { getNextPageParam: (last) => last.nextCursor });
  const logout = trpc.member.logout.useMutation({ onSuccess: onLogout });
  const remove = trpc.photos.delete.useMutation({ onSuccess: () => { utils.photos.list.invalidate(); utils.photos.usage.invalidate(); } });

  const start = trpc.photos.startUpload.useMutation();
  const signParts = trpc.photos.signParts.useMutation();
  const complete = trpc.photos.complete.useMutation();
  const abort = trpc.photos.abort.useMutation();
  const thumbUpload = trpc.photos.thumbUpload.useMutation();
  const api: UploadApi = {
    start: (input) => start.mutateAsync(input),
    signParts: (input) => signParts.mutateAsync(input),
    complete: (input) => complete.mutateAsync(input),
    abort: (input) => abort.mutateAsync(input),
    thumbUpload: (input) => thumbUpload.mutateAsync(input),
  };
  const apiRef = useRef(api);
  apiRef.current = api;

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [description, setDescription] = useState("");
  const handleRef = useRef<{ id: string; handle: UploadHandle } | null>(null);
  const busy = queue.some((item) => item.state === "uploading" || item.state === "waiting");
  const patch = (id: string, changes: Partial<QueueItem>) => setQueue((current) => current.map((item) => (item.id === id ? { ...item, ...changes } : item)));

  // One file at a time (its parts upload in parallel) keeps tablets and school Wi-Fi responsive.
  useEffect(() => {
    if (handleRef.current || queue.some((item) => item.state === "uploading")) return;
    const next = queue.find((item) => item.state === "waiting");
    if (!next) return;
    patch(next.id, { state: "uploading", progress: 0 });
    const handle = uploadPhoto(apiRef.current, next.file, { title: next.title.trim() || undefined, description: description.trim() || undefined }, (progress) => patch(next.id, { progress }));
    handleRef.current = { id: next.id, handle };
    handle.done
      .then(() => { patch(next.id, { state: "done", progress: 1 }); utils.photos.list.invalidate(); utils.photos.usage.invalidate(); })
      .catch((error: unknown) => patch(next.id, { state: error instanceof Error && error.message.includes("취소") ? "cancelled" : "error", message: error instanceof Error ? error.message : "업로드하지 못했습니다." }))
      .finally(() => { handleRef.current = null; setQueue((current) => [...current]); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue]);

  useEffect(() => {
    if (!busy) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const added = Array.from(files).map((file) => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, file, title: stripExtension(file.name), progress: 0, state: "waiting" as const }));
    setQueue((current) => [...current.filter((item) => item.state !== "done"), ...added]);
  };
  const cancel = (item: QueueItem) => {
    if (handleRef.current?.id === item.id) handleRef.current.handle.cancel();
    else patch(item.id, { state: "cancelled" });
  };

  const items = useMemo(() => list.data?.pages.flatMap((page) => page.items) ?? [], [list.data]);
  const used = usage.data?.usedBytes ?? 0;
  const total = usage.data?.totalQuotaBytes ?? 0;
  const percent = total > 0 ? Math.min(100, (used / total) * 100) : 0;

  return (
    <>
      <div className="gallery-toolbar">
        <div><span className="gallery-muted">{kind === "admin" ? "관리자" : "회원"}</span> <strong>{name}</strong></div>
        {kind === "member" && <button type="button" className="gallery-ghost" onClick={() => logout.mutate()}><LogOut size={15} /> 로그아웃</button>}
      </div>

      <div className="gallery-usage" aria-label="저장 공간 사용량">
        <div className="gallery-usage-bar"><span style={{ width: `${percent}%` }} /></div>
        <p>{usage.data ? <>동아리 저장 공간 {formatBytes(used)} / {formatBytes(total)} 사용 · 내가 올린 것 {formatBytes(usage.data.myUsedBytes)}{usage.data.memberQuotaBytes > 0 && !isAdmin ? ` / ${formatBytes(usage.data.memberQuotaBytes)}` : ""}</> : "사용량을 불러오는 중"}</p>
      </div>

      {!storageReady ? (
        <div className="admin-error" role="alert">사진 저장소가 아직 연결되지 않았습니다. 관리자가 저장소 설정을 마치면 업로드할 수 있습니다.</div>
      ) : (
        <div className="gallery-upload">
          <label className="gallery-drop">
            <UploadCloud size={26} />
            <span>파일 고르기</span>
            <small>JPG·PNG·TIFF·HEIC, RAW(CR2·NEF·ARW·DNG…), FITS·XISF, SER·AVI, ZIP · 한 파일 최대 {usage.data ? formatBytes(usage.data.maxFileBytes) : "…"}</small>
            <input type="file" multiple accept={ACCEPT} onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }} />
          </label>
          <label className="gallery-field">함께 올릴 설명 (선택)<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="대상, 날짜, 장비, 노출 등을 적어 두면 나중에 찾기 쉽습니다." maxLength={2000} /></label>
          {queue.length > 0 && (
            <ul className="gallery-queue">
              {queue.map((item) => (
                <li key={item.id} className={`is-${item.state}`}>
                  <div className="gallery-queue-head">
                    <input aria-label="제목" value={item.title} disabled={item.state !== "waiting"} onChange={(event) => patch(item.id, { title: event.target.value })} />
                    <span>{formatBytes(item.file.size)}</span>
                    {(item.state === "waiting" || item.state === "uploading") && <button type="button" aria-label="업로드 취소" onClick={() => cancel(item)}><X size={15} /></button>}
                  </div>
                  <div className="gallery-progress"><span style={{ width: `${Math.round(item.progress * 100)}%` }} /></div>
                  <small>{item.state === "waiting" ? "대기 중" : item.state === "uploading" ? `${Math.round(item.progress * 100)}% 올리는 중 — 창을 닫지 마세요` : item.state === "done" ? "완료" : item.message}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="gallery-filter" role="tablist">
        <button type="button" role="tab" aria-selected={!mine} className={!mine ? "is-active" : ""} onClick={() => setMine(false)}>전체</button>
        <button type="button" role="tab" aria-selected={mine} className={mine ? "is-active" : ""} onClick={() => setMine(true)}>내가 올린 것</button>
      </div>

      {list.error && <div className="admin-error" role="alert">{list.error.message}</div>}
      <div className="gallery-grid">
        {items.map((photo) => (
          <article key={photo.id} className="gallery-card">
            <div className="gallery-thumb">
              {photo.hasThumb ? <img src={`/api/photos/${photo.id}/thumb`} alt={photo.title ?? photo.fileName} loading="lazy" /> : <div className="gallery-thumb-empty"><FileImage size={26} /><span>{photo.extension.toUpperCase() || "FILE"}</span></div>}
            </div>
            <div className="gallery-card-body">
              <h3 title={photo.fileName}>{photo.title || photo.fileName}</h3>
              <p className="gallery-meta">{photo.uploaderName} · {formatBytes(photo.sizeBytes)} · {new Date(photo.createdAt).toLocaleDateString("ko-KR")}</p>
              {photo.description && <p className="gallery-desc">{photo.description}</p>}
              <div className="gallery-actions">
                {BROWSER_VIEWABLE.includes(photo.extension) && <a href={`/api/photos/${photo.id}/view`} target="_blank" rel="noreferrer"><ExternalLink size={14} /> 보기</a>}
                <a href={`/api/photos/${photo.id}/file`}><Download size={14} /> 받기</a>
                {photo.canEdit && <button type="button" disabled={remove.isPending} onClick={() => { if (window.confirm(`'${photo.title || photo.fileName}'을(를) 지울까요? 되돌릴 수 없습니다.`)) remove.mutate({ photoId: photo.id }); }}><Trash2 size={14} /> 지우기</button>}
              </div>
            </div>
          </article>
        ))}
      </div>
      {!list.isLoading && items.length === 0 && <p className="gallery-muted gallery-empty">{mine ? "아직 올린 파일이 없습니다." : "아직 올라온 사진이 없습니다. 첫 관측 기록을 올려 보세요."}</p>}
      {list.hasNextPage && <button type="button" className="gallery-ghost gallery-more" disabled={list.isFetchingNextPage} onClick={() => list.fetchNextPage()}>{list.isFetchingNextPage ? "불러오는 중" : "더 보기"}</button>}
    </>
  );
}
