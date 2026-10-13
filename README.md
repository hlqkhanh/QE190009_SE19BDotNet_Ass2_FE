# Taskly Frontend — PRN232 Assignment 2

Next.js App Router / TypeScript frontend. Public Ass1 browsing, search and Kanban/Timeline/List are preserved; management moved to /admin/departments, /admin/projects, /admin/tasks and /admin/tags. Old management URLs redirect.

```powershell
Copy-Item .env.example .env.local
npm.cmd ci
npm.cmd run dev
```

Set NEXT_PUBLIC_API_URL to the backend origin (local Ass2 uses http://localhost:5001). All database operations go through the API. Never put JWT_SECRET or database credentials in NEXT_PUBLIC variables.

/register creates Staff with validation; /login stores the returned session in localStorage and redirects to /admin. The dashboard and management accept Staff and Admin. /admin/accounts accepts Admin only. /profile updates the current account name/password. Navigation shows the verified account name and Logout.

AuthProvider verifies /api/auth/me before mounting protected content. API writes attach Bearer tokens. Protected API 401 clears session and redirects to login; 403 displays denied access. Expired JWT is rejected locally, and writes are never retried. Automatic refresh rotates before expiry under cross-tab Web Locks; browsers without Web Locks log in again on expiry. Logout clears browser state and revokes all account sessions when the backend is reachable. Other tabs synchronize logout; the originating tab returns home.

```powershell
npm.cmd run lint
npm.cmd run build
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

Default Chromium E2E mocks the HTTP backend so this repository can run independently in CI. To run the browser against a real local backend, set E2E_LIVE_API to its origin and E2E_PRIVATE_CONFIG to the ignored private JSON containing local test accounts. The live smoke creates/archives a test task and updates the Staff display name; use a test system.

Deploy this repository to Vercel, set NEXT_PUBLIC_API_URL to the Render production origin, redeploy, and add the exact Vercel origin to backend CORS. Verify live register/login, Staff CRUD/403, Admin Accounts, profile and logout before submitting. Credentials and private submission documents must not be committed.