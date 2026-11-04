/*
 * /admin → 회원 계정 panel. Administrators issue member accounts here; members then
 * log in at /gallery to upload photo data. There is intentionally no public sign-up.
 */
import { useState } from "react";
import { CheckCircle2, HardDrive, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatBytes } from "@/lib/photoUpload";

type MemberRowData = { id: number; username: string; displayName: string; active: boolean; lastSignedIn: Date | null };

export default function MemberManager() {
  const [form, setForm] = useState({ username: "", displayName: "", password: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const members = trpc.admin.members.list.useQuery();
  const usage = trpc.photos.usage.useQuery(undefined, { retry: false });
  const status = trpc.member.me.useQuery();
  const onError = (err: { message: string }) => { setNotice(""); setError(err.message); };
  const create = trpc.admin.members.create.useMutation({ onSuccess: () => { setForm({ username: "", displayName: "", password: "" }); members.refetch(); setError(""); setNotice("회원 계정을 만들었습니다. 아이디와 임시 비밀번호를 회원에게 전달하세요."); }, onError });
  const update = trpc.admin.members.update.useMutation({ onSuccess: () => { members.refetch(); setError(""); setNotice("회원 정보를 저장했습니다."); }, onError });
  const activeCount = members.data?.filter((member) => member.active).length ?? 0;

  return (
    <section className="admin-editor-main account-manager">
      <div className="admin-editor-heading">
        <div><p className="section-kicker">회원 사진 저장소</p><h2>회원 계정</h2></div>
        <span className="account-count">활성 {activeCount}명</span>
      </div>
      <p className="admin-help">여기서 만든 계정으로 회원이 <a href="/gallery">/gallery</a>에 로그인해 사진 데이터를 올린다. 공개 가입은 없다. 계정을 비활성화하면 바로 로그인이 막히고, 올린 사진은 남는다.</p>
      <div className="storage-status">
        <HardDrive size={16} />
        {status.data && !status.data.storageReady
          ? <span>사진 저장소가 아직 연결되지 않았다. 저장소 환경변수(S3_*)를 Vercel에 넣어야 업로드가 된다 — 저장소 안내 문서(STORAGE.md) 참고.</span>
          : usage.data
            ? <span>사용 중 {formatBytes(usage.data.usedBytes)} / {formatBytes(usage.data.totalQuotaBytes)} · 파일 {usage.data.fileCount}개 · 한 파일 최대 {formatBytes(usage.data.maxFileBytes)}{usage.data.memberQuotaBytes > 0 ? ` · 1인 한도 ${formatBytes(usage.data.memberQuotaBytes)}` : ""}</span>
            : <span>사용량을 불러오는 중이다.</span>}
      </div>
      <form className="new-account-form member-form" onSubmit={(event) => { event.preventDefault(); create.mutate(form); }}>
        <input placeholder="회원 아이디 (영문·숫자)" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} autoCapitalize="none" minLength={3} required />
        <input placeholder="표시 이름 (예: 23기 김겸)" value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} required />
        <input placeholder="임시 비밀번호 (8자 이상)" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength={8} required />
        <button type="submit" disabled={create.isPending}><Plus size={16} /> 회원 추가</button>
      </form>
      <div className="account-list">
        {members.data?.map((member) => <MemberRow key={member.id} member={member} saving={update.isPending} onSave={(input) => update.mutate(input)} />)}
        {members.isLoading && <p className="admin-help">회원 목록을 불러오는 중이다.</p>}
        {members.data?.length === 0 && <p className="admin-help">아직 회원 계정이 없다.</p>}
      </div>
      {notice && <div className="admin-success" role="status"><CheckCircle2 size={16} /> {notice}</div>}
      {(error || members.error) && <div className="admin-error" role="alert">{error || members.error?.message}</div>}
    </section>
  );
}

function MemberRow({ member, onSave, saving }: { member: MemberRowData; onSave: (input: { id: number; displayName?: string; password?: string; active?: boolean }) => void; saving: boolean }) {
  const [displayName, setDisplayName] = useState(member.displayName);
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(member.active);
  return (
    <article className="account-row">
      <div><input aria-label="표시 이름" value={displayName} onChange={(event) => setDisplayName(event.target.value)} /><span className="role-admin">@{member.username}</span></div>
      <div>
        <input aria-label="새 비밀번호" placeholder="비밀번호 재설정 (선택)" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} />
        <label className="account-active"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> 활성</label>
        <button type="button" disabled={saving} onClick={() => { onSave({ id: member.id, displayName, password: password || undefined, active }); setPassword(""); }}>저장</button>
      </div>
    </article>
  );
}
