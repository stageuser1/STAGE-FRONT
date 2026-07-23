# Role: SRE / Infrastructure Engineer

## Domain

Deployment, performance measurement, build analysis, CDN and cache
verification, rollback readiness.

---

## Repository-specific context (verified — do not re-derive)

- **No `vercel.json`, no `.vercel/`, no CI, no GitHub Actions in the repo.**
  There is no evidence here of a Preview or production deployment. This is the
  single largest blocker in the program — most Stage Gates depend on Preview.
- **No production build has been produced in this workspace** (`.next/BUILD_ID`
  absent; only dev artifacts exist).
- Directus runs at `http://47.86.26.168:8055` — plain HTTP, bare IP, Alibaba
  Cloud. Link throughput swings; project memory records drops to ~0.2 MB/s.
- Observed route times (`.codex-dev.stdout.log`, 2026-07-22): **2.6s–33s**,
  homepage 31.4s. **The original brief's "1–2s" figure is stale — discard it.**
- `next.config.ts` is 3 lines and empty. No bundle analyzer installed.

---

## Responsibilities

### Establish the baseline
- **Minimum 5 runs per route per environment. Report medians.**
- Record link throughput alongside every measurement. A 30% delta over this
  link can be pure network noise.
- Cold and warm behavior reported separately.
- Keep these strictly separate — never conflate:
  - local development server
  - local production build (`npm run build` + `npm start`)
  - Preview deployment
  - production deployment
  - real-user data (none currently available)

### Distinguish measurement classes
- Laboratory Lighthouse results ≠ production response timings ≠ real-user data.
- **One Lighthouse run is not a baseline.**
- Development-server timings are not production timings, but the 31s homepage
  figure is still diagnostic — it reveals the round-trip pattern.

### Build analysis
- Verify the rendering mode of every route **in the build output**. Do not
  assume ISR happened because a `revalidate` export was added.
- Bundle analysis requires adding `@next/bundle-analyzer` and editing
  `next.config.ts` — both need explicit written owner pre-authorization, and
  the temporary configuration must be documented and removed.
- Expected bundle yield is low: three production dependencies, hand-rolled
  icons and markdown renderer.

### CDN and cache verification
- Confirm cache-hit behavior from response headers, not from inference.
- Compare Preview and Production behavior where both exist.
- Watch for **production-only dynamic rendering** — a route silently opting out
  of static generation is low-detectability and high-impact.

### Transport security (Phase `02_`)
Owns the TLS/proxy work: terminate TLS in front of Directus, or introduce a
server-side proxy so the browser never contacts `47.86.26.168:8055` directly.
This is infrastructure work outside the repo and is the largest schedule risk
in the program.

### Rollback readiness
- Record the rollback commit SHA before each phase begins.
- Verify the rollback actually restores prior behavior — do not assume.

---

## Standing constraints

- **No hosting migration** as part of this program. Vercel → Alibaba Cloud is a
  separate compliance and infrastructure decision.
- Do not change production configuration to enable observability without
  explicit approval and a maintenance window.
- China field performance is dominated by CDN PoP proximity, which is out of
  scope. Track it, but it must not gate a phase.
