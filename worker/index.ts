/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  REVIEW_PIN?: string;
  REVIEW_ACCESS_TOKEN?: string;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

const REVIEW_MEDIA_PREFIX = "/review-drop/media/";
const REVIEW_MANIFEST_PATH = "/review-drop/manifest.json";

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

    if (url.hostname === "www.13thoni.com") {
      url.hostname = "13thoni.com";
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === "/api/review-unlock") {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
      if (!env.REVIEW_PIN || !env.REVIEW_ACCESS_TOKEN) return new Response("Review access is not configured", { status: 503 });
      let pin = "";
      try { pin = String((await request.json() as { pin?: unknown }).pin ?? ""); } catch { return new Response("Invalid request", { status: 400 }); }
      if (pin !== env.REVIEW_PIN) return new Response("Incorrect PIN", { status: 401, headers: { "Cache-Control": "no-store" } });
      return new Response(null, { status: 204, headers: { "Set-Cookie": `oni_review_access=${env.REVIEW_ACCESS_TOKEN}; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=Lax`, "Cache-Control": "no-store" } });
    }

    if (url.pathname === REVIEW_MANIFEST_PATH || url.pathname.startsWith(REVIEW_MEDIA_PREFIX)) {
      if (!hasReviewAccess(request, env)) return new Response("Review access required", { status: 401, headers: { "Cache-Control": "no-store" } });
      return privateAsset(await env.ASSETS.fetch(request));
    }

    if (url.pathname === "/MOTTLE") {
      url.pathname = "/MOTTLE/";
      return Response.redirect(url.toString(), 308);
    }

    if (url.pathname === "/MOTTLE/") {
      url.pathname = "/MOTTLE/index.html";
      return env.ASSETS.fetch(new Request(url, request));
    }

    if (url.pathname === "/PIXEL-FORGE") {
      url.pathname = "/PIXEL-FORGE/";
      return Response.redirect(url.toString(), 308);
    }

    if (url.pathname === "/PIXEL-FORGE/") {
      url.pathname = "/PIXEL-FORGE/index.html";
      return env.ASSETS.fetch(new Request(url, request));
    }

    if (url.pathname === "/GLYPHSHIFT") {
      url.pathname = "/GLYPHSHIFT/";
      return Response.redirect(url.toString(), 308);
    }

    if (url.pathname === "/GLYPHSHIFT/") {
      url.pathname = "/GLYPHSHIFT/index.html";
      return env.ASSETS.fetch(new Request(url, request));
    }

    for (const app of ["FORMATKILLER", "RHYTHMGRID", "BASSLIQUID", "LOOPFORGE"]) {
      if (url.pathname === `/${app}`) {
        url.pathname = `/${app}/`;
        return Response.redirect(url.toString(), 308);
      }

      if (url.pathname === `/${app}/`) {
        url.pathname = `/${app}/index.html`;
        return env.ASSETS.fetch(new Request(url, request));
      }
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
