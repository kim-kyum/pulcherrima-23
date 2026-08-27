/*
 * Pulcherrima official home
 * The full supplied logo lives only in SiteHeader. This page is an evergreen introduction
 * to the club, with a compact archive preview and a clear route to the separate recruiting page.
 */
import { useEffect, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUpRight, ExternalLink } from "lucide-react";
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

export default function Home() {
  return (
    <div className="site-shell official-home">
      <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
      <SiteHeader />

      <main id="main-content">
        <section className="official-hero" aria-labelledby="home-title">
          <div className="official-hero-rule" aria-hidden="true" />
          <div className="official-hero-meta"><span>GBSHS / ASTRONOMY CLUB</span><span>EST. 2005 / PULCHERRIMA</span></div>
          <div className="official-hero-copy">
            <Reveal>
              <p className="section-kicker">경기북과학고 천체 관측 동아리</p>
              <h1 id="home-title">우리는 밤하늘을<br /><span>오래</span> 바라봅니다.</h1>
              <p className="official-hero-description">망원경을 세우고, 질문을 나누고, 한 번 본 것을 기록합니다.<br />Pulcherrima는 GBSHS의 천체 관측 동아리입니다.</p>
              <div className="hero-actions">
                <Link className="button button-yellow" href="/archive">활동기록소 보기 <ArrowDown size={18} /></Link>
                <Link className="text-link text-link-light" href="/recruiting">23기 모집 안내 <ArrowUpRight size={16} /></Link>
              </div>
            </Reveal>
          </div>
          <div className="official-hero-foot"><span>01 — LOOK UP</span><span>OBSERVE / RECORD / SHARE</span><span>GBS / PULCHERRIMA</span></div>
        </section>

        <section className="official-about" id="about" aria-labelledby="about-title">
          <div className="section-topline"><span>01</span><span>ABOUT THE CLUB</span></div>
          <div className="official-about-grid">
            <Reveal>
              <p className="section-kicker">A CLUB FOR PEOPLE WHO KEEP ASKING</p>
              <h2 id="about-title">별을 좋아한다는 말로는<br /><span>충분합니다.</span></h2>
            </Reveal>
            <Reveal delay={80} className="official-about-copy">
              <p>잘 아는 사람만 오는 곳이 아닙니다. 직접 보고 싶다는 마음에서 시작합니다. 밤이 맑으면 옥상으로 올라가고, 구름이 많으면 장비와 기록을 정리합니다.</p>
              <p>관측은 한 번의 멋진 장면보다, 다음 질문을 남기는 일에 가깝습니다.</p>
              <div className="principles-line"><span>OBSERVE</span><span>RECORD</span><span>SHARE</span></div>
            </Reveal>
          </div>
        </section>

        <section className="official-activity" id="activities" aria-labelledby="activities-title">
          <div className="section-topline"><span>02</span><span>THE WAY WE SEE</span></div>
          <div className="official-activity-grid">
            <div className="activity-log-stamp" aria-hidden="true"><span>FIELD LOG</span><strong>GBS—02</strong><small>MAINTAINED / 2026</small></div>
            <Reveal className="official-activity-image"><img src="https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1500&q=88" alt="관측 기록을 남기는 노트와 필기구" loading="lazy" /><span>FIELD NOTE / OBSERVATION RECORD</span></Reveal>
            <Reveal delay={90} className="official-activity-copy">
              <p className="section-kicker">OBSERVATION, NOT SPECTACLE</p>
              <h2 id="activities-title">보이지 않던 것이<br /><span>보이기</span> 시작하는 시간.</h2>
              <p>망원경을 조립하고, 초점을 맞추고, 같은 대상을 함께 확인합니다. 정기 관측과 천체 사진, 별자리 찾기와 관측값 정리까지, 우리가 하는 일은 하늘을 직접 읽는 연습입니다.</p>
              <Link className="text-link text-link-light" href="/archive">활동 기록 읽기 <ArrowUpRight size={16} /></Link>
            </Reveal>
          </div>
        </section>

        <section className="official-next" aria-labelledby="next-title">
          <div className="section-topline"><span>03</span><span>NEXT</span></div>
          <div className="official-next-inner">
            <Reveal><p className="section-kicker">KEEP LOOKING</p><h2 id="next-title">다음 관측은<br /><span>아직</span> 기록되지 않았습니다.</h2></Reveal>
            <Reveal delay={80} className="official-next-actions"><p>새로운 기록이 올라오는 곳, 그리고 다음 관측을 준비하는 곳.</p><Link className="button button-white" href="/archive">활동기록소로 이동 <ArrowUpRight size={17} /></Link><Link className="button button-outline-light" href="/recruiting">23기 알아보기 <ArrowUpRight size={16} /></Link></Reveal>
          </div>
        </section>
      </main>

      <footer className="site-footer official-footer"><div><p>GBSHS ASTRONOMY CLUB · PULCHERRIMA</p><small>공식 사이트 · 활동기록소 · 23기 모집</small></div><div className="footer-links"><a href="mailto:recruit@pulcherrima.site">연락하기 <ArrowUpRight size={14} /></a><a href="https://www.youtube.com/channel/UCplIsa1QW2a_eQcvtJAymXw" target="_blank" rel="noreferrer">YouTube <ExternalLink size={13} /></a></div></footer>
    </div>
  );
}
