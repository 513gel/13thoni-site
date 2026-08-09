# 13th Oni External Terminal

A one-screen fictional corporate terminal for 13thoni.com. It presents a short session-only boot sequence, the approved Oni emblem, and four intentionally locked interface targets.

The boot sequence is skipped after it has played once in the current browser session. Visitors can also skip it manually, and reduced-motion visitors bypass it automatically.

## Editing the interface

- Boot messages and target labels are defined near the top of `app/page.tsx`.
- Timing and visual treatment are defined in `app/globals.css`.
- The production domain and social metadata are defined in `app/layout.tsx`.
- The core brand asset is `public/brand/oni-emblem.png`.

See `DEPLOY.md` for the complete GitHub, Cloudflare Pages, and Squarespace-domain process.
