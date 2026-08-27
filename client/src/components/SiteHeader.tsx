/*
 * Pulcherrima official header
 * The supplied full logo is the only primary brand mark. The header stays fixed in place,
 * turns translucent after a little scroll, and hides while scrolling down. The mobile
 * drawer contains real routes instead of acting as a decorative X toggle.
 */
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";

const LOGO_SRC = "/manus-storage/pulcherrima-wordmark_a46d3471.png";

const items = [
  { href: "/", label: "소개" },
  { href: "/archive", label: "활동기록소" },
  { href: "/videos", label: "영상" },
  { href: "/recruiting", label: "23기 모집" },
];

export default function SiteHeader() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 32);
      if (y > 110 && y > lastY.current + 8) setHidden(true);
      if (y < lastY.current - 8 || y < 40) setHidden(false);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setHidden(false);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location]);

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""} ${hidden ? "is-hidden" : ""} ${menuOpen ? "menu-is-open" : ""}`}>
      <Link href="/" className="full-logo-link" aria-label="Pulcherrima 공식 사이트 홈">
        <img className="full-logo" src={LOGO_SRC} alt="PULCHERRIMA" />
      </Link>

      <nav className="desktop-nav" aria-label="주요 메뉴">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className={location === item.href ? "is-active" : ""}>
            {item.label}
          </Link>
        ))}
      </nav>

      <Link className="header-cta" href="/recruiting">
        23기 모집 <ArrowUpRight size={16} strokeWidth={1.7} />
      </Link>

      <button
        className="menu-toggle"
        type="button"
        aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={menuOpen}
        aria-controls="site-mobile-menu"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X size={21} /> : <Menu size={21} />}
      </button>

      <div id="site-mobile-menu" className={`mobile-menu ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        {items.map((item) => (
          <Link key={item.href} href={item.href} className={location === item.href ? "is-active" : ""}>
            <span>{item.label}</span>
            <ArrowUpRight size={16} />
          </Link>
        ))}
      </div>
    </header>
  );
}
