# Phase 0.5 — Security Transport · Acceptance Checklist

```text
PHASE: 0.5 — Security Transport (parallel track)   DATE: ____________
BRANCH: none (infrastructure)                      ROLLBACK: DNS/proxy revert
```

---

## Build status

- [ ] `npm run typecheck` passes — **result identical to Phase `01_` baseline**
- [ ] `npm run build` passes — **result identical to Phase `01_` baseline**
- [ ] `git diff --stat` confirms **zero repository files changed**

> Under Option A this phase changes no code. A non-empty diff means something
> went wrong — investigate before proceeding.

## Tests

- [ ] Existing `npm test` still passes
- [ ] Smoke suite (if built in Phase `01_`) still passes

## Functional verification

- [ ] Directus reachable over `https://` with a valid certificate
      — issuer: ____________ expiry: ____________
- [ ] Reviewer login succeeds over TLS
- [ ] Token refresh succeeds
- [ ] Logout succeeds
- [ ] **A reviewer edit saves successfully (round-trip verified)**
      — note: this had never been verified live before this program
- [ ] All 7 routes load with no mixed-content warnings
- [ ] Public pages render unchanged

## Security verification

- [ ] Browser network capture shows **no plaintext credential transmission**
- [ ] No `http://` Directus reference remains reachable from the client
- [ ] `localStorage` token-storage risk assessed
      — decision: accept ☐ / follow-up scheduled ☐ — recorded in `logs/decisions.md`
- [ ] Directus public-role permissions reviewed
      — with the explicit note that they do **not** enforce the public site
        boundary while `DIRECTUS_TOKEN` is in use

## Performance verification

- [ ] Route timings unchanged or improved vs. Phase `01_` baseline
      (TLS adds a handshake; confirm it is not material)

---

## Rollback trigger

Reviewer login breaks, or any route fails to load → revert DNS/proxy and restore
the previous `NEXT_PUBLIC_DIRECTUS_URL`. **No application risk** — the frontend
was never modified.

---

```text
CLAUDE RECOMMENDED VERDICT: ______________________
OWNER VERDICT: PASS / PASS WITH CONDITIONS / FAIL / DEFER
CONDITIONS (if any): _______________________________
OWNER SIGNATURE / DATE: ____________________________
```
