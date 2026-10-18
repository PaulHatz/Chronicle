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

An explicit TypeScript check of the server also exposed pre-existing errors: `result.message` and a missing `AuthRequest` import in `auth.controller.ts`, and untyped `id`/`emp` parameters in `employees.service.ts`. The repository does not currently contain a server tsconfig; repairing the full build is a separate task.
