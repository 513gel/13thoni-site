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

test("renders the 13th Oni terminal with an open Mottle target", async () => {
  const response = await request("/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /13th Oni — External Terminal/i);
  assert.match(html, /href="\/MOTTLE\/"/i);
  assert.match(html, /MOTTLE/);
  assert.match(html, /OPEN/);
});

test("serves the bundled Mottle application at /MOTTLE/", async () => {
  const response = await request("/MOTTLE/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>MOTTLE<\/title>/i);
  assert.ok(html.length > 500_000, "expected the complete self-contained Mottle build");
});

test("normalizes /MOTTLE to its canonical trailing-slash URL", async () => {
  const response = await request("/MOTTLE");
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "http://localhost/MOTTLE/");
});

test("ships the Mottle source as a public deployment asset", async () => {
  const html = await readFile(new URL("../public/MOTTLE/index.html", import.meta.url), "utf8");
  assert.match(html, /<title>MOTTLE<\/title>/i);
  assert.ok(html.length > 500_000);
  assert.match(html, /page:5, sel:"#temporalAdd,#previewBtn"/);
  assert.match(html, /page:7, sel:"#catModeRow,#catModeToggle"/);
  assert.match(html, /function obReveal\(el,done\)/);
  assert.match(html, /page\.scrollTop=Math\.max\(0,centered\)/);
});
