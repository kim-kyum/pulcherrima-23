/*
 * Pulcherrima official home
 * Three screen-sized black pages carry the core statement, media, and first-screen routes.
 * Keep the copy restrained, use polite explanatory sentences, and let the provided logo stay in SiteHeader.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUpRight, ExternalLink, Play } from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import { getNextScreenIndex } from "@/lib/heroNavigation";

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
};

const placeholderSky = "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=1500&q=88";

const heroScreens = [
  { no: "01", line: "학교의 가장 높은 곳,", kind: "intro" as const },
  { no: "02", line: "학교의 가장 어두운 곳에서,", kind: "video" as const, video: featuredVideo },
  { no: "03", line: "가장 밝게 빛나다", kind: "image" as const, image: placeholderSky },
];

export default function Home() {
  const heroTrackRef = useRef<HTMLDivElement | null>(null);
  const [activeScreen, setActiveScreen] = useState(0);
  const scrollLockRef = useRef(false);

  useEffect(() => {
    const track = heroTrackRef.current;
    if (!track) return;
    const screens = Array.from(track.querySelectorAll<HTMLElement>(".hero-screen"));
    const observer = new IntersectionObserver((entries) => {
      if (scrollLockRef.current) return;
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveScreen(screens.indexOf(visible.target as HTMLElement));
    }, { rootMargin: "-35% 0px -55% 0px", threshold: 0 });
    screens.forEach((screen) => observer.observe(screen));
    return () => observer.disconnect();
  }, []);

  const goToNextScreen = () => {
    if (scrollLockRef.current) return;
    const nextIndex = getNextScreenIndex(activeScreen, heroScreens.length);
    const target = heroTrackRef.current?.querySelector<HTMLElement>(`.hero-screen:nth-child(${nextIndex + 1})`);
    if (!target) return;

    scrollLockRef.current = true;
    setActiveScreen(nextIndex);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      scrollLockRef.current = false;
    }, 700);
  };

  return (
    <div className="site-shell official-home">
      <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
      <SiteHeader />

      <main id="main-content">
        <section className="official-hero" aria-label="Pulcherrima 핵심 문구">
          <div className="hero-screen-track" ref={heroTrackRef}>
            {heroScreens.map((screen, index) => (
              <article className="hero-screen" key={screen.no} aria-labelledby={`hero-screen-${screen.no}`}>
                <div className="hero-screen-meta"><span>{index === 0 ? "GBS / 천체 관측 동아리" : "PULCHERRIMA"}</span></div>
                <div className={`hero-screen-layout ${screen.kind !== "intro" ? "has-media" : ""}`}>
                  <div className="hero-screen-copy">
                    <p className="section-kicker">GBS 천체 관측 동아리 PULCHERRIMA</p>
                    <h1 id={`hero-screen-${screen.no}`}>{screen.line}</h1>
                    {screen.kind === "intro" && <div className="hero-intro-description"><p>망원경을 세우고 오늘의 대상을 고릅니다. 보이는 것을 기록하고, 다음 관측을 준비합니다.</p></div>}
                  </div>
                  {screen.kind === "video" && <div className="hero-screen-media"><iframe src={`https://www.youtube.com/embed/${screen.video.id}?rel=0`} title={screen.video.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>}
                  {screen.kind === "image" && <div className="hero-screen-media hero-screen-image"><img src={screen.image} alt="별이 가득한 밤하늘" /></div>}
                </div>
                <div className="hero-screen-controls">
                  {index === 0 && <div className="hero-screen-cta"><Link className="button button-yellow" href="/videos">홍보 영상 보기 <Play size={16} fill="currentColor" /></Link><Link className="text-link text-link-light" href="/archive">활동기록소 <ArrowUpRight size={16} /></Link><Link className="text-link text-link-light" href="/recruiting">지원하기 <ArrowUpRight size={16} /></Link></div>}
                </div>
                <div className="hero-screen-edge"><span>풀체리마 공식 사이트</span></div>
              </article>
            ))}
            {activeScreen < heroScreens.length - 1 && <button className="hero-scroll-button" type="button" onClick={goToNextScreen} aria-label="다음 화면으로 이동"><ArrowDown size={18} /></button>}
          </div>
        </section>
      </main>

      <footer className="site-footer official-footer"><div><p>GBS ASTRONOMY CLUB · PULCHERRIMA</p><small>공식 사이트 · 활동기록소 · 영상 · 23기 모집</small></div><div className="footer-links"><a href="mailto:recruit@pulcherrima.site" aria-label="문의 메일 열기">문의하기 <ArrowUpRight size={14} /></a><a href="https://www.youtube.com/channel/UCplIsa1QW2a_eQcvtJAymXw" target="_blank" rel="noreferrer">YouTube <ExternalLink size={13} /></a></div></footer>
    </div>
  );
}
