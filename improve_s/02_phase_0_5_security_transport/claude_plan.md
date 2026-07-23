# Phase 0.5 — Security Transport · Claude Plan

**Status:** ⬜ Not started
**Branch:** none — infrastructure work, **touches no repository files**
**Recommended execution position:** **PARALLEL from day 1**

---

## Why this phase exists

It was **not in the original program**. The V2 repository review found a
higher-severity issue than anything in the field-classification phase:

> `NEXT_PUBLIC_DIRECTUS_URL` is a bare-IP `http://` origin
> (`http://47.86.26.168:8055`). `lib/directus-auth.tsx:147` POSTs
> `{email, password}` from the browser over **unencrypted HTTP**. Access and
> refresh tokens are persisted in `localStorage` (`lib/directus-auth.tsx:64`).

Reviewer credentials and session tokens travel in clear text today.

This is **infrastructure, not field classification**. It must not be folded
into Phase `03_`, and Phase `03_` should not be signed off while it stands.

---

## Objective

Reviewer authentication and all browser→Directus traffic travel over TLS.
Session tokens are no longer trivially exfiltrable.

---

## Scope

### In scope
- TLS termination in front of Directus, **or** a server-side proxy so the
  browser never contacts `47.86.26.168:8055` directly
- Updating `NEXT_PUBLIC_DIRECTUS_URL` to the secure origin (owner-performed
  environment change)
- Assessment of moving tokens out of `localStorage`

### Out of scope
- **Hosting migration.** Vercel → Alibaba Cloud remains a separate compliance
  and infrastructure decision and is not part of this program.
- Directus schema or permission changes
- Any frontend feature change

---

## Why it runs in parallel

This phase touches **no repository files**. It can proceed alongside Phases
`01_` and `04_` without merge conflicts, and it is off the critical path for
*performance* while being on the critical path for any *security sign-off*.

It is also the **largest schedule risk in the program** — certificate issuance,
reverse-proxy setup on the Alibaba host, and possible compliance review are all
outside the repository and outside AI execution.

---

## Approach options (owner decides)

| Option | Description | Trade-off |
|---|---|---|
| **A — TLS on Directus** | Domain + certificate + reverse proxy (Caddy/nginx) in front of Directus | Cleanest. Requires a domain and host access. |
| **B — Server-side proxy** | Next.js Route Handler proxies reviewer auth; browser never sees Directus directly | Keeps `NEXT_PUBLIC_DIRECTUS_URL` off the client entirely, but adds application code and a request hop — and there are currently **no Route Handlers in the app** |
| **C — Both** | Proxy now, TLS when the domain lands | Highest effort |

**Recommendation: Option A.** It solves the transport problem without adding
application code during a performance program, and it keeps this phase truly
parallel (zero repository files touched).

---

## Files involved

**None in the repository**, under Option A.

Environment change (owner-performed, not Codex):
- `.env.local` → `NEXT_PUBLIC_DIRECTUS_URL`, `DIRECTUS_URL`

If Option B is chosen, this phase stops being parallel and must be re-planned
with a proper file allowlist.

---

## Risks

| Risk | P | I | Detect | Mitigation |
|---|---|---|---|---|
| Certificate / domain / compliance friction on a China-hosted server | High | Medium | Easy | Start day 1 in parallel; it has the longest lead time |
| TLS change breaks reviewer login | Medium | High | Easy | Verify login end-to-end before switching the env var |
| Mixed-content errors after switching | Medium | Medium | Easy | Confirm every Directus reference uses the new origin |
| Frontend hardcodes an assumption about the origin | Low | Medium | Easy | Only `lib/directus-auth.tsx:44` and `lib/pilot-data.ts:108` read the env vars |

---

## Rollback plan

Revert DNS / proxy configuration and restore the previous
`NEXT_PUBLIC_DIRECTUS_URL`. **The frontend is untouched**, so rollback carries
no application risk.

---

## Acceptance criteria

- [ ] Directus reachable over `https://` with a valid certificate
- [ ] Reviewer login verified working end-to-end over TLS
- [ ] No plaintext credential transmission observable in a browser network capture
- [ ] No mixed-content warnings on any route
- [ ] `localStorage` token-storage risk assessed; decision recorded (accept,
      or schedule a follow-up)
- [ ] **No repository file changed** (under Option A)

---

## Claude review verdict

_To be completed at the gate._
