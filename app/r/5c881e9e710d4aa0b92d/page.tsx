"use client";

import { useEffect, useState } from "react";
import styles from "./review.module.css";

type ReviewItem = { src: string; title: string; kind: "image" | "video"; modifiedAt: string; bytes: number };
type ReviewManifest = { updatedAt: string | null; items: ReviewItem[] };
const emptyManifest: ReviewManifest = { updatedAt: null, items: [] };

function safeItems(items: unknown): ReviewItem[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item): item is ReviewItem => {
    if (!item || typeof item !== "object") return false;
    const value = item as ReviewItem;
    return typeof value.src === "string" && value.src.startsWith("/review-drop/media/") && typeof value.title === "string" && (value.kind === "image" || value.kind === "video");
  });
}

export default function PrivateReviewPage() {
  const [manifest, setManifest] = useState<ReviewManifest>(emptyManifest);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/review-drop/manifest.json", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : emptyManifest)
      .then((data) => { if (!cancelled) setManifest({ updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : null, items: safeItems(data.items) }); })
      .catch(() => { if (!cancelled) setManifest(emptyManifest); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const active = activeIndex === null ? null : manifest.items[activeIndex];
  const stamp = manifest.updatedAt ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(manifest.updatedAt)) : "NO MEDIA QUEUED";

  return <main className={styles.reviewShell}>
    <header className={styles.header}><div><span className={styles.kicker}>13TH ONI // PRIVATE UPLINK</span><h1>REVIEW DROP</h1></div><span className={styles.count}>{manifest.items.length.toString().padStart(2, "0")} FILES</span></header>
    <p className={styles.notice}>Temporary review transmission. Files are cleared from the local review workspace at 10:00 AM.</p>
    <div className={styles.meta}><span>LAST STAGED // {stamp}</span><span>TAP TO INSPECT</span></div>
    {loading ? <div className={styles.empty}>LOADING REVIEW SIGNAL…</div> : manifest.items.length === 0 ? <div className={styles.empty}><b>NO MEDIA IN THE DROP</b><span>The next render batch will appear here when it is staged.</span></div> : <section className={styles.feed} aria-label="Review media">{manifest.items.map((item, index) => <button className={styles.card} type="button" key={`${item.src}-${item.modifiedAt}`} onClick={() => setActiveIndex(index)}><span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>{item.kind === "video" ? <video src={item.src} muted playsInline preload="metadata" /> : <img src={item.src} alt={item.title} loading={index > 1 ? "lazy" : "eager"} />}<span className={styles.cardShade} /><span className={styles.cardMeta}><b>{item.title}</b><small>{item.kind === "video" ? "VIDEO // TAP TO PLAY" : "IMAGE // TAP TO EXPAND"}</small></span></button>)}</section>}
    {active && <section className={styles.viewer} role="dialog" aria-modal="true" aria-label={`${active.title} fullscreen viewer`}><div className={styles.viewerBar}><span>{String((activeIndex ?? 0) + 1).padStart(2, "0")} // {active.title}</span><button type="button" onClick={() => setActiveIndex(null)}>CLOSE ×</button></div><div className={styles.viewerMedia}>{active.kind === "video" ? <video src={active.src} controls autoPlay playsInline /> : <img src={active.src} alt={active.title} />}</div></section>}
  </main>;
}
