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
          <div className="page-intro-meta"><span>GBS / 풀체리마</span><span>23기 모집 / 2027</span></div>
          <div className="recruiting-title-row">
            <div>
              <p className="section-kicker">풀체리마 23기 모집</p>
              <h1>다음 관측을<br /><span>같이 준비하기.</span></h1>
            </div>
            <p className="page-intro-copy">지원에 필요한 내용을 따로 정리한 페이지. 모집 일정과 방법은 이곳과 GBS 학교 공지에서 확인.</p>
          </div>
        </section>

        <section className="recruiting-notice" aria-labelledby="notice-title">
          <div className="notice-label"><span>모집 안내</span><span>23기 / 2027</span></div>
          <div className="notice-body">
            <h2 id="notice-title">지금은 다음 공지를<br /><span>기다리는 시간.</span></h2>
            <div className="notice-copy">
              <p>지원 일정과 방법은 확정 후 GBS 학교 공지와 풀체리마 공식 채널에 게시. 궁금한 점은 메일로.</p>
              <a className="button button-yellow" href="mailto:recruit@pulcherrima.site?subject=Pulcherrima%2023%EA%B8%B0%20지원%20문의">지원 문의 보내기 <Mail size={17} /></a>
            </div>
          </div>
        </section>

        <section className="recruiting-fit">
          <div className="section-topline"><span>01</span><span>지원 안내</span></div>
          <div className="fit-grid">
            <h2>별을 잘 몰라도<br /><span>괜찮음.</span></h2>
            <ul>
              <li><Check size={18} /> 직접 보고 확인하는 것을 좋아하는 사람</li>
              <li><Check size={18} /> 모르는 것을 질문하고 함께 배우는 사람</li>
              <li><Check size={18} /> 작은 관측도 기록으로 남기고 싶은 사람</li>
            </ul>
          </div>
        </section>

        <section className="recruiting-flow">
          <div className="section-topline"><span>02</span><span>진행 순서</span></div>
          <div className="flow-row">
            <div><strong>01</strong><h3>공지 확인</h3><p>풀체리마 공식 채널과 GBS 학교 공지에서 모집 일정 확인.</p></div>
            <div><strong>02</strong><h3>지원하기</h3><p>지원 방법이 열리면 안내된 방식으로 지원.</p></div>
            <div><strong>03</strong><h3>첫 관측</h3><p>새로운 질문을 들고 첫 관측을 준비.</p></div>
          </div>
        </section>

        <div className="inner-backlink"><Link href="/"><MoveLeft size={16} /> 공식 사이트로 돌아가기</Link><Link href="/archive">활동기록소 보기 <ArrowUpRight size={15} /></Link></div>
      </main>
      <footer className="site-footer inner-footer"><p>GBS ASTRONOMY CLUB · PULCHERRIMA</p><Link href="mailto:recruit@pulcherrima.site">recruit@pulcherrima.site <ArrowUpRight size={14} /></Link></footer>
    </div>
  );
}
