# Final test results

Final run: 2026-07-20 (Asia/Shanghai), branch `pilot/reduced-data-model`.

| Check | Command | Result |
|---|---|---|
| Validator unit suite | `npm run test:validator` | PASS — 2 test methods; passing package plus 23 hard-failure fixtures |
| Importer unit suite | `npm run test:importer` | PASS — 7/7 tests, 0 failures |
| Combined unit suite | `npm test` | PASS |
| TypeScript | `npm run typecheck` | PASS — zero errors |
| Production build | `npm run build` | PASS — Next.js 15.5.20 compiled and generated all routes |
| Pilot package | `python scripts/validate_package.py data/pilot/manhattan_school_of_music.json --json-report docs/pilot/validation_report.json --text-report docs/pilot/validation_report.txt` | PASS — 12 programs; 0 hard failures |
| Patch hygiene | `git diff --check` | PASS — no whitespace errors |

Importer coverage includes natural-key upsert, unchanged rerun idempotency, byte-identical Verified protection with one conflict, all four cycle-current branches, and byte-for-byte dry-run determinism.

Validator coverage includes invalid JSON; schema/envelope/required fields; vocabulary resolution; orphan requirements and sources; enums; dates/cycles; numeric and currency constraints; program/requirement/source duplicates; application and audition current-row counts; prescreen deadline rules; source support; TOEFL/IELTS ranges; and prohibited Directus IDs.

The package validator's expected non-failing output is retained in `validation_report.txt` and `validation_report.json`: all operational decision fields are complete, while teaching language is explicitly null for all 12 programs and three DMA durations are null because the official sources did not state them without inference.
