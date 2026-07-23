# Phase 0.5 — Security Transport · Codex Execution

**Status:** ⬜ Not started

---

## ⚠️ This phase is primarily NOT a Codex phase

Under the recommended approach (Option A — TLS in front of Directus), the work
is **infrastructure performed by the human owner**: domain, certificate,
reverse proxy, environment variables.

**Codex does not:**
- Provision certificates
- Configure DNS or reverse proxies
- Access the Directus host
- Edit `.env.local` or any environment file
- Change production configuration

Those are owner actions. Codex's role here is **verification only**.

---

## Files Codex MAY change

| Path | Permitted action |
|---|---|
| `improve_s/02_phase_0_5_security_transport/report.md` | Write |
| `improve_s/logs/execution_log.md` | Append |

## Files Codex MUST NOT change

- Anything under `app/`, `components/`, `lib/`, `data/`
- `.env*` — **owner performs environment changes**
- Any configuration file
- Any Directus setting

---

## Verification batch (after the owner completes the infrastructure work)

### 1. Origin check

Confirm the Directus origin now resolves over HTTPS with a valid certificate.
Record the certificate issuer and expiry in `report.md`.

### 2. Application reference audit

Confirm exactly which files read the Directus origin, and that none hardcode a
plaintext URL:

- `lib/directus-auth.tsx:44` — `NEXT_PUBLIC_DIRECTUS_URL`
- `lib/pilot-data.ts:108` — `DIRECTUS_URL ?? NEXT_PUBLIC_DIRECTUS_URL`
- `lib/data.ts:153` — `DIRECTUS_URL`

Report any additional reference found. **Do not modify them.**

### 3. Login verification

With the owner present and using the reviewer test account, capture a browser
network trace of a full login. Confirm in `report.md`:

- [ ] The auth request goes to `https://`
- [ ] No credential appears in any plaintext request
- [ ] Token refresh works
- [ ] Logout works
- [ ] A reviewer edit still saves (round-trip)

### 4. Mixed-content check

Load every public route and confirm no mixed-content warnings in the console.

### 5. Build sanity

```bash
npm run typecheck
```

```bash
npm run build
```

Expected: unchanged from the Phase `01_` baseline, since no application code
was modified.

---

## Stop conditions

Halt and report if: reviewer login fails after the transport change; any
plaintext credential is still observable; mixed-content warnings appear; or the
build result differs from the Phase `01_` baseline (which would mean something
was changed that should not have been).

---

## Required report fields

Certificate details · files audited · login trace result · mixed-content result ·
build and typecheck results · **confirmation that zero repository files were
modified** · remaining issues.
