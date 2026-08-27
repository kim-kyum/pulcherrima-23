/*
 * Pulcherrima video archive
 * The selected YouTube video plays inside this page. Content can be updated from /admin.
 */
import { useMemo, useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import { trpc } from "@/lib/trpc";

type VideoItem = { year: string; title: string; id: string; duration: string; featured?: boolean };
type VideosContent = { kicker?: string; title?: string; intro?: string; periodLabel?: string; channelUrl?: string; items?: VideoItem[] };
const fallbackVideos: VideoItem[] = [
  { year: "2024", title: "Pulcherrima 과학동아리발표회 부스 홍보영상", id: "sk-etZM7EqQ", duration: "2:01" },
  { year: "2024", title: "PULCHERRIMA 동아리 소개 영상", id: "hqkLYB7H0sE", duration: "1:10" },
  { year: "2023", title: "풀체리마 부스 뭐 해요?", id: "0qf_fXZ-Sb0", duration: "0:11" },
  { year: "2023", title: "아니 그래서 풀체리마 뭐 하는 동아리에요?", id: "uUaVF_6sLoI", duration: "1:05" },
  { year: "2023", title: "경기북과학고등학교 Pulcherrima 홍보영상", id: "oxCAIxOCvL8", duration: "1:20", featured: true },
  { year: "2022", title: "풀체리마 소개영상", id: "6jxOhJ7LToQ", duration: "0:46" },
  { year: "2020", title: "풀체리마 활동 돌아보기", id: "1r0Wan3ns6Q", duration: "6:40" },
  { year: "2020", title: "풀체리마 소개영상", id: "cNuInvHCMTE", duration: "1:40" },
  { year: "2020", title: "동아리 소개 및 2020 돌아보기 — 통합본", id: "bgZE82axgzY", duration: "8:19" },
];
const fallbackContent: Required<Pick<VideosContent, "kicker" | "title" | "intro" | "periodLabel" | "channelUrl">> = { kicker: "풀체리마 유튜브", title: "영상으로 먼저 만나보세요.", intro: "동아리 소개, 학술발표회, 활동 돌아보기를 담은 풀체리마 채널의 영상 기록입니다. 목록에서 영상을 고르면 이 페이지에서 바로 재생할 수 있습니다.", periodLabel: "영상 기록 / 2020—", channelUrl: "https://www.youtube.com/channel/UCplIsa1QW2a_eQcvtJAymXw" };

export default function Videos() {
  const managedQuery = trpc.content.get.useQuery({ contentKey: "videos" });
  const managed = useMemo<VideosContent>(() => { try { return managedQuery.data ? JSON.parse(managedQuery.data.contentValue) as VideosContent : {}; } catch { return {}; } }, [managedQuery.data]);
  const content = { ...fallbackContent, ...managed };
  const videos = managed.items?.length ? managed.items : fallbackVideos;
  const [selectedId, setSelectedId] = useState("oxCAIxOCvL8");
  const selectedVideo = videos.find((video) => video.id === selectedId) ?? videos.find((video) => video.featured) ?? videos[0];

  return (
    <div className="inner-page videos-page">
      <SiteHeader />
      <main className="inner-main">
        <section className="page-intro videos-intro">
          <div className="page-intro-meta"><span>GBS / 풀체리마</span><span>{content.periodLabel}</span></div>
          <div className="page-intro-grid"><div><p className="section-kicker">{content.kicker}</p><h1>{content.title}</h1></div><p className="page-intro-copy">{content.intro}</p></div>
        </section>
        <section className="selected-video-section" aria-labelledby="selected-video-title">
          <div className="selected-video-meta"><span>지금 재생 중</span><span>{selectedVideo.year} · {selectedVideo.duration}</span></div>
          <div className="selected-video-player"><iframe src={`https://www.youtube.com/embed/${selectedVideo.id}?rel=0`} title={selectedVideo.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>
          <div className="selected-video-caption"><h2 id="selected-video-title">{selectedVideo.title}</h2><a href={`https://www.youtube.com/watch?v=${selectedVideo.id}`} target="_blank" rel="noreferrer">YouTube에서 열기 <ExternalLink size={14} /></a></div>
        </section>
        <section className="video-list" aria-label="Pulcherrima YouTube 영상 목록">
          {videos.map((video) => <button className={`video-row ${video.featured ? "is-featured" : ""} ${selectedId === video.id ? "is-selected" : ""}`} key={video.id} type="button" onClick={() => setSelectedId(video.id)} aria-pressed={selectedId === video.id}><span className="video-row-year">{video.year}</span><span className="video-thumb"><img src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt="" loading="lazy" /><span className="video-play"><Play size={15} fill="currentColor" /></span><small>{video.duration}</small></span><span className="video-row-copy"><strong>{video.title}</strong><span>{video.featured ? "대표 영상" : "풀체리마 영상 기록"}</span></span><span className="video-row-arrow" aria-hidden="true"><Play size={13} fill="currentColor" /> 재생</span></button>)}
        </section>
        <div className="inner-backlink"><Link href="/"><span>공식 사이트 홈</span><ExternalLink size={15} /></Link><Link href="/recruiting"><span>모집 안내</span><ExternalLink size={15} /></Link></div>
      </main>
      <footer className="site-footer inner-footer"><p>GBS ASTRONOMY CLUB · PULCHERRIMA</p><a href={content.channelUrl} target="_blank" rel="noreferrer">YouTube 채널 <ExternalLink size={14} /></a></footer>
    </div>
  );
}
