/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  REVIEW_PIN?: string;
  REVIEW_ACCESS_TOKEN?: string;
  REVIEW_RATE_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

const attempts = new Map<string, { count: number; until: number }>();
function protectedPath(path: string): boolean {
  try { return decodeURIComponent(new URL(path, "https://local.invalid").pathname).startsWith("/review-drop/"); }
  catch { return true; }
}
async function allowAttempt(request: Request, env: Env): Promise<boolean> {
  const key = request.headers.get("CF-Connecting-IP") ?? "unknown";
  if (env.REVIEW_RATE_LIMITER && !(await env.REVIEW_RATE_LIMITER.limit({ key })).success) return false;
  const now = Date.now();
  for (const [ip, item] of attempts) if (item.until <= now) attempts.delete(ip);
  const item = attempts.get(key) ?? { count: 0, until: now + 60_000 };
  if (!attempts.has(key) && attempts.size >= 10_000) return false;
  item.count += 1;
  attempts.set(key, item);
  return item.count <= 5;
}

function hasReviewAccess(request: Request, env: Env): boolean {
  const token = env.REVIEW_ACCESS_TOKEN;
  if (!token) return false;
  return request.headers.get("cookie")?.split(";").some((part) => part.trim() === `oni_review_access=${token}`) ?? false;
}

function privateAsset(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "private, no-store");
  headers.set("Vary", "Cookie");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.toUpperCase() === "/BASSLIQUID" || url.pathname.toUpperCase().startsWith("/BASSLIQUID/")) {
      return new Response("This tool has been removed.", { status: 410, headers: { "Cache-Control": "no-store" } });
    }

    if (url.hostname === "www.13thoni.com") {
      url.hostname = "13thoni.com";
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === "/api/review-unlock") {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
      const reviewPin = env.REVIEW_PIN;
      const accessToken = env.REVIEW_ACCESS_TOKEN;
      if (!reviewPin || !accessToken) return new Response("Review access is temporarily unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
      const origin = request.headers.get("origin");
      if (origin && origin !== url.origin) return new Response("Forbidden", { status: 403 });
      if (!(await allowAttempt(request, env))) return new Response("Please wait before trying again", { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } });
      if (Number(request.headers.get("content-length")) > 1024) return new Response("Request too large", { status: 413 });
      let pin = "";
      try { pin = String((await request.json() as { pin?: unknown }).pin ?? ""); } catch { return new Response("Invalid request", { status: 400 }); }
      if (pin !== reviewPin) return new Response("Incorrect PIN", { status: 401, headers: { "Cache-Control": "no-store" } });
      return new Response(null, { status: 204, headers: { "Set-Cookie": `oni_review_access=${accessToken}; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=Lax`, "Cache-Control": "no-store" } });
    }

    if (protectedPath(url.pathname)) {
      if (!hasReviewAccess(request, env)) return new Response("Review access required", { status: 401, headers: { "Cache-Control": "no-store" } });
      return privateAsset(await env.ASSETS.fetch(request));
    }

    if (url.pathname === "/MOTTLE") {
      url.pathname = "/MOTTLE/";
      return Response.redirect(url.toString(), 308);
    }

    if (url.pathname === "/MOTTLE/") {
      return env.ASSETS.fetch(request);
    }

    if (url.pathname === "/PIXEL-FORGE") {
      url.pathname = "/PIXEL-FORGE/";
      return Response.redirect(url.toString(), 308);
    }

    if (url.pathname === "/PIXEL-FORGE/") {
      return env.ASSETS.fetch(request);
    }

    if (url.pathname === "/GLYPHSHIFT") {
      url.pathname = "/GLYPHSHIFT/";
      return Response.redirect(url.toString(), 308);
    }

    if (url.pathname === "/GLYPHSHIFT/") {
      return env.ASSETS.fetch(request);
    }

    for (const app of ["FORMATKILLER", "RHYTHMGRID", "LOOPFORGE"]) {
      if (url.pathname === `/${app}`) {
        url.pathname = `/${app}/`;
        return Response.redirect(url.toString(), 308);
      }

      if (url.pathname === `/${app}/`) {
        return env.ASSETS.fetch(request);
      }
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        // Private media is served directly with no-store, never through the public image cache.
        fetchAsset: (path) => protectedPath(path)
          ? Promise.resolve(new Response("Not found", { status: 404 }))
          : env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    if ((request.method === "GET" || request.method === "HEAD") && url.pathname !== "/" && !url.pathname.startsWith("/r/")) {
      const asset = await env.ASSETS.fetch(request);
      if (asset.status !== 404) return asset;
    }
    return handler.fetch(request, env, ctx);
  },
};

export default worker;
