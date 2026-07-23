# Phase 0.5 — Security Transport · Report

**Status:** ⬜ Not started
**Completed:** ____________
**Track:** Parallel — no repository branch

---

## 1. Completed work

_To be filled._

Approach taken: ☐ A — TLS on Directus ☐ B — Server-side proxy ☐ C — Both

---

## 2. Changed files

| Type | Files |
|---|---|
| Modified | _expected: **none** under Option A_ |
| Added | |
| Deleted | |
| Dependency changes | _expected: none_ |
| Configuration changes | _environment variables, owner-performed_ |
| Database changes | _expected: none_ |

`git diff --stat`:

```
```

> A non-empty diff under Option A is a red flag. Investigate before proceeding.

---

## 3. Infrastructure changes (owner-performed)

| Item | Before | After |
|---|---|---|
| Directus origin | `http://47.86.26.168:8055` | |
| Certificate issuer | none | |
| Certificate expiry | n/a | |
| Reverse proxy | none | |
| `NEXT_PUBLIC_DIRECTUS_URL` | plaintext HTTP, bare IP | |
| `DIRECTUS_URL` | plaintext HTTP, bare IP | |

---

## 4. Verification evidence

### Login trace
- Auth request scheme: ____________
- Credential visible in plaintext: ☐ yes ☐ no
- Token refresh: ☐ pass ☐ fail
- Logout: ☐ pass ☐ fail
- **Reviewer edit round-trip: ☐ pass ☐ fail**
  _(first live verification in the project's history — record the result carefully)_

### Mixed content
| Route | Warnings |
|---|---|
| `/` | |
| `/search` | |
| school detail | |
| program detail | |
| `/login` | |

### Application reference audit
| File | Reads | Plaintext hardcoded? |
|---|---|---|
| `lib/directus-auth.tsx:44` | `NEXT_PUBLIC_DIRECTUS_URL` | |
| `lib/pilot-data.ts:108` | `DIRECTUS_URL ?? NEXT_PUBLIC_DIRECTUS_URL` | |
| `lib/data.ts:153` | `DIRECTUS_URL` | |

---

## 5. Metrics before / after

| Metric | Before | After | Note |
|---|---|---|---|
| Credential transport | plaintext HTTP | | |
| Token storage | `localStorage` | | risk decision recorded? |
| Route timings vs. baseline | | | TLS handshake should not be material |
| Build output | baseline | | must be identical |

---

## 6. Residual risk

- `localStorage` token storage — decision: ____________
- Directus public-role permissions — reviewed? ____________
  (Record explicitly that they do **not** enforce the public site boundary
  while `DIRECTUS_TOKEN` is in use.)

---

## 7. Remaining issues

_To be filled._
