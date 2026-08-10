"use client";

import { useEffect, useState } from "react";

const bootLines = [
  "XIII BIOS // REV 0.13.7",
  "MEMORY INTEGRITY...........PASS",
  "SIGNAL ARRAY...............ONLINE",
  "ARCHIVE INDEX..............REDACTED",
  "ENTITY SIGNATURE...........FOUND",
  "EXTERNAL OBSERVER..........DETECTED",
];

const nodes = [
  { id: "01", label: "MOTTLE", className: "node--archive", href: "/MOTTLE/" },
  { id: "02", label: "SIGNALS", className: "node--signals", href: null },
  { id: "03", label: "ENTITY", className: "node--entity", href: null },
  { id: "04", label: "COMMS", className: "node--comms", href: null },
];

export default function Home() {
  const [booting, setBooting] = useState(true);
  const [status, setStatus] = useState("UNAUTHORIZED OBSERVER DETECTED");

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasBooted = window.sessionStorage.getItem("oni-boot-seen") === "true";

    if (reducedMotion || hasBooted) {
      setBooting(false);
      return;
    }

    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem("oni-boot-seen", "true");
      setBooting(false);
    }, 3200);

    return () => window.clearTimeout(timer);
  }, []);

  function finishBoot() {
    window.sessionStorage.setItem("oni-boot-seen", "true");
    setBooting(false);
  }

  function probeNode(label: string) {
    setStatus(`${label} NODE // ACCESS UNAVAILABLE`);
    window.setTimeout(() => setStatus("UNAUTHORIZED OBSERVER DETECTED"), 1800);
  }

  return (
    <main className="site-shell">
      <section
        className={`boot-screen ${booting ? "is-active" : "is-complete"}`}
        aria-hidden={!booting}
        aria-label="13th Oni system initialization"
      >
        <div className="boot-code" aria-hidden="true">
          {bootLines.map((line, index) => (
            <span key={line} style={{ "--line": index } as React.CSSProperties}>
              {line}
            </span>
          ))}
        </div>

        <div className="boot-mark">
          <img src="/brand/oni-emblem.png" alt="" />
          <p>13TH ONI</p>
          <span>EXTERNAL ACCESS GRANTED</span>
        </div>

        <button className="skip-boot" type="button" onClick={finishBoot}>
          Skip initialization
        </button>
      </section>

      <section className="terminal" aria-label="13th Oni external terminal">
        <header className="terminal-header">
          <span>13TH ONI / EXTERNAL TERMINAL</span>
          <span className="header-code">SYS.XIII // 13:13</span>
        </header>

        <div className="terminal-field">
          <div className="coordinate coordinate--x">XIII—013—ONI</div>
          <div className="coordinate coordinate--y">SIGNAL LOCK / 00.00</div>

          <div className="entity-frame" aria-hidden="true">
            <span className="reticle reticle--tl" />
            <span className="reticle reticle--tr" />
            <span className="reticle reticle--bl" />
            <span className="reticle reticle--br" />
            <img src="/brand/oni-emblem.png" alt="" />
            <div className="scan-line" />
          </div>

          {nodes.map((node) => {
            const contents = (
              <>
                <span className="node-index">TARGET {node.id}</span>
                <span className="node-label">{node.label}</span>
                <span className="node-state">[ {node.href ? "OPEN" : "LOCKED"} ]</span>
              </>
            );

            return node.href ? (
              <a
                key={node.id}
                className={`target-node target-node--online ${node.className}`}
                href={node.href}
                aria-label={`Open ${node.label}`}
              >
                {contents}
              </a>
            ) : (
              <button
                key={node.id}
                className={`target-node ${node.className}`}
                type="button"
                onClick={() => probeNode(node.label)}
                aria-label={`${node.label}: not yet available`}
              >
                {contents}
              </button>
            );
          })}
        </div>

        <footer className="terminal-footer" aria-live="polite">
          <span className="status-light" />
          <span>STATUS: {status}</span>
          <span className="footer-mark">十三鬼</span>
        </footer>
      </section>
    </main>
  );
}
