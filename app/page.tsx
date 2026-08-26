"use client";

import { useEffect, useMemo, useState } from "react";

const bootLines = [
  "XIII BIOS // REV 0.13.7",
  "MEMORY INTEGRITY...........PASS",
  "SIGNAL ARRAY...............ONLINE",
  "RENDER VAULT...............MOUNTED",
  "ACCESS PROTOCOL............REQUESTED",
  "OBSERVER TOKEN.............ISSUED",
  "GUEST PRIVILEGE............GRANTED",
];

const gallery = [
  { title: "EN ROUTE", type: "PSX MOTION STUDY", image: "/archive/en-route-rear-launch.png", path: "IG-006_EN_ROUTE" },
  { title: "HEADSPLITTER", type: "ENTITY TEST", image: "/archive/headsplitter-front.png", path: "IG-003_HEADSPLITTER" },
  { title: "CONTINUE WITHOUT ME", type: "CINEMATIC FRAME", image: "/archive/continue-without-me.png", path: "IG-007_CONTINUE_WITHOUT_ME" },
  { title: "LIBERTY ACCESS", type: "ARCHIVE 013", image: "/archive/liberty-symbol.png", path: "IG-002_ARCHIVE_013_LIBERTY" },
];

function localTime() {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

export default function Home() {
  const [booting, setBooting] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [status, setStatus] = useState("ACCESS GATE // GUEST SESSION READY");
  const [clock, setClock] = useState("");
  const [selectedWork, setSelectedWork] = useState(gallery[0]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = window.sessionStorage.getItem("oni-boot-seen") === "true";
    const timer = window.setTimeout(() => {
      if (!reducedMotion && !seen) window.sessionStorage.setItem("oni-boot-seen", "true");
      setBooting(false);
    }, reducedMotion || seen ? 0 : 3200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(localTime()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const workCount = useMemo(() => String(gallery.length).padStart(2, "0"), []);

  function completeBoot() {
    window.sessionStorage.setItem("oni-boot-seen", "true");
    setBooting(false);
  }

  function jump(id: string, nextStatus: string) {
    setMenuOpen(false);
    setStatus(nextStatus);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function togglePlayer() {
    setPlayerOpen((open) => !open);
    setStatus(playerOpen ? "MEDIA DOCK // STANDBY" : "RUDE BOI HOURS // PLAYER OPEN");
  }

  return (
    <main className="site-shell">
      <section className={`boot-screen ${booting ? "is-active" : "is-complete"}`} aria-hidden={!booting}>
        <div className="boot-code" aria-hidden="true">
          {bootLines.map((line, index) => <span key={line} style={{ "--line": index } as React.CSSProperties}>{line}</span>)}
        </div>
        <div className="boot-mark">
          <img src="/brand/oni-emblem.png" alt="" />
          <p>13TH ONI</p>
          <span>PERSONAL TERMINAL ACCESS GRANTED</span>
        </div>
        <button className="skip-boot" type="button" onClick={completeBoot}>Skip initialization</button>
      </section>

      <section className="desktop" id="home" aria-label="13th Oni personal terminal">
        <header className="system-header">
          <span>13TH ONI // PERSONAL TERMINAL</span>
          <span>NODE 013 / OPERATOR ACTIVE</span>
        </header>

        <div className="desktop-grid">
          <section className="window identity-window" aria-labelledby="terminal-title">
            <div className="window-bar"><span>TERMINAL://HOME</span><span>_ □ ×</span></div>
            <div className="identity-content">
              <div className="mark-field">
                <span className="target-corner target-corner--tl" />
                <span className="target-corner target-corner--tr" />
                <span className="target-corner target-corner--bl" />
                <span className="target-corner target-corner--br" />
                <img src="/brand/oni-emblem.png" alt="" />
                <span className="scan-line" />
              </div>
              <div className="identity-copy">
                <span className="eyebrow">PRIVATE SYSTEM / PUBLIC UPLINK</span>
                <h1 id="terminal-title">WELCOME TO<br />MY TERMINAL.</h1>
                <p>A personal archive for rendered work, digital tools, downloads, and whichever signal is currently ruining my sleep schedule.</p>
                <div className="identity-actions">
                  <button type="button" className="signal-button" onClick={() => jump("archive", "RENDER VAULT // OPEN")}>OPEN RENDER VAULT</button>
                  <a className="quiet-button" href="/MOTTLE/">LAUNCH MOTTLE ↗</a>
                </div>
              </div>
            </div>
          </section>

          <aside className="window status-window" aria-label="Terminal access status">
            <div className="window-bar"><span>ACCESS://GATE</span><span>GRANTED</span></div>
            <div className="status-body">
              <div className="operator-card">
                <img src="/brand/oni-emblem.png" alt="" />
                <div><span className="operator-name">EXTERNAL VISITOR</span><span className="operator-state"><i /> READ-ONLY CREDENTIAL</span></div>
              </div>
              <dl className="metrics">
                <div><dt>ACCESS TIER</dt><dd>GUEST / 013</dd></div>
                <div><dt>PRIVILEGE</dt><dd>VIEW + TOOLS</dd></div>
                <div><dt>IDENTITY</dt><dd>OBFUSCATED</dd></div>
              </dl>
              <p className="system-note">You are inside a personal system as an admitted guest. Account authorization protocol is pending.</p>
            </div>
          </aside>

          <section className="window applications-window" aria-labelledby="apps-title">
            <div className="window-bar"><span id="apps-title">APPS://LAUNCHER</span><span>03 INSTALLED</span></div>
            <div className="app-list">
              <a className="app-tile app-tile--mottle" href="/MOTTLE/">
                <span className="app-icon">M</span><span><b>MOTTLE</b><small>Image degradation &amp; mutation engine</small></span><em>OPEN ↗</em>
              </a>
              <a className="app-tile" href="/PIXEL-FORGE/">
                <span className="app-icon">P</span><span><b>PIXEL FORGE 32</b><small>32×32 sprite &amp; animation workstation</small></span><em>OPEN ↗</em>
              </a>
              <a className="app-tile" href="/GLYPHSHIFT/">
                <span className="app-icon">G</span><span><b>GLYPHSHIFT</b><small>Text, signal, and waveform mutation suite</small></span><em>OPEN ↗</em>
              </a>
            </div>
          </section>

          <section className="window log-window" aria-label="Terminal activity">
            <div className="window-bar"><span>ACTIVITY://LOG</span><span>NOW</span></div>
            <ol className="activity-log">
              <li><span>00:13</span>ARCHIVE UPLINK ESTABLISHED</li>
              <li><span>00:13</span>MOTTLE SERVICE AVAILABLE</li>
              <li><span>00:13</span>WALLPAPER TRANSFER QUEUED</li>
              <li><span>00:13</span>RUDE BOI HOURS ON AIR</li>
            </ol>
          </section>
        </div>
      </section>

      <section className="archive-section" id="archive" aria-labelledby="archive-title">
        <header className="section-header">
          <span>RENDER VAULT // {workCount} FEATURED TRANSMISSIONS</span>
          <button type="button" onClick={() => jump("wallpapers", "WALLPAPER INDEX // OPEN")}>WALLPAPER MODE ↓</button>
        </header>
        <div className="archive-layout">
          <div className="featured-render">
            <img src={selectedWork.image} alt={`${selectedWork.title} render preview`} />
            <div className="featured-meta"><span>NOW VIEWING</span><h2>{selectedWork.title}</h2><p>{selectedWork.type}{" // "}{selectedWork.path}</p></div>
          </div>
          <div className="render-index">
            {gallery.map((item, index) => (
              <button className={`render-row ${item.title === selectedWork.title ? "is-selected" : ""}`} key={item.title} type="button" onClick={() => { setSelectedWork(item); setStatus(`${item.title} // PREVIEW LOADED`); }}>
                <span>{String(index + 1).padStart(2, "0")}</span><b>{item.title}</b><small>{item.type}</small>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="wallpaper-section" id="wallpapers" aria-labelledby="wallpaper-title">
        <header className="section-header"><span>WALLPAPER VAULT // FULL-RESOLUTION SOURCE FILES</span><span>NO LOGIN REQUIRED</span></header>
        <div className="wallpaper-grid">
          {gallery.slice(0, 3).map((item) => (
            <article className="wallpaper-card" key={item.title}>
              <img src={item.image} alt="" />
              <div><span>FULL RES WALLPAPER</span><h3>{item.title}</h3><a href={item.image} download>DOWNLOAD PNG ↓</a></div>
            </article>
          ))}
        </div>
      </section>

      {playerOpen && (
        <section className="media-dock" aria-label="Rude Boi Hours media dock">
          <header><span>RUDE BOI HOURS // SPOTIFY UPLINK</span><button type="button" onClick={togglePlayer}>MINIMIZE ×</button></header>
          <iframe data-testid="embed-iframe" className="spotify-player" src="https://open.spotify.com/embed/playlist/4HSwiGun7jGSpFbPBj7J8a?utm_source=generator&theme=0&si=2da6b42ffd8843b5" width="100%" height="152" frameBorder="0" allowFullScreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" title="Rude Boi Hours Spotify playlist" />
        </section>
      )}

      {menuOpen && (
        <nav className="start-menu" aria-label="Start menu">
          <span className="menu-heading">13OS // START</span>
          <button type="button" onClick={() => jump("home", "HOME TERMINAL // READY")}>⌂ HOME TERMINAL</button>
          <button type="button" onClick={() => jump("archive", "RENDER VAULT // OPEN")}>▣ RENDER VAULT</button>
          <button type="button" onClick={() => jump("wallpapers", "WALLPAPER INDEX // OPEN")}>▤ WALLPAPERS</button>
          <a href="/MOTTLE/">◌ MOTTLE</a>
          <a href="/PIXEL-FORGE/">▦ PIXEL FORGE 32</a>
          <a href="/GLYPHSHIFT/">▧ GLYPHSHIFT</a>
          <button type="button" onClick={togglePlayer}>♫ RUDE BOI HOURS</button>
        </nav>
      )}

      <footer className="taskbar" aria-live="polite">
        <button className="start-button" type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen}>十三鬼 <span>START</span></button>
        <div className="taskbar-apps"><button type="button" onClick={() => jump("home", "HOME TERMINAL // READY")}>HOME</button><a href="/MOTTLE/">MOTTLE</a><a href="/PIXEL-FORGE/">PIXEL FORGE</a><a href="/GLYPHSHIFT/">GLYPHSHIFT</a></div>
        <button className={`media-button ${playerOpen ? "is-active" : ""}`} type="button" onClick={togglePlayer} aria-expanded={playerOpen}>♫ RUDE BOI HOURS <span>{playerOpen ? "MINIMIZE" : "PLAYER"}</span></button>
        <span className="taskbar-status">{status}</span>
        <span className="taskbar-clock">LOCAL {clock}</span>
        <span className="taskbar-user"><img src="/brand/oni-emblem.png" alt="" /> GUEST ACCESS</span>
      </footer>
    </main>
  );
}
