# API authorization

This change enforces the existing UI role boundaries on the API. Authorization uses the account's current database role on every request, never the role claimed by a JWT. Removing an account revokes its API access; role changes take effect on the next request. Tokens remain signed with HS256 and retain their existing expiration policy.

| Resource/action | Admin | Manager | Team leader |
| --- | --- | --- | --- |
| Own profile, language, appearance | Yes | Yes | Yes |
| Employee records, notes, write-ups, evaluations, goals, dashboard | Yes | Yes | Yes |
| Department options (ID and name only) | Yes | Yes | Yes |
| Department configuration and mutations | Yes | No | No |
| Template/question administration, including reads | Yes | No | No |
| List users | All roles | Team leaders only | No |
| Create/update users | All roles | Team leaders only; cannot promote | No |
| Delete users | Yes, subject to existing self/last-admin protections | No | No |

Employee evaluation forms remain available through the employee-specific evaluation endpoint. Admin-only template endpoints are not required for completing an evaluation.

The model currently has no user-to-employee or user-to-department assignments. Employee workflows intentionally retain their existing access for all three roles. This is role authorization, not a claim of team/department isolation. If team leaders must only access assigned employees, define that policy and add assignments before enabling it; list queries, counts, activity feeds and nested records must all share the same scope.

## Response behavior

- 401: missing/invalid/expired token, invalid subject, or deleted account.
- 403: a current account lacks the required role (including an unknown role).
- 503: account permissions cannot be checked because the database is unavailable. No protected handler runs.
- 500: JWT signing configuration is missing.

`requireRoles` must follow `authenticate`. The broad `/api` template router now attaches guards to its own routes, so it does not accidentally intercept unrelated endpoints.

## Verification

From `server`, run `npm ci`, `npx prisma generate`, then `npm test` (Node 20.19+ or 22.12+). Tests exercise the Express app with real signed JWTs and stubbed Prisma calls, without a database or listening socket. Coverage includes route denials, stale token roles, deleted users, invalid JWTs, fail-closed lookup errors, user privilege escalation and minimal department options. These are route-level regression tests, not live PostgreSQL integration tests.

An explicit TypeScript check of the server still exposes pre-existing untyped `id`/`emp` parameters in `employees.service.ts`. The auth controller type errors were corrected while adding logout. The repository does not currently contain a server tsconfig; repairing the full build is a separate task.

## Revocable login sessions

Each successful login now stores a random session ID and expiry in PostgreSQL and embeds the ID as the signed JWT `jti`. Authentication requires both a valid JWT and an unexpired session belonging to its subject; the user's current role is read through that session. Raw tokens are not stored in the database.

`POST /api/auth/logout` revokes only the authenticated session and returns 204 after the delete succeeds. Copied tokens for that session fail with 401 on subsequent requests. Other logins/devices remain active. Requests already authorized before logout may still finish.

The client waits for successful revocation before removing its token, treats 401 as an already unusable token, and displays a retryable error on network/server failure. A login established in another tab during logout is preserved.

### Existing database rollout

Before starting the updated server, apply the additive SQL once from `server` with an exported database URL:

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prisma/sql/add-sessions.sql
npx prisma generate
npm test
```

This repository has no baseline Prisma migration history, so the SQL is supplied as an explicit existing-database upgrade instead of introducing an incomplete migration history. New databases created from the Prisma schema already include `Session` and must not run the additive SQL again.

All previously issued tokens lack session IDs and will be rejected after rollout; users must sign in again. Do not accept old tokens as a fallback. Deploy the updated frontend and backend together. Expired session rows can periodically be removed with `DELETE FROM "Session" WHERE "expiresAt" <= CURRENT_TIMESTAMP;`.

This change retains the current bearer-token transport and localStorage. It implements server-side logout revocation; moving the credential to an HttpOnly cookie remains a separate XSS-hardening change.

Verification now includes actual login-issued JWTs, logout/replay, device isolation, legacy/expired/owner-mismatched sessions, persistence and revocation failures, plus client success/failure/new-login handling. All 20 tests pass with stubbed database calls; no live database was modified or integration-tested.
