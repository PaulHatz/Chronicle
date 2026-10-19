# Chronicle

**Employee performance management, from everyday coaching to structured evaluations.**

Chronicle is a full-stack web application for managing employee profiles, performance evaluations, coaching notes, disciplinary records, and development goals in one place. It is designed around the workflows of a team lead or manager, with role-based access and a dashboard for seeing what needs attention.

> **Project status:** Actively developed and self-hosted. A public HTTPS demo and screenshots will be added when they are ready.

## Highlights

- **Employee directory and profiles** — browse employees, filter records, and maintain profile information.
- **Performance evaluations** — configurable evaluation templates, scoring questions, completed evaluations, and evaluation history.
- **Goals and coaching** — development goals, manager notes, and write-ups attached to an employee's record.
- **Dashboard** — employee summaries, quick actions, and upcoming evaluations.
- **Role-based access** — `ADMIN`, `MANAGER`, and `TEAM_LEADER` roles; protected API routes and frontend navigation.
- **Personalization** — English/French language preferences and light/dark appearance.
- **Responsive client architecture** — lazy-loaded React pages and concurrent data fetching where applicable.
- **Session management** — authenticated sessions persisted server-side, with logout revocation.

## Technology stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router, CSS |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL, Prisma 7 |
| Authentication | JSON Web Tokens, Argon2 password hashing, database-backed sessions |
| Validation | Zod and API request validation |
| Hosting | Ubuntu VPS, Apache reverse proxy, systemd |
| Automation | GitHub Actions CI/CD |

## Architecture

```text
Browser
   |
   | HTTP(S)
   v
Apache
   |-- /                  -> React static build (client/dist)
   |
   '-- /api/*             -> Express API (Node.js)
                                |
                                | Prisma + PostgreSQL adapter
                                v
                            PostgreSQL
```

The browser uses same-origin `/api` requests in production. The Express application handles authentication, authorization, validation, and business logic. PostgreSQL stores employees, users, sessions, evaluations, and other records.

GitHub Actions runs frontend lint/build checks and backend compilation/tests. A separate deployment workflow packages the application, transfers it to the VPS over SSH, applies **committed** Prisma migrations when available, and restarts the backend through systemd.

## Running locally

### Prerequisites

- Node.js 24 and npm
- PostgreSQL
- A local PostgreSQL database you can safely use for development

### 1. Clone the repository

```bash
git clone https://github.com/PaulHatz/Chronicle.git
cd Chronicle
```

### 2. Configure the backend

```bash
cd server
npm ci
```

Create `server/.env` (never commit this file):

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@127.0.0.1:5432/chronicle_dev"
JWT_SECRET="REPLACE_WITH_A_LONG_RANDOM_SECRET"
PORT=3000
NODE_ENV=development
```

Generate a strong local JWT secret with `openssl rand -hex 32`. Use your own PostgreSQL credentials; encode reserved characters in the connection URL.

Initialize **only a disposable development database**, using the project's migrations where present:

```bash
npx prisma migrate dev
npx prisma generate
npm run dev
```

The backend runs at `http://localhost:3000` by default. Database setup requires an existing PostgreSQL database and appropriate permissions. You will also need an initial user account to sign in; there is no public self-registration flow.

### 3. Start the frontend

In a second terminal:

```bash
cd client
npm ci
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). In development, the frontend targets `http://localhost:3000/api` by default. Override it with `VITE_API_URL` in a local Vite environment file if necessary.

## Checks

Run these independently:

```bash
# Frontend
cd client
npm run lint
npm run build

# Backend
cd ../server
npx prisma generate
npm run build
npm test
```

The automated CI workflow runs the relevant frontend and backend checks on pushes to `main` and pull requests.

## Database migrations

Prisma schema changes should be accompanied by reviewed, version-controlled migrations. Generate migrations against a **development** database using `prisma migrate dev`; apply committed migrations in deployment using `prisma migrate deploy`.

**Do not use `prisma db push` or `prisma migrate reset` on a production database containing valuable data.** Chronicle's original VPS database was initialized with `db push`, so its migration history must be baselined before an initial migration is applied.

See [Database migration and baselining guide](server/PRISMA_MIGRATIONS.md).

## Deployment

The repository contains:

- [CI workflow](.github/workflows/ci.yml) for linting, tests, and production builds.
- [Deployment workflow](.github/workflows/deploy.yml) for artifact delivery and backend restart.

Deployment is triggered manually or after a successful CI run on `main`. Deployment credentials are stored in GitHub Actions secrets, while the actual PostgreSQL connection string and JWT secret remain on the VPS.

The current deployment pipeline is not zero-downtime and does not provide automatic rollback. TLS, firewall configuration, backups, and production account provisioning are operational responsibilities, not part of the application build.

## Security considerations

Chronicle implements API role checks, request validation, Argon2 password verification, and revocable server-side sessions. These safeguards are complementary to infrastructure controls such as HTTPS, restricted network ports, secure secrets, database backups, and monitoring.

**Do not deploy with real employee information or invite public sign-ins before completing a security and privacy review.** Any future portfolio demo should use fabricated data and deliberately limited demo permissions.

## Project structure

```text
Chronicle/
├── client/                  # React frontend
│   └── src/
│       ├── api/
│       ├── auth/
│       ├── pages/
│       ├── layout/
│       ├── i18n/
│       └── theme/
├── server/                  # Express API
│   ├── src/
│   ├── prisma/
│   │   └── schema.prisma
│   └── test/
└── .github/workflows/       # CI and deployment
```

## Roadmap

- Public HTTPS demo with synthetic employee data
- Screenshots and a short walkthrough
- More integration and end-to-end testing
- Improved health checks, deployment rollback, and production monitoring
- Continued accessibility and responsive UI improvements

---

**Built as a full-stack software engineering portfolio project**, emphasizing application architecture, secure API design, relational data modeling, and practical deployment automation.
