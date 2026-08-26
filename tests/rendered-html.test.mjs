import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function request(pathname) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    {
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
});
