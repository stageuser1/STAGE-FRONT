# Reviewer authentication: current posture and Directus config review

**Status:** documentation only. Nothing in this file has been implemented as a
code change; it records what the reviewer auth path does today (remediation
phase R2) so the Directus administrator can complete the server-side half of
the review, and so the accepted risks are written down rather than assumed.

Audit references: P1-1 (reviewer credentials exposed to browser storage),
P1-2 (no security-header policy — the header half landed in R2).

Implementation under review: [`lib/directus-auth.tsx`](../../lib/directus-auth.tsx).

## 1. Where the tokens live

The reviewer session is held in `localStorage` under the key
`stage.directus.reviewer-session`, as plaintext JSON:

```json
{ "accessToken": "...", "refreshToken": "...", "expiresAt": 1234567890 }
```

Consequences of that choice, stated plainly:

- **Readable by any script on the origin.** `localStorage` is not partitioned
  from JavaScript. Any successful XSS, any compromised or over-permissioned
  dependency that runs in the page, and any browser extension with content
  script access to the origin can read both tokens.
- **The refresh token is the valuable one.** It is long-lived relative to the
  access token, and `POST /auth/refresh` accepts it from anywhere — there is
  no device or origin binding. Exfiltrating it grants a rolling session that
  survives the victim closing the tab.
- **Persistent across restarts.** Unlike `sessionStorage`, the session
  survives browser restarts until it expires or the reviewer logs out.
- **Not sent automatically, which is the one upside.** Because the token is
  attached explicitly as an `Authorization: Bearer` header rather than
  travelling as a cookie, the reviewer surface is not exposed to CSRF.

`mode: "json"` is passed on login, refresh, and logout, which is what makes
Directus return the refresh token in the body rather than setting an
`HttpOnly` cookie. That is a deliberate consequence of the browser talking to
Directus cross-origin; it is also precisely what puts the token in reach of
scripts.

**Not changed in R2.** Moving tokens out of `localStorage` means either an
`HttpOnly` cookie session on a same-site Directus origin, or a
backend-for-frontend that proxies reviewer writes and keeps tokens server-side.
Both are auth redesigns, and the remediation plan defers them with a written
risk acceptance rather than attempting them under a hygiene phase.

## 2. What the frontend role check does and does not guarantee

After login and on session restore, `fetchUser()` calls
`GET /users/me?fields=id,email,role.id,role.name` and rejects the session
unless `role.name` lowercases to `reviewer` or `administrator`. `isReviewer`
is then simply `user !== null`, and components such as `ReviewerHeaderLink`,
`MobileBottomNav`, and `SchoolProfileCard` branch on it.

**What it guarantees:** that the person holding this session presented valid
Directus credentials, and that at the moment of the check Directus reported a
role named `reviewer` or `administrator`.

**What it does not guarantee — this is the important half:**

- It is **not an authorization boundary.** It runs in the browser, on data the
  browser received. A user with any valid Directus account can make
  `isReviewer` true locally by editing the response, the stored session, or
  the React state in devtools. Doing so reveals the reviewer UI.
- **Revealing the UI is not the risk; the write succeeding is.** Every reviewer
  edit is a direct `PATCH /items/<collection>/<id>` from the browser to
  Directus, carrying the user's own token. Whether it is permitted is decided
  entirely by **Directus role permissions**, not by anything in this codebase.
  A forged `isReviewer` yields buttons that fail with 403 — *provided the
  Directus role is actually least-privilege.* If the role over-grants, the
  frontend check was never the thing protecting the data.
- It is **matched on role name, not role ID.** `role.id` is fetched but unused
  for the decision. Renaming a Directus role to `Reviewer`, or creating a new
  unrelated role with that name, silently grants access to the reviewer UI.
- It is **checked once per session restore, not per write.** Removing someone's
  reviewer role does not invalidate an access token they already hold; they
  keep frontend reviewer state until their token expires and the next
  `fetchUser()` fails. The real revocation is the Directus permission change,
  which takes effect on the next request.
- **`administrator` is accepted by name.** Any role whose name lowercases to
  `administrator` passes, whatever its actual permissions.

The single sentence to carry away: **the frontend decides what to render;
Directus decides what is allowed.** Only the second one is security.

## 3. Collections the reviewer surface writes

Concretely, so the role can be scoped to exactly these. Reviewer writes are
`PATCH /items/<collection>/<id>` only — no creates, no deletes, no schema
access.

| Collection | Written from | Fields touched |
| --- | --- | --- |
| `schools` | `components/reviewer/SchoolProfileCard.tsx` | `school_name`, `country`, `city`, `official_website`, `review_status` |
| `program_offerings` | `components/pilot/PilotReviewerPanel.tsx` | per `PROGRAM_FIELDS`, plus `review_status` |
| `application_requirements` | `components/pilot/PilotReviewerPanel.tsx` | per `APPLICATION_FIELDS`, plus `review_status` |
| `audition_requirements` | `components/pilot/PilotReviewerPanel.tsx` | per `AUDITION_FIELDS`, plus `review_status` |

`source_records` appears in the cache-invalidation allowlist
(`REVALIDATABLE_COLLECTIONS` in `lib/directus/client.ts`) but is **not**
written by the reviewer UI; it needs read access only.

Reads additionally cover the same collections plus `/users/me`. The
optimistic-concurrency check (`assertUnchanged`) re-reads the target record
before saving, so read access on the written collections is required, not
optional.

