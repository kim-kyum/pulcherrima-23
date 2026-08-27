/*
 * GBSHS / PULCHERRIMA — black recruitment page
 * The supplied logo is used as two deliberate crops: the white PULCHERRIMA wordmark
 * for the header and the yellow telescope circle as a separate club symbol.
 * Keep this page direct, editorial, and human; avoid decorative AI-style chrome.
 */
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  ChevronDown,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";

const LOGO_SRC = "/manus-storage/pulcherrima-wordmark_a46d3471.png";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  const [visible, setVisible] = useState(false);
  const [node, setNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return (
    <div
      ref={setNode}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`logo-wordmark-crop ${className}`} aria-hidden="true">
      <img src={LOGO_SRC} alt="" />
    </span>
  );
}

function TelescopeSeal({ className = "" }: { className?: string }) {
  return (
    <span className={`logo-seal-crop ${className}`} aria-hidden="true">
      <img src={LOGO_SRC} alt="" />
    </span>
  );
}

const navItems = [
  { id: "about", label: "동아리 소개", en: "ABOUT" },
  { id: "activities", label: "활동", en: "ACTIVITIES" },
  { id: "join", label: "23기 모집", en: "JOIN 23" },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("about");

  useEffect(() => {
    const sections = navItems
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver(
      (entries) => {
        const current = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (current?.target.id) setActiveSection(current.target.id);
      },
      { rootMargin: "-20% 0px -64% 0px", threshold: [0.08, 0.2, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>

      <header className={`site-header ${menuOpen ? "menu-is-open" : ""}`}>
        <a className="site-brand" href="#top" aria-label="Pulcherrima 홈">
          <TelescopeSeal className="header-seal" />
          <Wordmark className="header-wordmark" />
        </a>

        <nav className="desktop-nav" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <a
              key={item.id}
              className={activeSection === item.id ? "is-active" : ""}
              href={`#${item.id}`}
              aria-current={activeSection === item.id ? "page" : undefined}
            >
              <span>{item.label}</span>
              <small>{item.en}</small>
            </a>
          ))}
        </nav>

        <a className="header-cta" href="#join">
          지원 안내 <ArrowUpRight size={15} strokeWidth={1.8} />
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>

        <div className="mobile-menu" aria-hidden={!menuOpen}>
          {navItems.map((item) => (
            <a key={item.id} href={`#${item.id}`} onClick={() => setMenuOpen(false)}>
              <span>{item.label}</span>
              <small>{item.en}</small>
              <ArrowUpRight size={17} />
            </a>
          ))}
        </div>
      </header>

      <main id="main-content">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="hero-rule" aria-hidden="true" />
          <div className="hero-topline">
            <span>GBSHS / ASTRONOMY CLUB</span>
            <span>2027 RECRUITING / 23RD</span>
          </div>

          <div className="hero-content">
            <Reveal className="hero-copy">
              <p className="hero-kicker">경기북과학고 천체 관측 동아리</p>
              <h1 id="hero-title">
                밤하늘을 보고,
                <br />
                <span>직접 확인합니다.</span>
              </h1>
              <p className="hero-description">
                망원경을 조립하고, 오래 기다리고, 우리가 본 것을 기록하는 사람들.
                <br className="desktop-only" />
                Pulcherrima가 23기를 기다립니다.
              </p>
              <div className="hero-actions">
                <a className="button button-yellow" href="#join">
                  23기 모집 보기 <ArrowDown size={18} />
                </a>
                <a className="text-link text-link-light" href="#activities">
                  우리가 하는 일 <ArrowDown size={16} />
                </a>
              </div>
            </Reveal>

            <Reveal delay={120} className="hero-seal-wrap">
              <TelescopeSeal className="hero-seal" />
              <span className="hero-seal-caption">ONLY STARS / GBSHS</span>
            </Reveal>
          </div>

          <div className="hero-bottomline">
            <span>01 — LOOK UP</span>
            <span className="hero-scroll"><ChevronDown size={15} /> SCROLL</span>
            <span>PULCHERRIMA / 23</span>
          </div>
        </section>

        <section className="intro-section" id="about" aria-labelledby="about-title">
          <div className="section-topline">
            <span>01</span>
            <span>ABOUT THE CLUB</span>
          </div>
          <div className="intro-grid">
            <Reveal className="intro-heading">
              <p className="section-kicker">A CLUB FOR PEOPLE WHO KEEP ASKING</p>
              <h2 id="about-title">
                별을 좋아한다는 말로는
                <br />
                <span>충분합니다.</span>
              </h2>
            </Reveal>
            <Reveal delay={90} className="intro-copy">
              <p>
                Pulcherrima는 GBSHS 학생들이 함께 천체를 관측하고, 생각을 나누고,
                기록을 남기는 동아리입니다. 잘 아는 사람만 오는 곳이 아닙니다.
                직접 보고 싶은 마음에서 시작합니다.
              </p>
              <p>
                하늘은 매일 같아 보이지만, 우리가 보는 것은 매번 달라집니다.
                그래서 한 번 더 맞춰보고, 한 줄 더 적습니다.
              </p>
              <div className="intro-signature">
                <span>GBS</span>
                <span className="intro-signature-rule" />
                <span>KEEP LOOKING</span>
              </div>
            </Reveal>
          </div>
          <div className="principles-row" aria-label="동아리 활동 원칙">
            <div><span>01</span><strong>OBSERVE</strong><small>직접 봅니다</small></div>
            <div><span>02</span><strong>RECORD</strong><small>남겨둡니다</small></div>
            <div><span>03</span><strong>SHARE</strong><small>같이 이야기합니다</small></div>
          </div>
        </section>

        <section className="activities-section" id="activities" aria-labelledby="activities-title">
          <div className="section-topline">
            <span>02</span>
            <span>WHAT WE DO</span>
          </div>
          <div className="activities-intro">
            <Reveal>
              <p className="section-kicker">OBSERVATION, NOT SPECTACLE</p>
              <h2 id="activities-title">
                망원경을 조립하고,
                <br />
                <span>기록을 남깁니다.</span>
              </h2>
            </Reveal>
            <Reveal delay={90} className="activities-copy">
              <p>
                정기 관측부터 천체 사진, 별자리 찾기와 관측값 정리까지. 활동의 속도는
                느릴 수 있지만, 직접 해본 만큼 다음 관측이 달라집니다.
              </p>
              <a className="text-link" href="https://www.youtube.com/channel/UCplIsa1QW2a_eQcvtJAymXw" target="_blank" rel="noreferrer">
                활동 영상 보기 <ExternalLink size={15} />
              </a>
            </Reveal>
          </div>

          <div className="activity-feature-grid">
            <Reveal className="activity-image-frame">
              <img src="https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1400&q=88" alt="별이 가득한 밤하늘" loading="lazy" />
              <span className="image-caption">FIELD NOTE / A CLEAR NIGHT</span>
            </Reveal>
            <Reveal delay={100} className="activity-note">
              <span className="activity-note-number">01</span>
              <h3>보이지 않던 것이<br /><span>보이기 시작하는 시간.</span></h3>
              <p>
                처음에는 망원경 안에 작은 빛 하나만 보입니다. 초점을 맞추고, 위치를
                다시 확인하고, 옆 사람에게 같은 것을 보여줍니다. 관측은 그렇게 함께
                확인하는 일에서 시작합니다.
              </p>
              <div className="note-meta"><span>TELESCOPE / SCHOOL ROOFTOP</span><span>23:48</span></div>
            </Reveal>
          </div>

        </section>

        <section className="join-section" id="join" aria-labelledby="join-title">
          <div className="section-topline">
            <span>03</span>
            <span>JOIN PULCHERRIMA / 23</span>
          </div>
          <div className="join-head">
            <Reveal>
              <p className="section-kicker">FOR THE NEXT OBSERVERS</p>
              <h2 id="join-title">
                이번 겨울,
                <br />
                <span>같이 볼 사람을 찾습니다.</span>
              </h2>
            </Reveal>
            <Reveal delay={100} className="join-symbol-column">
              <TelescopeSeal className="join-seal" />
              <span>GBSHS / 23RD</span>
            </Reveal>
          </div>

          <div className="join-details">
            <Reveal className="join-message">
              <p>
                별을 잘 몰라도 괜찮습니다. 망원경을 처음 만져도 괜찮습니다.
                직접 보고 싶고, 모르는 것을 물어볼 수 있다면 충분합니다.
              </p>
              <div className="join-actions-final">
                <a className="button button-white" href="mailto:recruit@pulcherrima.site?subject=Pulcherrima%2023%EA%B8%B0%20%EC%A7%80%EC%9B%90%20%EB%AC%B8%EC%9D%98">
                  지원 문의 보내기 <ArrowUpRight size={18} />
                </a>
                <a className="button button-outline-light" href="https://www.youtube.com/channel/UCplIsa1QW2a_eQcvtJAymXw" target="_blank" rel="noreferrer">
                  활동 영상 보기 <ExternalLink size={16} />
                </a>
              </div>
              <span className="join-hint">지원 일정과 방법은 확정 후 안내합니다.</span>
            </Reveal>
            <Reveal delay={100} className="join-checklist">
              <div className="checklist-top"><span>YOU MIGHT FIT HERE IF…</span><span>23 / 2027</span></div>
              <ul>
                <li><Check size={17} /> 직접 만지고 확인하는 걸 좋아한다면</li>
                <li><Check size={17} /> 모르는 것을 질문하는 데 망설임이 없다면</li>
                <li><Check size={17} /> 한 번 본 것을 기록으로 남기고 싶다면</li>
              </ul>
            </Reveal>
          </div>
          <div className="join-footerline"><span>APPLICATION WINDOW</span><strong>세부 일정은 공지 예정</strong><span>GBS / PULCHERRIMA</span></div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="footer-brand" href="#top" aria-label="Pulcherrima 홈">
          <TelescopeSeal className="footer-seal" />
          <Wordmark className="footer-wordmark" />
        </a>
        <p>GBSHS ASTRONOMY CLUB · 2027</p>
        <div className="footer-links">
          <a href="#top">위로 <ArrowUpRight size={14} /></a>
          <a href="https://pulcherrima.site/" target="_blank" rel="noreferrer">pulcherrima.site <ExternalLink size={13} /></a>
        </div>
      </footer>
    </div>
  );
}
