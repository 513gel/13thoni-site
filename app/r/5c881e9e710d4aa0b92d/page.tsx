"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
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
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  const loadManifest = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/review-drop/manifest.json", { cache: "no-store" });
    if (response.status === 401) { setLocked(true); setLoading(false); return; }
    if (!response.ok) throw new Error("Review manifest unavailable");
    const data = await response.json();
    setManifest({ updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : null, items: safeItems(data.items) });
    setLocked(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadManifest().catch(() => { setManifest(emptyManifest); setLoading(false); });
  }, [loadManifest]);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPinError("");
    const response = await fetch("/api/review-unlock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pin }) });
    if (!response.ok) { setPinError("ACCESS DENIED // CHECK PIN"); setPin(""); return; }
    setPin("");
    await loadManifest().catch(() => setPinError("ACCESS CHANNEL FAILED // RETRY"));
  }

  const active = activeIndex === null ? null : manifest.items[activeIndex];
  const stamp = manifest.updatedAt ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(manifest.updatedAt)) : "NO MEDIA QUEUED";

  return <main className={styles.reviewShell}>
    <header className={styles.header}><div><span className={styles.kicker}>13TH ONI // PRIVATE UPLINK</span><h1>REVIEW DROP</h1></div><span className={styles.count}>{manifest.items.length.toString().padStart(2, "0")} FILES</span></header>
    <p className={styles.notice}>Temporary review transmission. Files are cleared from the local review workspace at 10:00 AM.</p>
    <div className={styles.meta}><span>LAST STAGED // {stamp}</span><span>TAP TO INSPECT</span></div>
    {loading ? <div className={styles.empty}>LOADING REVIEW SIGNAL…</div> : manifest.items.length === 0 ? <div className={styles.empty}><b>NO MEDIA IN THE DROP</b><span>The next render batch will appear here when it is staged.</span></div> : <section className={styles.feed} aria-label="Review media">{manifest.items.map((item, index) => <button className={styles.card} type="button" key={`${item.src}-${item.modifiedAt}`} onClick={() => setActiveIndex(index)}><span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>{item.kind === "video" ? <video src={item.src} muted playsInline preload="metadata" /> : <img src={item.src} alt={item.title} loading={index > 1 ? "lazy" : "eager"} />}<span className={styles.cardShade} /><span className={styles.cardMeta}><b>{item.title}</b><small>{item.kind === "video" ? "VIDEO // TAP TO PLAY" : "IMAGE // TAP TO EXPAND"}</small></span></button>)}</section>}
    {active && <section className={styles.viewer} role="dialog" aria-modal="true" aria-label={`${active.title} fullscreen viewer`}><div className={styles.viewerBar}><span>{String((activeIndex ?? 0) + 1).padStart(2, "0")} // {active.title}</span><button type="button" onClick={() => setActiveIndex(null)}>CLOSE ×</button></div><div className={styles.viewerMedia}>{active.kind === "video" ? <video src={active.src} controls autoPlay playsInline /> : <img src={active.src} alt={active.title} />}</div></section>}
    {locked && <section className={styles.lock} role="dialog" aria-modal="true" aria-labelledby="review-lock-title"><form className={styles.lockCard} onSubmit={unlock}><span className={styles.kicker}>13TH ONI // RESTRICTED REVIEW</span><h2 id="review-lock-title">ENTER ACCESS PIN</h2><p>Media transmission is locked. Enter the four-digit review code.</p><input value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))} type="password" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{4}" maxLength={4} autoFocus aria-label="Four digit review PIN" /><button type="submit" disabled={pin.length !== 4}>UNLOCK REVIEW →</button>{pinError && <small>{pinError}</small>}</form></section>}
  </main>;
}
