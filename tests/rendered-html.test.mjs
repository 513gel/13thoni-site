import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function request(pathname, init = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html", ...(init.headers ?? {}) }, ...init }),
    {
      REVIEW_PIN: "3991",
      REVIEW_ACCESS_TOKEN: "test-review-access-token",
      ASSETS: {
        fetch: async (assetRequest) => {
          const path = new URL(assetRequest.url).pathname.replace(/^\//, "");
          try {
            const body = await readFile(new URL(`../dist/client/${path}`, import.meta.url));
            return new Response(body, { headers: { "content-type": "text/html; charset=utf-8" } });
          } catch {
            return new Response("Not found", { status: 404 });
          }
        },
      },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the 13th Oni personal terminal with its local applications", async () => {
  const response = await request("/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /13th Oni — Personal Terminal/i);
  assert.match(html, /href="\/MOTTLE\/"/i);
  assert.match(html, /href="\/PIXEL-FORGE\/"/i);
  assert.doesNotMatch(html, /href="\/(FORMATKILLER|RHYTHMGRID|BASSLIQUID|LOOPFORGE)\//i);
  assert.match(html, /RENDER VAULT/);
  assert.doesNotMatch(html, /open\.spotify\.com/i);
});

test("adds the locked review drop to each 13OS Start menu without adding it to the launcher", async () => {
  const [home, taskbar] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/13os-taskbar.js", import.meta.url), "utf8"),
  ]);
  assert.match(home, /REVIEW DROP \/\/ LOCKED/);
  assert.match(taskbar, /REVIEW DROP \/\/ LOCKED/);
});

test("serves the private review drop only at its direct unlisted route", async () => {
  const response = await request("/r/5c881e9e710d4aa0b92d");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /REVIEW DROP/i);
  assert.match(html, /noindex, nofollow/i);
  assert.doesNotMatch(html, /MOTTLE|PIXEL FORGE|GLYPHSHIFT/i);
});

test("requires the review PIN before serving the manifest or review media", async () => {
  const blocked = await request("/review-drop/manifest.json");
  assert.equal(blocked.status, 401);

  const rejected = await request("/api/review-unlock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pin: "0000" }) });
  assert.equal(rejected.status, 401);

  const unlocked = await request("/api/review-unlock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pin: "3991" }) });
  assert.equal(unlocked.status, 204);
  const cookie = unlocked.headers.get("set-cookie");
  assert.match(cookie ?? "", /HttpOnly; Secure; SameSite=Lax/i);

  const manifest = await request("/review-drop/manifest.json", { headers: { cookie: "oni_review_access=test-review-access-token" } });
  assert.equal(manifest.status, 200);
  assert.equal(manifest.headers.get("cache-control"), "private, no-store");
});

test("serves the bundled Mottle application at /MOTTLE/", async () => {
  const response = await request("/MOTTLE/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>MOTTLE<\/title>/i);
  assert.ok(html.length > 500_000, "expected the complete self-contained Mottle build");
  assert.match(html, /13os-taskbar\.js/i);
});

test("normalizes /MOTTLE to its canonical trailing-slash URL", async () => {
  const response = await request("/MOTTLE");
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "http://localhost/MOTTLE/");
});

test("serves Pixel Forge as a local 13OS application", async () => {
  const response = await request("/PIXEL-FORGE/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /13OS \/\/ PIXEL\s*<b>FORGE<\/b>/i);
  assert.match(html, /CANVAS PROTOCOL/i);
  assert.match(html, /id="canvasSize"/i);
  assert.match(html, /function setCanvasSize/i);
  assert.match(html, /class="workspace"/i);
  assert.match(html, /class="inspector"/i);
  assert.match(html, /CONTROL SURFACE/i);
  assert.match(html, /13os-taskbar\.js/i);
});

test("normalizes /PIXEL-FORGE to its canonical trailing-slash URL", async () => {
  const response = await request("/PIXEL-FORGE");
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "http://localhost/PIXEL-FORGE/");
});

test("serves Glyphshift from the terminal toolchain", async () => {
  const response = await request("/GLYPHSHIFT/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /GLYPHSHIFT/i);
  assert.match(html, /13os-taskbar\.js/i);
});

test("normalizes /GLYPHSHIFT to its canonical trailing-slash URL", async () => {
  const response = await request("/GLYPHSHIFT");
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "http://localhost/GLYPHSHIFT/");
});

for (const { slug, title } of [
  { slug: "FORMATKILLER", title: "FORMATKILLER" },
  { slug: "RHYTHMGRID", title: "RHYTHMGRID" },
  { slug: "BASSLIQUID", title: "BASSLIQUID" },
  { slug: "LOOPFORGE", title: "LOOPFORGE" },
]) {
  test("serves "+slug+" from its sealed release bundle", async () => {
    const response = await request("/"+slug+"/");
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, new RegExp(title, "i"));
    assert.match(html, /13os-taskbar\.js/i);
  });

  test("normalizes /"+slug+" to its canonical trailing-slash URL", async () => {
    const response = await request("/"+slug);
    assert.equal(response.status, 308);
    assert.equal(response.headers.get("location"), "http://localhost/"+slug+"/");
  });
}

test("ships the Mottle source as a public deployment asset", async () => {
  const html = await readFile(new URL("../public/MOTTLE/index.html", import.meta.url), "utf8");
  assert.match(html, /<title>MOTTLE<\/title>/i);
  assert.ok(html.length > 500_000);
  assert.match(html, /page:5, sel:"#temporalAdd,#previewBtn"/);
  assert.match(html, /page:7, sel:"#catModeRow,#catModeToggle"/);
  assert.match(html, /function obReveal\(el,done\)/);
  assert.match(html, /page\.scrollTop=Math\.max\(0,centered\)/);
  assert.match(html, /<option value="paint">Painted selection<\/option>/);
  assert.match(html, /function paintMaskAlpha\(/);
  assert.match(html, /Draw on preview/);
  assert.match(html, /appendPaintMaskControls\(details,mask,"temporal"/);
  assert.match(html, /appendPaintMaskControls\(card\.querySelector\('details\.op-section:last-of-type'\),mask,"effect"/);
});
