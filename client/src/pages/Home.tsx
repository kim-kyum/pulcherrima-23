/*
 * Pulcherrima official home
 * Keep the page direct and factual. The full logo is owned by SiteHeader; the home uses
 * real club media, a short introduction, and clear routes to the archive, videos, and recruiting.
 */
import { useEffect, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUpRight, ExternalLink, Play } from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";

type RevealProps = { children: ReactNode; className?: string; delay?: number };

function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  const [visible, setVisible] = useState(false);
  const [node, setNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.08 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return <div ref={setNode} className={`reveal ${visible ? "is-visible" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

const featuredVideo = {
  id: "oxCAIxOCvL8",
  title: "2023 경기북과학고등학교 Pulcherrima 홍보영상",
  duration: "1:20",
};

const observationVideo = {
  id: "1r0Wan3ns6Q",
  title: "경기북과학고 천문동아리 Pulcherrima 2020 활동 돌아보기",
  duration: "6:40",
};

const heroScreens = [
  { no: "01", line: "학교의 가장 높은 곳," },
  { no: "02", line: "학교의 가장 어두운 곳에서,", video: featuredVideo },
  { no: "03", line: "가장 밝게 빛나다", video: observationVideo },
];

function scrollToHeroScreen(no: string) {
  const target = document.getElementById(`hero-screen-${no}`)?.closest("article");
  if (!target) return;
  const headerOffset = 82;
  window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - headerOffset, behavior: "smooth" });
}


export default function Home() {
  return (
    <div className="site-shell official-home">
      <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
      <SiteHeader />

      <main id="main-content">
        <section className="official-hero" aria-label="Pulcherrima 핵심 문구">
          <div className="hero-screen-track">
            {heroScreens.map((screen, index) => (
              <article className="hero-screen" key={screen.no} aria-labelledby={`hero-screen-${screen.no}`}>
                <div className="hero-screen-meta"><span>{screen.no}</span><span>{index === 0 ? "GBS / 천체 관측 동아리" : "PULCHERRIMA"}</span></div>
                <div className={`hero-screen-layout ${screen.video ? "has-media" : ""}`}>
                  <div className="hero-screen-copy"><p className="section-kicker">GBS 천체 관측 동아리 PULCHERRIMA</p><h1 id={`hero-screen-${screen.no}`}>{screen.line}</h1></div>
                  {screen.video && <div className="hero-screen-media"><iframe src={`https://www.youtube.com/embed/${screen.video.id}?rel=0`} title={screen.video.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>}
                </div>
                <div className="hero-screen-controls">
                  {index === 0 && <div className="hero-screen-cta"><Link className="button button-yellow" href="/videos">홍보 영상 보기 <Play size={16} fill="currentColor" /></Link><Link className="text-link text-link-light" href="/archive">활동기록소 <ArrowUpRight size={16} /></Link><Link className="text-link text-link-light" href="/recruiting">지원하기 <ArrowUpRight size={16} /></Link></div>}
                  {index < heroScreens.length - 1 && <button className="hero-scroll-button" type="button" onClick={() => scrollToHeroScreen(heroScreens[index + 1].no)} aria-label={`${heroScreens[index + 1].no}번 화면으로 이동`}><ArrowDown size={18} /></button>}
                </div>
                <div className="hero-screen-edge"><span>풀체리마 공식 사이트</span><span>{screen.no}</span></div>
              </article>
            ))}
          </div>
        </section>

        <section className="official-about" id="about" aria-labelledby="about-title">
          <div className="section-topline"><span>01</span><span>동아리 소개</span></div>
          <div className="official-about-grid">
            <Reveal>
              <p className="section-kicker">PULCHERRIMA</p>
              <h2 id="about-title">밤이 맑으면<br /><span>옥상으로 올라갑니다.</span></h2>
            </Reveal>
            <Reveal delay={80} className="official-about-copy">
              <p>풀체리마는 GBS 학생들이 망원경으로 천체를 관측하는 동아리입니다. 관측할 대상을 정하고, 장비를 준비하고, 보이는 것을 기록합니다.</p>
              <p>하늘이 흐린 날에는 다음 관측을 준비합니다. 활동은 관측이 가능한 날과 다음 질문을 정하는 시간까지 이어집니다.</p>
              <div className="principles-line"><span>관측</span><span>기록</span><span>공유</span></div>
            </Reveal>
          </div>
        </section>

        <section className="official-next" aria-labelledby="next-title">
          <div className="section-topline"><span>03</span><span>다음으로</span></div>
          <div className="official-next-inner">
            <Reveal><p className="section-kicker">풀체리마 온라인 기록</p><h2 id="next-title">활동을 보고,<br /><span>기록을 읽어보세요.</span></h2></Reveal>
            <Reveal delay={80} className="official-next-actions"><p>지난 영상은 영상 목록에서, 관측과 준비의 기록은 활동기록소에서 확인할 수 있습니다.</p><Link className="button button-white" href="/archive">활동기록소 <ArrowUpRight size={17} /></Link><Link className="button button-outline-light" href="/videos">영상 목록 <ArrowUpRight size={16} /></Link></Reveal>
          </div>
        </section>
      </main>

      <footer className="site-footer official-footer"><div><p>GBS ASTRONOMY CLUB · PULCHERRIMA</p><small>공식 사이트 · 활동기록소 · 영상 · 23기 모집</small></div><div className="footer-links"><a href="mailto:recruit@pulcherrima.site">연락하기 <ArrowUpRight size={14} /></a><a href="https://www.youtube.com/channel/UCplIsa1QW2a_eQcvtJAymXw" target="_blank" rel="noreferrer">YouTube <ExternalLink size={13} /></a></div></footer>
    </div>
  );
}