## 4. Checklist for the Directus administrator

This is the half that actually enforces the boundary. Each item is a check to
perform in the Directus admin against the live instance, recording the result.

### 4.1 Least-privilege reviewer role

- [ ] A dedicated `reviewer` role exists and is **not** an administrator role
      (`admin_access` off, `app_access` on only if reviewers use the Directus
      admin UI directly — if they only use STAGE FRONT, leave it off).
- [ ] **Update** permission granted on exactly the four collections in §3, and
      no others.
- [ ] Update permission is **field-scoped** to the fields listed in §3 plus
      `review_status`. Directus permits per-field allowlists; use them, so a
      forged request cannot rewrite a field the UI never exposes.
- [ ] **Create** and **Delete** are denied on every collection. The reviewer UI
      issues neither.
- [ ] **Read** permission covers only the collections the public/reviewer
      surfaces need (the four above plus `source_records`), and excludes
      `directus_users` beyond the role's own record.
- [ ] The role cannot read or write `directus_users`, `directus_roles`,
      `directus_permissions`, `directus_files`, or `directus_settings`. A
      reviewer who can edit permissions is an administrator.
- [ ] Confirm the role name is exactly `reviewer` (or `administrator` for
      admins) — the frontend matches on the lowercased name, so a mismatch
      locks reviewers out of the UI even when Directus would permit the write.
- [ ] Verify by negative test: authenticate as a reviewer and attempt a
      `DELETE /items/schools/<id>` and a `PATCH` of a field outside the
      allowlist. Both must return 403.

### 4.2 CORS origins

- [ ] `CORS_ENABLED` is `true` and `CORS_ORIGIN` is an **explicit list of
      STAGE FRONT origins** — never `true` and never `*`. A wildcard lets any
      site script the reviewer's Directus session from the victim's browser.
- [ ] The list contains the production origin, and staging/preview origins only
      if reviewers genuinely use them. Remove `localhost` entries from the
      production instance.
- [ ] `CORS_CREDENTIALS` matches the token model. The app sends bearer headers
      and no cookies, so it should be `false` unless a cookie session is
      introduced later.
- [ ] `CORS_ALLOWED_HEADERS` includes `Authorization` and `Content-Type`, and
      `CORS_ALLOWED_METHODS` is limited to `GET, POST, PATCH, OPTIONS` —
      `DELETE` is not used by this app.

### 4.3 Token lifetime and exposure

- [ ] `ACCESS_TOKEN_TTL` is short — 15 minutes or less. The client already
      refreshes transparently 30 seconds before expiry and retries once on a
      401, so a short TTL costs nothing in usability and directly caps the
      value of a stolen access token.
- [ ] `REFRESH_TOKEN_TTL` is measured in days, not weeks or months. This is the
      single most effective mitigation available without an auth redesign: it
      is the bound on how long an exfiltrated `localStorage` payload stays
      useful. A working day (`1d`) is defensible for a reviewer workflow.
- [ ] `REFRESH_TOKEN_ROTATION` (Directus rotates refresh tokens on use) is
      enabled if available on the deployed version — it turns a stolen refresh
      token into a detectable conflict rather than a silent parallel session.
- [ ] Rate limiting is enabled (`RATE_LIMITER_ENABLED`) so `/auth/login` is not
      an unthrottled password oracle.
- [ ] `PASSWORD_RESET_URL_ALLOW_LIST` and `USER_INVITE_URL_ALLOW_LIST` are set
      to STAGE FRONT origins only, so reset flows cannot be redirected.
- [ ] Confirm no **static API token** is provisioned on any reviewer user
      (Directus static tokens do not expire; a leaked one is permanent).
- [ ] Directus is served over HTTPS only. The tokens are bearer credentials in
      request headers; on plaintext HTTP the review above is moot.

### 4.4 Server-side reads

- [ ] The token STAGE FRONT's **server** uses for public reads
      (`DIRECTUS_TOKEN` / equivalent) belongs to a **read-only** role, distinct
      from the reviewer role. It is a server-side secret and must never appear
      in a `NEXT_PUBLIC_*` variable.
- [ ] `NEXT_PUBLIC_DIRECTUS_URL` is the only Directus value exposed to the
      browser. Confirm no token has been added alongside it — anything
      `NEXT_PUBLIC_` is compiled into the client bundle and is public.

## 5. Accepted risks after R2

Recorded here so they are decisions rather than oversights. Fable signs these,
not the implementer.

1. **Reviewer tokens remain in `localStorage`**, readable by any script on the
   origin. Mitigated only by keeping token lifetimes short (§4.3) and by
   Directus-side least privilege (§4.1) bounding what a stolen token can do.
   The durable fix is an `HttpOnly` cookie session or a server-side proxy for
   reviewer writes; both are auth redesigns, deferred.
2. **No Content-Security-Policy is deployed.** R2 landed HSTS, nosniff,
   `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, and `Permissions-Policy`,
   but deliberately no CSP: the vendored IELTS runner under `public/ielts/` is
   an IIFE bundle that registers exam data through globals inside a same-origin
   iframe, and any useful policy has to be tested against that runtime first.
   This is the mitigation that would most reduce risk 1, so it should be
   scheduled rather than dropped.
3. **The frontend role check is cosmetic** and is documented as such in §2. It
   is acceptable *only* while §4.1 holds; the checklist is therefore a
   precondition of this acceptance, not a nice-to-have.
