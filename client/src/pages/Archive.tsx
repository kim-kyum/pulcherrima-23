/*
 * Pulcherrima archive
 * The current semester is page one. Older semesters stay available through simple page buttons,
 * so new observation records can be appended without changing the page structure.
 */
import { useMemo, useState } from "react";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import { trpc } from "@/lib/trpc";

const entries = [
  { no: "01", date: "2026. 08", type: "관측 기록", title: "여름 은하수 지도", excerpt: "학교 옥상에서 보이는 별을 하나씩 이어 다음 관측을 위한 지도로 남긴 기록입니다.", image: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=1100&q=88" },
  { no: "02", date: "2026. 05", type: "현장 기록", title: "초점을 맞추는 동안", excerpt: "망원경을 처음 조립한 날입니다. 오래 걸려도 같은 대상을 함께 확인한 기록입니다.", image: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1100&q=88" },
  { no: "03", date: "2026. 03", type: "동아리 기록", title: "첫 관측을 위한 준비", excerpt: "관측 전 체크리스트와 장비를 정리하며 다음 질문을 고른 기록입니다.", image: "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=1100&q=88" },
];

const semesterPages = [
  { label: "이번 학기", period: "2026 하반기", records: entries },
  { label: "이전 학기 1", period: "2026 상반기", records: [] },
  { label: "이전 학기 2", period: "2025 하반기", records: [] },
];

export default function Archive() {
  const [page, setPage] = useState(0);
  const managedContent = trpc.content.get.useQuery({ contentKey: "archive" });
  const managed = useMemo(() => { try { return managedContent.data ? JSON.parse(managedContent.data.contentValue) as { intro?: string; entries?: typeof entries } : {}; } catch { return {}; } }, [managedContent.data]);
  const current = { ...semesterPages[page], records: page === 0 && managed.entries?.length ? managed.entries : semesterPages[page].records };

  return (
    <div className="inner-page archive-page">
      <SiteHeader />
      <main className="inner-main">
        <section className="page-intro archive-intro">
          <div className="page-intro-meta"><span>GBS / 풀체리마</span><span>활동기록소 / {current.period}</span></div>
          <div className="page-intro-grid">
            <div>
              <p className="section-kicker">풀체리마 활동기록소</p>
              <h1>2천년 역사의 천문, <span>풀체리마도 함께하다</span></h1>
            </div>
            <p className="page-intro-copy">{managed.intro ?? "관측이 끝난 뒤의 기록과 준비하는 동안의 질문, 함께 보낸 밤의 흔적을 남깁니다. 현재 학기 기록부터 지난 기록까지 차례로 확인할 수 있습니다."}</p>
          </div>
        </section>

        <section className="archive-list" aria-label={`${current.label} 활동 기록 목록`}>
          {current.records.length > 0 ? current.records.map((entry) => (
            <article key={`${page}-${entry.no}`} className="archive-entry">
              <div className="archive-entry-index"><span>{entry.no}</span><span className="archive-line" /></div>
              <div className="archive-entry-image"><img src={entry.image} alt="" loading="lazy" /></div>
              <div className="archive-entry-body">
                <div className="archive-entry-meta"><span>{entry.date}</span><span>{entry.type}</span></div>
                <h2>{entry.title}</h2>
                <p>{entry.excerpt}</p>
                <button type="button" className="archive-read-button" aria-label={`${entry.title} 기록 준비 중`}>기록 상세 <ChevronRight size={16} /></button>
              </div>
            </article>
          )) : (
            <div className="archive-empty-state"><span>{current.label}</span><h2>이전 관측 기록을 이곳에 이어 붙입니다.</h2><p>지난 학기의 관측 자료는 정리한 뒤 이 페이지에 추가합니다.</p></div>
          )}
        </section>

        <nav className="archive-pagination" aria-label="학기 기록 페이지">
          <span>학기 기록</span>
          <div>{semesterPages.map((semester, index) => <button key={semester.period} className={page === index ? "is-active" : ""} type="button" onClick={() => setPage(index)} aria-current={page === index ? "page" : undefined}>{index + 1}</button>)}</div>
        </nav>
      </main>
      <footer className="site-footer inner-footer"><p>GBS ASTRONOMY CLUB · PULCHERRIMA</p><Link href="/">공식 사이트 홈 <ArrowUpRight size={14} /></Link></footer>
    </div>
  );
}
