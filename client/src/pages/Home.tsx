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

const heroLines = ["학교의 가장 높은 곳,", "학교의 가장 어두운 곳에서,", "가장 밝게 빛난다."];

function HeroStatement() {
  const [activeLine, setActiveLine] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveLine((line) => (line + 1) % heroLines.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="hero-statement" aria-live="polite">
      <div className="hero-statement-index">0{activeLine + 1} / 03</div>
      <h1 id="home-title" key={heroLines[activeLine]}>{heroLines[activeLine]}</h1>
      <div className="hero-statement-progress" aria-hidden="true">
        {heroLines.map((line, index) => <span key={line} className={index === activeLine ? "is-active" : ""} />)}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="site-shell official-home">
      <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
      <SiteHeader />

      <main id="main-content">
        <section className="official-hero" aria-labelledby="home-title">
          <div className="official-hero-rule" aria-hidden="true" />
          <div className="official-hero-meta"><span>GBS / 천체 관측 동아리</span><span>풀체리마 공식 사이트</span></div>
          <div className="official-hero-copy">
            <Reveal>
              <p className="section-kicker">GBS 천체 관측 동아리 PULCHERRIMA</p>
              <HeroStatement />
              <p className="official-hero-description">학교의 밤을 관측하고, 지난 활동과 영상을 기록하는 동아리다.<br />다음 관측을 위한 질문을 준비한다.</p>
              <div className="hero-actions">
                <Link className="button button-yellow" href="/videos">홍보 영상 보기 <Play size={16} fill="currentColor" /></Link>
                <Link className="text-link text-link-light" href="/archive">활동기록소 <ArrowUpRight size={16} /></Link>
              </div>
            </Reveal>
          </div>
          <div className="official-hero-foot"><span>01 / GBS</span><span>천체 관측 · 활동 기록 · 영상</span><span>PULCHERRIMA</span></div>
        </section>

        <section className="official-about" id="about" aria-labelledby="about-title">
          <div className="section-topline"><span>01</span><span>동아리 소개</span></div>
          <div className="official-about-grid">
            <Reveal>
              <p className="section-kicker">PULCHERRIMA</p>
              <h2 id="about-title">밤이 맑으면<br /><span>옥상으로 올라간다.</span></h2>
            </Reveal>
            <Reveal delay={80} className="official-about-copy">
              <p>풀체리마는 GBS 학생들이 망원경으로 천체를 관측하는 동아리다. 관측할 대상을 정하고, 장비를 준비하고, 보이는 것을 기록한다.</p>
              <p>하늘이 흐린 날에는 다음 관측을 준비한다. 활동은 관측이 가능한 날과 다음 질문을 정하는 시간까지 이어진다.</p>
              <div className="principles-line"><span>관측</span><span>기록</span><span>공유</span></div>
            </Reveal>
          </div>
        </section>

        <section className="official-activity" id="activities" aria-labelledby="activities-title">
          <div className="section-topline"><span>02</span><span>대표 영상</span></div>
          <div className="official-activity-grid">
            <div className="activity-log-stamp" aria-hidden="true"><span>VIDEO</span><strong>2023—19</strong><small>가장 많이 본 영상</small></div>
            <Reveal className="official-video-card">
              <div className="official-video-player">
                <iframe src={`https://www.youtube.com/embed/${featuredVideo.id}?rel=0`} title={featuredVideo.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
              </div>
              <a className="video-external-link" href={`https://www.youtube.com/watch?v=${featuredVideo.id}`} target="_blank" rel="noreferrer">YouTube에서 열기 <ExternalLink size={13} /></a>
            </Reveal>
            <Reveal delay={90} className="official-activity-copy">
              <p className="section-kicker">2023년 19기 모집 영상</p>
              <h2 id="activities-title">풀체리마를<br /><span>영상으로 먼저 본다.</span></h2>
              <p>2023년 경기북과학고등학교 Pulcherrima 홍보영상이다. 이 페이지에서 바로 재생한다.</p>
              <Link className="text-link text-link-light" href="/videos">다른 영상 보기 <ArrowUpRight size={15} /></Link>
            </Reveal>
          </div>
        </section>

        <section className="official-next" aria-labelledby="next-title">
          <div className="section-topline"><span>03</span><span>다음으로</span></div>
          <div className="official-next-inner">
            <Reveal><p className="section-kicker">풀체리마 온라인 기록</p><h2 id="next-title">활동을 보고,<br /><span>기록을 읽는다.</span></h2></Reveal>
            <Reveal delay={80} className="official-next-actions"><p>지난 영상은 영상 목록에서, 관측과 준비의 기록은 활동기록소에서 확인한다.</p><Link className="button button-white" href="/archive">활동기록소 <ArrowUpRight size={17} /></Link><Link className="button button-outline-light" href="/videos">영상 목록 <ArrowUpRight size={16} /></Link></Reveal>
          </div>
        </section>
      </main>

      <footer className="site-footer official-footer"><div><p>GBS ASTRONOMY CLUB · PULCHERRIMA</p><small>공식 사이트 · 활동기록소 · 영상 · 23기 모집</small></div><div className="footer-links"><a href="mailto:recruit@pulcherrima.site">연락하기 <ArrowUpRight size={14} /></a><a href="https://www.youtube.com/channel/UCplIsa1QW2a_eQcvtJAymXw" target="_blank" rel="noreferrer">YouTube <ExternalLink size={13} /></a></div></footer>
    </div>
  );
}
