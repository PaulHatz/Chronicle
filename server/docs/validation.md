# Request validation

Every current API route runs `validateRequest` before its business handler. Protected routes still authenticate and authorize first; session lookups are the only database work allowed before schema validation. Validation does not replace authorization or database-dependent business rules.

Schemas live in `src/validation/schemas.ts` and use Zod. Unknown body fields, unknown query parameters, incorrect types and non-object bodies are rejected. No current endpoint supports query parameters. Add an explicit query schema when introducing filters or pagination.

- IDs must be canonical positive decimal strings within PostgreSQL Int range; JSON IDs must be numbers, not numeric strings.
- Text fields have explicit length limits. Names and prose are trimmed; passwords are never trimmed. Emails are normalized to lowercase.
- Date-only values must be real calendar dates in YYYY-MM-DD format, with year 0001 or later.
- Empty patches are rejected. Employee PATCH retains the existing full-profile contract.
- Employee optional empty email/phone values become null, avoiding unique collisions on empty email strings.
- Roles, statuses, languages, note types and warning types use allowlists. Theme is a boolean.
- Questions validate score types/ranges and rubric structure. Evaluation submissions permit at most 500 answers, each with bounded text and integer/null scores; duplicate question IDs are rejected.
- Limits: names/positions 100 characters; titles/template names 200; version 50; email 254; phone 50; prose/questions/answers 10,000; password 256; department evaluation frequency 1–36,500 days.
- JSON bodies are limited to 100 KB. Non-JSON payloads and unsupported encodings are rejected. Parser failures return JSON, without reflecting the raw body or a stack trace.

Failures return 400 with `message` and up to 25 field errors. Oversized requests return 413; unsupported media types return 415. Validation only normalizes validated fields; it does not HTML-sanitize text. Render stored text safely in the frontend.

Existence/ownership, uniqueness, last-admin protection, template editability and question-specific score ranges still require service/database checks. Existing defensive checks remain in place. A valid payload can therefore still receive a domain-level 400/404/409.

## Verification

Run `npm ci`, `npx prisma generate`, then `npm test` from `server`. The suite includes 26 test groups, including all mutation routes, invalid path IDs, unknown query fields, nested payloads, valid normalization, transport parsing, and the authorization/logout regressions. Tests use stubbed session/database calls and do not require or modify a live database.

Explicit server and test type-check:

```sh
node node_modules/typescript/bin/tsc --noEmit --module commonjs --target es2022 --esModuleInterop --skipLibCheck src/app.ts test/authorization.test.ts test/logout-client.test.ts test/validation.test.ts
```

This passes. The repository still lacks a server tsconfig, so this command is the verified check rather than claiming the existing `npm run build` script is configured.
