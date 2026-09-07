# Reliability repairs — September 2026

Bassliquid has been retired (HTTP 410) and removed from shipped assets. Six remaining tools retain their existing appearance and primary workflows.

Private review assets now run through Worker authorization before static delivery. Private images never enter the public optimizer cache. Configure REVIEW_PIN and REVIEW_ACCESS_TOKEN as production secrets; no fallback credentials are accepted. The review UI uses an eight-digit code, handles connection failures, restores authorized sessions, and manages dialog focus. The code formerly present in source has been retired. Native Cloudflare rate limiting is configured, with a bounded in-memory fallback for runtimes without that binding.

Repairs include transactional project/source imports, validated stored settings, truthful settings-only Mottle recovery, clean full-quality exports, bounded media decoding, Glyphshift manual-text history/recording cleanup, Formatkiller paused-frame preservation, Rhythmgrid batch/audio errors and consistent BPM, and Loopforge project validation. Existing unrelated artwork and source changes were preserved.

Validation: npm test (route/security/tool regression suites), npm run typecheck, npm run lint. Native hosting checks must also verify public tools/assets load, anonymous review assets return401, and retired Bassliquid routes return410; direct Worker mocks alone cannot detect static-routing regressions. Current runtime-only dependency audit is clean. Native desktop applications have independent release/test workflows.
