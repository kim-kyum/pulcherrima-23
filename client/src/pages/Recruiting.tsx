/*
 * Pulcherrima recruiting page
 * Recruitment is intentionally separate from the official home and archive so the public
 * site can stay evergreen while a future application form can grow here.
 */
import { ArrowUpRight, Check, Mail, MoveLeft } from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";

export default function Recruiting() {
  return (
    <div className="inner-page recruiting-page">
      <SiteHeader />
      <main className="inner-main">
        <section className="page-intro recruiting-intro">
          <div className="page-intro-meta"><span>GBS / PULCHERRIMA</span><span>JOIN 23 / 2027</span></div>
          <div className="recruiting-title-row">
            <div>
              <p className="section-kicker">OPEN CALL / 23RD</p>
              <h1>다음 관측을<br /><span>같이 준비합니다.</span></h1>
            </div>
            <p className="page-intro-copy">모집 페이지는 공식 사이트의 한 구석이 아니라, 지원을 생각하는 사람을 위한 별도의 안내서입니다. 일정이 정해지면 이곳에서 가장 먼저 안내합니다.</p>
          </div>
        </section>

        <section className="recruiting-notice" aria-labelledby="notice-title">
          <div className="notice-label"><span>APPLICATION NOTICE</span><span>23 / 2027</span></div>
          <div className="notice-body">
            <h2 id="notice-title">지금은 다음 공지를<br /><span>기다리는 시간입니다.</span></h2>
            <div className="notice-copy">
              <p>지원 일정과 방법은 확정 후 GBSHS 학교 공지와 Pulcherrima 공식 채널을 통해 안내합니다. 궁금한 점은 먼저 메일로 남겨주세요.</p>
              <a className="button button-yellow" href="mailto:recruit@pulcherrima.site?subject=Pulcherrima%2023%EA%B8%B0%20지원%20문의">지원 문의 보내기 <Mail size={17} /></a>
            </div>
          </div>
        </section>

        <section className="recruiting-fit">
          <div className="section-topline"><span>01</span><span>WHO IS THIS FOR</span></div>
          <div className="fit-grid">
            <h2>별을 잘 몰라도<br /><span>괜찮습니다.</span></h2>
            <ul>
              <li><Check size={18} /> 직접 보고 확인하는 것을 좋아하는 사람</li>
              <li><Check size={18} /> 모르는 것을 질문하고 함께 배우는 사람</li>
              <li><Check size={18} /> 작은 관측도 기록으로 남기고 싶은 사람</li>
            </ul>
          </div>
        </section>

        <section className="recruiting-flow">
          <div className="section-topline"><span>02</span><span>WHAT HAPPENS NEXT</span></div>
          <div className="flow-row">
            <div><strong>01</strong><h3>공지 확인</h3><p>공식 채널과 학교 공지에서 모집 일정을 확인합니다.</p></div>
            <div><strong>02</strong><h3>지원하기</h3><p>지원 방법이 열리면 안내된 방식으로 지원합니다.</p></div>
            <div><strong>03</strong><h3>첫 관측</h3><p>새로운 질문을 들고 함께 첫 관측을 준비합니다.</p></div>
          </div>
        </section>

        <div className="inner-backlink"><Link href="/"><MoveLeft size={16} /> 공식 사이트로 돌아가기</Link><Link href="/archive">활동기록소 보기 <ArrowUpRight size={15} /></Link></div>
      </main>
      <footer className="site-footer inner-footer"><p>GBSHS ASTRONOMY CLUB · PULCHERRIMA</p><Link href="mailto:recruit@pulcherrima.site">recruit@pulcherrima.site <ArrowUpRight size={14} /></Link></footer>
    </div>
  );
}
