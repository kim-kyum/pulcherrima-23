/*
 * 관측 노트 / Editorial Brutalism
 * This page uses an asymmetrical observatory-log layout, paper textures, ink-black type,
 * and a coral stamp accent. Ask before changing: does this reinforce the feeling of a
 * real student astronomy archive rather than a generic AI landing page?
 */
import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  CircleDot,
  Compass,
  ExternalLink,
  Menu,
  Moon,
  Orbit,
  ScanLine,
  Telescope,
  X,
} from "lucide-react";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  id?: string;
};

function Reveal({ children, className = "", delay = 0, id }: RevealProps) {
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
      { threshold: 0.12 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return (
    <div
      ref={setNode}
      id={id}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const navItems = [
  { id: "about", label: "동아리 소개", en: "About" },
  { id: "activities", label: "활동 기록", en: "Activities" },
  { id: "join", label: "23기 모집", en: "Recruiting" },
];

const observations = [
  {
    index: "01",
    date: "2026. 03",
    title: "목성의 띠를 찾는 밤",
    description:
      "처음 망원경을 만지는 날에는 초점을 맞추는 데 시간이 걸립니다. 그 시간을 기다리며, 작은 점이 행성이 되는 순간을 함께 기록합니다.",
    icon: Telescope,
  },
  {
    index: "02",
    date: "2026. 05",
    title: "별빛의 색을 읽는 법",
    description:
      "같은 별도 카메라와 필터에 따라 다르게 보입니다. 관측값을 모으고, 밤하늘을 데이터로 다시 읽어봅니다.",
    icon: ScanLine,
  },
  {
    index: "03",
    date: "2026. 08",
    title: "여름 은하수 지도",
    description:
      "학교 옥상에서 보이는 별을 하나씩 이어 지도를 만들었습니다. 멀리 가지 않아도 관측은 시작됩니다.",
    icon: Orbit,
  },
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("about");

  useEffect(() => {
    const sections = navItems
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.08, 0.2, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        본문으로 건너뛰기
      </a>

      <div className="side-rail" aria-hidden="true">
        <span>OBSERVATORY LOG</span>
        <span className="side-rail-line" />
        <span>GBSA / 2027</span>
      </div>

      <header className={`site-header ${menuOpen ? "menu-is-open" : ""}`}>
        <a className="brand-lockup" href="#top" aria-label="Pulcherrima 홈">
          <span className="brand-mark" aria-hidden="true">
            <span className="brand-star" />
          </span>
          <span className="brand-type">
            <strong>PULCHERRIMA</strong>
            <small>ASTRONOMY CLUB / GBSA</small>
          </span>
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
          23기 지원 안내 <ArrowUpRight size={16} strokeWidth={1.8} />
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="mobile-menu" aria-hidden={!menuOpen}>
          {navItems.map((item, index) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setMenuOpen(false)}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <span className="mobile-menu-index">0{index + 1}</span>
              <span>{item.label}</span>
              <ArrowUpRight size={18} />
            </a>
          ))}
        </div>
      </header>

      <main id="main-content">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <img
            className="hero-image"
            src="https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=2200&q=88"
            alt="밤하늘 아래 설치된 천체 망원경"
          />
          <div className="hero-shade" />
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-content">
            <div className="eyebrow eyebrow-light">
              <span className="eyebrow-dot" />
              GBSA ASTRONOMY CLUB / 2027
            </div>
            <p className="hero-note">경기북과학고 천체 관측 동아리</p>
            <h1 id="hero-title">
              멀리 있는 별을
              <br />
              <em>오늘의 기록</em>으로.
            </h1>
            <p className="hero-description">
              망원경을 직접 조립하고, 밤하늘을 오래 바라보고,
              <br className="desktop-only" />
              우리가 본 것을 다음 사람에게 건네는 곳.
            </p>
            <div className="hero-actions">
              <a className="button button-coral" href="#join">
                23기 모집 살펴보기 <ArrowDownRight size={18} />
              </a>
              <a className="text-link text-link-light" href="#activities">
                활동 기록 읽기 <ArrowDownRight size={16} />
              </a>
            </div>
          </div>
          <div className="hero-stamp" aria-label="2027년 23기 모집">
            <span>OPEN CALL</span>
            <strong>23</strong>
            <small>기 모집</small>
          </div>
          <div className="hero-caption">
            <span>OBS. 23 / FIRST LIGHT</span>
            <span>37° 41′ N · 127° 08′ E</span>
          </div>
          <div className="scroll-cue" aria-hidden="true">
            <span>SCROLL TO OBSERVE</span>
            <ChevronDown size={16} />
          </div>
        </section>

        <section className="intro-section section-paper" id="about" aria-labelledby="about-title">
          <div className="section-index">
            <span>01</span>
            <span className="index-rule" />
            <span>WHY WE LOOK</span>
          </div>
          <div className="intro-copy">
            <Reveal>
              <p className="section-kicker">THE NIGHT IS NOT EMPTY.</p>
              <h2 id="about-title">
                하늘을 보는 건,
                <br />
                <span>질문을 오래</span> 바라보는 일.
              </h2>
            </Reveal>
            <Reveal delay={80} className="intro-body-wrap">
              <p className="intro-body">
                Pulcherrima는 경기북과학고 학생들이 함께 밤하늘을 관측하고 기록하는 동아리입니다.
                정답이 바로 나오지 않는 대상을 좋아합니다. 손으로 장비를 맞추고, 눈으로 확인하고,
                숫자와 문장으로 다시 남깁니다.
              </p>
              <div className="signature-line">
                <span className="signature-mark">P.</span>
                <span>WE KEEP LOOKING.</span>
              </div>
            </Reveal>
          </div>
          <div className="intro-aside">
            <Reveal delay={140}>
              <div className="aside-card">
                <div className="aside-card-top">
                  <span>FIELD NOTE / 22</span>
                  <CircleDot size={15} />
                </div>
                <div className="star-chart" aria-hidden="true">
                  <span className="chart-star chart-star-a" />
                  <span className="chart-star chart-star-b" />
                  <span className="chart-star chart-star-c" />
                  <span className="chart-star chart-star-d" />
                  <span className="chart-star chart-star-e" />
                  <span className="chart-line chart-line-a" />
                  <span className="chart-line chart-line-b" />
                  <span className="chart-line chart-line-c" />
                </div>
                <p>관측은 기다림과 정밀함 사이에서 시작된다.</p>
                <span className="aside-card-foot">CLEAR SKY / KEEP A LOG</span>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="numbers-band" aria-label="동아리 활동 숫자">
          <div className="number-cell">
            <strong>22</strong>
            <span>현재 기수</span>
          </div>
          <div className="number-cell">
            <strong>∞</strong>
            <span>계속되는 질문</span>
          </div>
          <div className="number-cell">
            <strong>1</strong>
            <span>같은 하늘</span>
          </div>
          <div className="numbers-note">
            <span>THE DATA IS SMALL.</span>
            <span>THE UNIVERSE IS NOT.</span>
          </div>
        </section>

        <section className="activities-section section-paper" id="activities" aria-labelledby="activities-title">
          <div className="section-index">
            <span>02</span>
            <span className="index-rule" />
            <span>OUR NIGHTS</span>
          </div>
          <div className="activities-head">
            <Reveal>
              <p className="section-kicker">RECENT OBSERVATIONS</p>
              <h2 id="activities-title">
                우리가 보낸
                <br />
                <span>몇 번의 밤.</span>
              </h2>
            </Reveal>
            <Reveal delay={90} className="activities-intro">
              <p>
                정기 관측, 천체 사진, 데이터 분석, 그리고 관측이 끝난 뒤의 긴 대화. 활동의 모양은
                매번 달라지지만 직접 해보는 태도는 같습니다.
              </p>
              <a className="text-link" href="#join">
                23기 활동 방식 보기 <ArrowUpRight size={16} />
              </a>
            </Reveal>
          </div>

          <div className="activity-layout">
            <div className="activity-list">
              {observations.map((observation, index) => {
                const Icon = observation.icon;
                return (
                  <Reveal key={observation.index} delay={index * 70} className="observation-row">
                    <span className="observation-index">{observation.index}</span>
                    <div className="observation-icon" aria-hidden="true">
                      <Icon size={20} strokeWidth={1.5} />
                    </div>
                    <div className="observation-copy">
                      <span className="observation-date">{observation.date}</span>
                      <h3>{observation.title}</h3>
                      <p>{observation.description}</p>
                    </div>
                    <ArrowUpRight className="observation-arrow" size={18} strokeWidth={1.5} />
                  </Reveal>
                );
              })}
            </div>
            <Reveal delay={180} className="activity-image-card">
              <img
                src="https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1200&q=88"
                alt="학생의 손이 천체 망원경의 초점을 조정하는 모습"
                loading="lazy"
              />
              <div className="image-card-overlay">
                <span>FIG. 02</span>
                <span>FOCUS / 23:48</span>
              </div>
            </Reveal>
          </div>

          <div className="logbook-feature">
            <Reveal className="logbook-image">
              <img
                src="https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1400&q=88"
                alt="별 지도가 그려진 관측 기록 노트"
                loading="lazy"
              />
              <span className="photo-label">ANALOG RECORD / 04</span>
            </Reveal>
            <Reveal delay={100} className="logbook-copy">
              <div className="mini-label"><BookOpen size={14} /> 기록하는 사람들</div>
              <h3>관측은 끝나도
                <br /><span>기록은 남습니다.</span>
              </h3>
              <p>
                잘 찍힌 사진만 남기지 않습니다. 초점이 맞지 않았던 이유, 구름이 지나간 시간,
                다음 관측에서 다시 확인할 질문까지 함께 적습니다.
              </p>
              <div className="logbook-signoff">
                <span>“다음 사람의 첫 관측을 위해.”</span>
                <span className="mono">— PULCHERRIMA 22</span>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="moon-section" aria-labelledby="moon-title">
          <div className="moon-image-wrap">
            <img
              src="https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=1800&q=88"
              alt="얇은 구름 사이로 보이는 반달"
              loading="lazy"
            />
            <div className="moon-image-mark">NIGHT STUDY / 05</div>
          </div>
          <div className="moon-copy">
            <p className="section-kicker section-kicker-light">WHAT WE TAKE HOME</p>
            <h2 id="moon-title">더 많이 아는 것보다,<br /><em>더 잘 보는 법.</em></h2>
            <p>
              동아리방을 나설 때 가져가는 건 관측 결과 하나가 아닙니다. 함께 기다린 시간,
              실패를 다시 맞춰본 손, 그리고 내일 이어질 질문입니다.
            </p>
            <div className="moon-meta">
              <span><Moon size={15} /> MOON PHASE / 48%</span>
              <span><Compass size={15} /> FIELD NOTE / OPEN</span>
            </div>
          </div>
        </section>

        <section className="join-section" id="join" aria-labelledby="join-title">
          <div className="join-header">
            <div className="section-index section-index-dark">
              <span>03</span>
              <span className="index-rule" />
              <span>23RD RECRUITMENT</span>
            </div>
            <Reveal>
              <p className="section-kicker">FOR THE NEXT OBSERVERS</p>
              <h2 id="join-title">이번 겨울,
                <br /><span>직접 초점을 맞춰보자.</span>
              </h2>
            </Reveal>
          </div>
          <div className="join-grid">
            <Reveal className="join-copy">
              <p className="join-lead">
                별을 좋아한다는 말만으로 충분합니다. 아직 망원경을 만져보지 않았어도 괜찮습니다.
                23기의 첫 관측일을 함께 준비해요.
              </p>
              <div className="join-actions">
                <a className="button button-ink" href="#recruitment-details">
                  모집 안내 확인 <ArrowDownRight size={18} />
                </a>
                <a
                  className="text-link text-link-dark"
                  href="https://www.youtube.com/channel/UCplIsa1QW2a_eQcvtJAymXw"
                  target="_blank"
                  rel="noreferrer"
                >
                  활동 영상 보기 <ExternalLink size={15} />
                </a>
              </div>
            </Reveal>
            <Reveal delay={110} className="join-checklist" id="recruitment-details">
              <div className="checklist-heading">
                <span>YOU MIGHT FIT HERE IF…</span>
                <CalendarDays size={18} />
              </div>
              <ul>
                <li><Check size={17} /> 직접 만지고 확인하는 걸 좋아한다면</li>
                <li><Check size={17} /> 모르는 것을 질문하는 데 망설임이 없다면</li>
                <li><Check size={17} /> 한 번 본 것을 기록으로 남기고 싶다면</li>
              </ul>
              <div className="recruitment-note">
                <span className="mono">APPLICATION WINDOW</span>
                <strong>세부 일정은 공지 예정</strong>
                <p>모집 일정과 지원 방법은 확정 후 동아리 공식 채널과 학교 공지를 통해 안내합니다.</p>
              </div>
            </Reveal>
          </div>
          <div className="join-footer-line">
            <span>PULCHERRIMA / ASTRONOMY CLUB</span>
            <span>MAKE A NOTE OF THE SKY.</span>
            <span>2027 · 23</span>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand">
          <span className="brand-mark brand-mark-light" aria-hidden="true"><span className="brand-star" /></span>
          <span>
            <strong>PULCHERRIMA</strong>
            <small>GBSA ASTRONOMY CLUB</small>
          </span>
        </div>
        <p>경기북과학고등학교 천체 관측 동아리</p>
        <div className="footer-links">
          <a href="#top">위로 <ArrowUpRight size={15} /></a>
          <a href="https://pulcherrima.site/" target="_blank" rel="noreferrer">pulcherrima.site <ExternalLink size={14} /></a>
        </div>
      </footer>
    </div>
  );
}
