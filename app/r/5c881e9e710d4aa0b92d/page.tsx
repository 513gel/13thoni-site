"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
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
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [locked, setLocked] = useState(true);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  const loadManifest = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/review-drop/manifest.json", { cache: "no-store", signal });
      if (response.status === 401) { setLocked(true); return; }
      if (!response.ok) throw new Error("Review manifest unavailable");
      const payload = await response.json();
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid review manifest");
      const data = payload as { updatedAt?: unknown; items?: unknown };
      if (signal?.aborted) return;
      setManifest({ updatedAt: typeof data.updatedAt === "string" && Number.isFinite(Date.parse(data.updatedAt)) ? data.updatedAt : null, items: safeItems(data.items) });
      setLocked(false);
      setPinError("");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadManifest(AbortSignal.any([controller.signal, AbortSignal.timeout(15000)])).catch(() => {
      if (!controller.signal.aborted) { setLoading(false); setPinError("ACCESS CHANNEL FAILED // RETRY"); }
    });
    return () => controller.abort();
  }, [loadManifest]);

  useEffect(() => {
    if (!locked && activeIndex === null) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () => [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input, video[controls], a[href], [tabindex="0"]')];
    focusable()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !locked) { event.preventDefault(); setActiveIndex(null); }
      if (event.key === "Tab") {
        const items = focusable();
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); if (previous?.isConnected) previous.focus(); };
  }, [locked, activeIndex]);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setPinError("");
    try {
      const response = await fetch("/api/review-unlock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pin }), signal: AbortSignal.timeout(15000) });
      setPin("");
      if (!response.ok) {
        setPinError(response.status === 429 ? "TOO MANY ATTEMPTS // WAIT ONE MINUTE" : response.status === 503 ? "REVIEW ACCESS TEMPORARILY UNAVAILABLE" : "ACCESS DENIED // CHECK PIN");
        return;
      }
      setLoading(true);
      await loadManifest(AbortSignal.timeout(15000));
    } catch { setLoading(false); setPinError("ACCESS CHANNEL FAILED // RETRY"); }
    finally { setSubmitting(false); }
  }

  const active = activeIndex === null ? null : manifest.items[activeIndex];
  const stamp = manifest.updatedAt ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(manifest.updatedAt)) : "NO MEDIA QUEUED";

  return <main className={styles.reviewShell}>
    <header className={styles.header}><div><span className={styles.kicker}>13TH ONI // PRIVATE UPLINK</span><h1>REVIEW DROP</h1></div><span className={styles.count}>{manifest.items.length.toString().padStart(2, "0")} FILES</span></header>
    <p className={styles.notice}>Temporary review transmission. Files are cleared from the local review workspace at 10:00 AM.</p>
    <div className={styles.meta}><span>LAST STAGED // {stamp}</span><span>TAP TO INSPECT</span></div>
    {loading ? <div className={styles.empty}>LOADING REVIEW SIGNAL…</div> : manifest.items.length === 0 ? <div className={styles.empty}><b>NO MEDIA IN THE DROP</b><span>The next render batch will appear here when it is staged.</span></div> : <section className={styles.feed} aria-label="Review media">{manifest.items.map((item, index) => <button className={styles.card} type="button" key={`${item.src}-${item.modifiedAt}`} onClick={() => setActiveIndex(index)}><span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>{item.kind === "video" ? <video src={item.src} muted playsInline preload="metadata" /> : <img src={item.src} alt={item.title} loading={index > 1 ? "lazy" : "eager"} />}<span className={styles.cardShade} /><span className={styles.cardMeta}><b>{item.title}</b><small>{item.kind === "video" ? "VIDEO // TAP TO PLAY" : "IMAGE // TAP TO EXPAND"}</small></span></button>)}</section>}
    {active && <section ref={dialogRef} className={styles.viewer} role="dialog" aria-modal="true" aria-label={`${active.title} fullscreen viewer`}><div className={styles.viewerBar}><span>{String((activeIndex ?? 0) + 1).padStart(2, "0")}{" // "}{active.title}</span><button type="button" onClick={() => setActiveIndex(null)}>CLOSE ×</button></div><div className={styles.viewerMedia}>{active.kind === "video" ? <video src={active.src} controls autoPlay playsInline /> : <img src={active.src} alt={active.title} />}</div></section>}
    {locked && <section ref={dialogRef} className={styles.lock} role="dialog" aria-modal="true" aria-labelledby="review-lock-title"><form className={styles.lockCard} onSubmit={unlock}><span className={styles.kicker}>13TH ONI // RESTRICTED REVIEW</span><h2 id="review-lock-title">ENTER ACCESS CODE</h2><p>Media transmission is locked. Enter the eight-digit review code.</p><input value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 8))} type="password" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{8}" maxLength={8} aria-label="Eight digit review code" /><button type="submit" disabled={pin.length !== 8}>UNLOCK REVIEW →</button>{pinError && <small role="alert">{pinError}</small>}</form></section>}
  </main>;
}
