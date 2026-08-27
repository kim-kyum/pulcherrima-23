/*
 * Pulcherrima archive page
 * A quiet, blog-like index for future observation reports. Keep entries factual and
 * replace the sample records with real club posts when they are available.
 */
import { ArrowUpRight, CalendarDays, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";

const entries = [
  { no: "01", date: "2026. 08", type: "OBSERVATION NOTE", title: "여름 은하수 지도", excerpt: "학교 옥상에서 보이는 별을 하나씩 이어, 다음 관측을 위한 작은 지도를 만들었습니다.", image: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=1100&q=88" },
  { no: "02", date: "2026. 05", type: "FIELD RECORD", title: "초점을 맞추는 동안", excerpt: "망원경을 처음 조립하는 날. 오래 걸렸지만, 같은 대상을 함께 확인하는 법을 배웠습니다.", image: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1100&q=88" },
  { no: "03", date: "2026. 03", type: "CLUB NOTE", title: "첫 관측을 위한 준비", excerpt: "관측 전 체크리스트와 장비를 정리하며, 우리가 어떤 질문을 가져갈지 이야기했습니다.", image: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1100&q=88" },
];

export default function Archive() {
  return (
    <div className="inner-page archive-page">
      <SiteHeader />
      <main className="inner-main">
        <section className="page-intro archive-intro">
          <div className="page-intro-meta"><span>GBS / PULCHERRIMA</span><span>ARCHIVE / 2026—</span></div>
          <div className="page-intro-grid">
            <div>
              <p className="section-kicker">OBSERVATION ARCHIVE</p>
              <h1>우리가 본 것을<br /><span>남겨두는 곳.</span></h1>
            </div>
            <p className="page-intro-copy">관측이 끝난 뒤의 기록, 준비하는 동안의 질문, 함께 보낸 밤의 흔적을 차곡차곡 모읍니다. 이곳은 앞으로 Pulcherrima의 활동기록소가 됩니다.</p>
          </div>
        </section>

        <section className="archive-list" aria-label="활동 기록 목록">
          {entries.map((entry) => (
            <article key={entry.no} className="archive-entry">
              <div className="archive-entry-index"><span>{entry.no}</span><span className="archive-line" /></div>
              <div className="archive-entry-image"><img src={entry.image} alt="" loading="lazy" /></div>
              <div className="archive-entry-body">
                <div className="archive-entry-meta"><span>{entry.date}</span><span>{entry.type}</span></div>
                <h2>{entry.title}</h2>
                <p>{entry.excerpt}</p>
                <button type="button" className="archive-read-button" aria-label={`${entry.title} 기록 준비 중`}>
                  기록 상세 <ChevronRight size={16} />
                </button>
              </div>
            </article>
          ))}
        </section>

        <section className="archive-next">
          <div><CalendarDays size={18} /><span>THE NEXT ENTRY IS WAITING FOR A CLEAR NIGHT.</span></div>
          <Link href="/recruiting">다음 기록에 함께하기 <ArrowUpRight size={16} /></Link>
        </section>
      </main>
      <footer className="site-footer inner-footer"><p>GBSHS ASTRONOMY CLUB · PULCHERRIMA</p><Link href="/">공식 사이트 홈 <ArrowUpRight size={14} /></Link></footer>
    </div>
  );
}
