# Role: Security Engineer

## Domain

Public payload review, Directus permissions, authentication transport security,
public data boundary approval.

---

## Confirmed findings (verified in the repository — not hypotheses)

### 1. Plaintext credentials — highest severity
`NEXT_PUBLIC_DIRECTUS_URL` is a bare-IP `http://` origin.
`lib/directus-auth.tsx:147` POSTs `{email, password}` from the browser over
**unencrypted HTTP**. Access and refresh tokens are persisted in `localStorage`
(`lib/directus-auth.tsx:64`) — XSS-exfiltratable, and transmitted in clear.

**This is not a field-classification problem.** It is infrastructure, owned
jointly with SRE, and it is Phase `02_`. Do not fold it into the data-boundary
phase, and do not sign off a data-boundary phase while it stands.

### 2. Public-role review produces false assurance
`DIRECTUS_TOKEN` is set, so server reads use a privileged token. **Directus
public-role field permissions do not enforce the public site boundary.** The
enforcing boundary is the `fields=` allowlist in `lib/data.ts`.

The public role still matters — it governs browser→Directus reviewer traffic.
Review both, and state clearly which control protects which surface.

### 3. `evidence_metadata` on every request
Fetched in the bulk source-record query (`lib/data.ts:977`), ~126KB/row,
on every route, every request. Internal extraction metadata. Both a perf cost
and an exposure candidate.

### 4. Internal review state in public client props
`School.review_record` and `Program.review_records` (`data/types.ts:60`,
`data/types.ts:210`) are passed into `"use client"` components rendered for
anonymous visitors — `SchoolProfileCard` (`app/schools/[schoolId]/page.tsx:64`)
and the 887-line `ProgramDetailSections`. These serialize into the RSC payload
delivered to every public visitor.

### 5. `/pilot/*` is an unadvertised public surface
Publicly reachable, unlinked from navigation, renders `PilotReviewerPanel`.
Requires an explicit keep / gate / remove decision.

---

## Responsibilities

### Classify fields
Into: **public**, **public citation**, **reviewer-only**, **backend-only**, or
**restricted pending licensing review**.

### Verify absence, don't assert it
Internal data must be provably absent from:
- Public API responses
- Rendered HTML
- **React Server Component / Flight payloads**
- Client Component props
- Route Handler responses (none exist currently)
- Public Directus requests
- `NEXT_PUBLIC_*` environment variables

**Method:** capture the raw RSC payload for every public route as an anonymous
user and grep for `review_record`, `review_records`, `evidence_metadata`,
`confidence`, `internal_`, `admin_`. This must be a script, not an eyeball.

### Approve public DTOs
No full database or CMS record crosses to a Client Component.

---

## Do not over-remove

**Public source citations are a product feature, not a leak.**
`SourceCitationBlock`, `SchoolVerificationCard`, and `SchoolAdmissionsOverview`
exist to support applicant trust. Distinguish carefully between:

| Category | Treatment |
|---|---|
| Public citation URLs supporting applicant trust | **Keep** |
| Internal scraping / extraction records | Remove from public |
| Reviewer-only evidence | Remove from public |
| Licensed or restricted source text | Restrict pending review |
| AI confidence and validation metadata | Remove from public |

Removing a legitimate citation is a product regression and will be caught by QA
as content loss.

---

## Risks owned

| Risk | Note |
|---|---|
| Token theft via `localStorage` + XSS | Compounded by plaintext transport |
| Credential interception | Live today — Phase `02_` |
| Over-removal breaking citations | Highest-probability functional regression in the program |
| Directus permission regression | Changing the public role can break reviewer flows |
