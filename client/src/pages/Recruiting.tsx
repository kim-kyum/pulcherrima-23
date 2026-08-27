/*
 * Pulcherrima recruiting page
 * Recruitment is intentionally separate from the official home and archive so the public
 * site can stay evergreen while a future application form can grow here.
 */
import { useMemo } from "react";
import { ArrowUpRight, Check, Mail, MoveLeft } from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import { trpc } from "@/lib/trpc";

export default function Recruiting() {
  const managedContent = trpc.content.get.useQuery({ contentKey: "recruiting" }, { retry: false });
  const managed = useMemo(() => { try { return managedContent.data ? JSON.parse(managedContent.data.contentValue) as Record<string, string> : {}; } catch { return {}; } }, [managedContent.data]);
  const generation = managed.generation ?? "23기";
  const year = managed.year ?? "2027";
  const contactEmail = managed.contactEmail ?? "recruit@pulcherrima.site";
  const applyUrl = managed.applyUrl || `mailto:${contactEmail}?subject=${encodeURIComponent(`Pulcherrima ${generation} 지원 문의`)}`;
  return (
    <div className="inner-page recruiting-page">
      <SiteHeader />
      <main className="inner-main">
        <section className="page-intro recruiting-intro">
          {managedContent.isError && <p className="content-fallback-note" role="status">기본 모집 안내를 표시 중입니다.</p>}
          <div className="page-intro-meta"><span>GBS / 풀체리마</span><span>{generation} 모집 / {year}</span></div>
          <div className="recruiting-title-row">
            <div>
              <p className="section-kicker">풀체리마 {generation} 모집</p>
              <h1>{managed.title ?? "다음 관측을 같이 준비합니다."}</h1>
            </div>
            <p className="page-intro-copy">지원에 필요한 내용을 따로 정리합니다. 모집 일정과 방법은 이곳과 GBS 학교 공지에서 확인할 수 있습니다.</p>
          </div>
        </section>

        <section className="recruiting-notice" aria-labelledby="notice-title">
          <div className="notice-label"><span>모집 안내</span><span>{generation} / {year}</span></div>
          <div className="notice-body">
            <h2 id="notice-title">{managed.noticeTitle ?? "지금은 다음 공지를 기다리는 시간입니다."}</h2>
            <div className="notice-copy">
              <p>{managed.noticeCopy ?? "지원 일정과 방법은 확정 후 GBS 학교 공지와 풀체리마 공식 채널을 통해 안내합니다. 궁금한 점은 메일로 남겨주세요."}</p>
              <a className="button button-yellow" href={applyUrl}>지원 문의 보내기 <Mail size={17} /></a>
            </div>
          </div>
        </section>

        <section className="recruiting-fit">
          <div className="section-topline"><span>01</span><span>지원 안내</span></div>
          <div className="fit-grid">
            <h2>별을 잘 몰라도 <span>괜찮습니다.</span></h2>
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
            <div><strong>01</strong><h3>공지 확인</h3><p>풀체리마 공식 채널과 GBS 학교 공지에서 모집 일정을 확인합니다.</p></div>
            <div><strong>02</strong><h3>지원하기</h3><p>지원 방법이 열리면 안내된 방식으로 지원합니다.</p></div>
            <div><strong>03</strong><h3>첫 관측</h3><p>새로운 질문을 들고 첫 관측을 준비합니다.</p></div>
          </div>
        </section>

        <div className="inner-backlink"><Link href="/"><MoveLeft size={16} /> 공식 사이트로 돌아가기</Link><Link href="/archive">활동기록소 보기 <ArrowUpRight size={15} /></Link></div>
      </main>
      <footer className="site-footer inner-footer"><p>GBS ASTRONOMY CLUB · PULCHERRIMA</p><Link href={`mailto:${contactEmail}`} aria-label="문의 메일 열기">문의하기 <ArrowUpRight size={14} /></Link></footer>
    </div>
  );
}
