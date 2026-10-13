import { test, expect, type Page, type BrowserContext } from "@playwright/test";

type Row = Record<string, unknown>;
const KEY = "tasktrack.ass2.session";
function makeSession(role = 0, seconds = 86400) {
  const exp = Math.floor(Date.now() / 1000) + seconds;
  const claims = Buffer.from(JSON.stringify({ exp, AccountID: "1", Role: role ? "Admin" : "Staff" })).toString("base64url");
  return { accessToken: `e30.${claims}.test-signature`, refreshToken: `refresh-${Math.random()}`, expiresAt: new Date(exp * 1000).toISOString(), refreshExpiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), account: { accountId: 1, fullName: role ? "Test Admin" : "Test Staff", email: "test@example.com", role, createdDate: new Date().toISOString() } };
}

async function mockApi(context: BrowserContext, role = 0) {
  let session = makeSession(role);
  const writes: { path: string; method: string; body: Row }[] = [];
  const rows: Record<string, Row[]> = {
    departments: [{ departmentId: 1, departmentName: "Engineering", departmentDescription: "Team" }],
    projects: [{ projectId: 1, projectName: "Demo project", departmentId: 1, departmentName: "Engineering", status: 0, startDate: "2026-10-13", endDate: null, createdDate: "2026-10-13T00:00:00", tasks: [] }],
    tags: [{ tagId: 1, tagName: "frontend", color: "#123456" }, { tagId: 2, tagName: "backend", color: "#654321" }], tasks: [],
    accounts: [session.account, { ...session.account, accountId: 2, fullName: "Other account", role: 0 }]
  };
  await context.route("http://localhost:5000/api/**", async route => {
    const request = route.request(); const path = new URL(request.url()).pathname; const method = request.method();
    const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
    if (method === "OPTIONS") { await route.fulfill({ status: 204, headers }); return; }
    const body = method === "GET" || method === "DELETE" ? {} : request.postDataJSON() as Row;
    const send = (json: unknown, status = 200) => route.fulfill({ status, headers, contentType: "application/json", body: status === 204 ? "" : JSON.stringify(json) });
    if (path === "/api/auth/register") return send({ ...session.account, role: 0 }, 201);
    if (path === "/api/auth/login") { if (body.password === "wrong") return send({ detail: "Invalid email or password." }, 401); return send(session); }
    if (path === "/api/auth/me") return send(session.account);
    if (path === "/api/auth/refresh") { session = { ...makeSession(role), account: session.account, refreshExpiresAt: session.refreshExpiresAt }; return send(session); }
    if (path === "/api/auth/logout" || path === "/api/auth/password") return send(null, 204);
    if (path === "/api/auth/profile") { session.account.fullName = String(body.fullName); return send(session.account); }
    const [, , resource, idText] = path.split("/"); const id = Number(idText);
    const list = rows[resource] || [];
    if (method === "GET") return send(idText ? list.find(row => row[`${resource.slice(0, -1)}Id`] === id) || list[0] : list);
    expect(request.headers().authorization).toMatch(/^Bearer /);
    writes.push({ path, method, body });
    const key = `${resource.slice(0, -1)}Id`;
    if (method === "POST") {
      const row = { departmentName: "Engineering", projectName: "Demo project", ...body, [key]: 10 + writes.length, createdDate: "2026-10-13T00:00:00", modifiedDate: null, tags: (body.tagIds as number[] || []).map(id => rows.tags.find(tag => tag.tagId === id)) };
      list.push(row); return send(row, 201);
    }
    if (method === "PUT") { const row = list.find(row => row[key] === id); if (row) Object.assign(row, body); return send(null, 204); }
    if (method === "DELETE") { rows[resource] = list.filter(row => row[key] !== id); return send(null, 204); }
    return send({ detail: "Not found" }, 404);
  });
  return { writes, session: () => session };
}
async function login(page: Page) {
  await page.goto("/login"); await page.getByLabel("Email", { exact: true }).fill("test@example.com"); await page.getByLabel(/^Password/).fill("TestPass@123"); await page.getByRole("button", { name: "Login", exact: true }).click(); await expect(page).toHaveURL(/\/admin$/);
}

test("register validation, success message, login, reload and logout", async ({ page, context }) => {
  await mockApi(context); await page.goto("/register");
  await page.getByLabel("Full Name").fill("New Staff"); await page.getByLabel("Email", { exact: true }).fill("new@example.com"); await page.getByLabel(/^Password/).fill("TestPass@123"); await page.getByLabel("Confirm Password").fill("Mismatch@123");
  await page.getByRole("button", { name: "Register", exact: true }).click(); await expect(page.getByRole("alert").filter({ hasText: "do not match" })).toContainText("do not match");
  await page.getByLabel("Confirm Password").fill("TestPass@123"); await page.getByRole("button", { name: "Register", exact: true }).click(); await expect(page.getByRole("status")).toContainText("Registration successful");
  await login(page); await expect(page.getByRole("heading", { name: "Welcome, Test Staff" })).toBeVisible();
  await page.reload(); await expect(page.getByRole("heading", { name: "Welcome, Test Staff" })).toBeVisible();
  const tab = await context.newPage(); await tab.goto("/admin"); await expect(tab.getByRole("heading", { name: "Welcome, Test Staff" })).toBeVisible();
  await page.getByRole("button", { name: "Logout", exact: true }).click(); await expect(page).toHaveURL("/"); await expect(tab).toHaveURL(/\/login$/);
  await page.goto("/admin"); await expect(page).toHaveURL(/\/login$/);
});

test("Admin login waits for slow session verification and reaches dashboard", async ({ page, context }) => {
  await mockApi(context, 1);
  let releaseVerification!: () => void;
  const verificationGate = new Promise<void>(resolve => { releaseVerification = resolve; });
  let verificationStarted!: () => void;
  const started = new Promise<void>(resolve => { verificationStarted = resolve; });
  await context.route("http://localhost:5000/api/auth/me", async route => {
    if (route.request().method() === "GET") { verificationStarted(); await verificationGate; }
    await route.fallback();
  });
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("test@example.com");
  await page.getByLabel(/^Password/).fill("TestPass@123");
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await started;
  try {
    // The form must wait for server verification before navigating to protected UI.
    await expect(page.getByRole("status").filter({ hasText: "Verifying your session" })).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  } finally { releaseVerification(); }
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Welcome, Test Admin" })).toBeVisible();
});

test("verified session opening login automatically reaches dashboard", async ({ page, context }) => {
  const mocked = await mockApi(context, 1);
  await page.goto("/login");
  await page.evaluate(({ key, session }) => localStorage.setItem(key, JSON.stringify(session)), { key: KEY, session: mocked.session() });
  await page.reload();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Welcome, Test Admin" })).toBeVisible();
});

test("invalid credentials stay on login and Staff cannot mount Accounts", async ({ page, context }) => {
  await mockApi(context); await page.goto("/login"); await page.getByLabel("Email", { exact: true }).fill("test@example.com"); await page.getByLabel(/^Password/).fill("wrong"); await page.getByRole("button", { name: "Login", exact: true }).click(); await expect(page.getByRole("alert").filter({ hasText: "Invalid email" })).toContainText("Invalid email"); await expect(page).toHaveURL(/\/login$/);
  await login(page); await page.goto("/admin/accounts"); await expect(page.getByText(/Only Admin accounts/)).toBeVisible(); await expect(page.getByRole("link", { name: "Accounts", exact: true })).toHaveCount(0);
});

test("no session, malformed token, expired token and protected API 401 redirect", async ({ page, context }) => {
  await mockApi(context);
  for (const session of [null, { ...makeSession(), accessToken: "bad-token" }, makeSession(0, -10)]) {
    await page.goto("/login"); await page.evaluate(({ key, session }) => { if (session) localStorage.setItem(key, JSON.stringify(session)); else localStorage.removeItem(key); }, { key: KEY, session });
    await page.goto("/admin/tasks"); await expect(page).toHaveURL(/\/login$/);
  }
  await login(page);
  await context.route("http://localhost:5000/api/tasks", route => route.request().method() === "POST" ? route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ detail: "Session revoked" }) }) : route.fallback());
  await page.goto("/admin/tasks"); await page.getByRole("button", { name: "New task" }).click(); await page.getByLabel(/Task title/).fill("Rejected"); await page.getByRole("button", { name: "Save task" }).click(); await expect(page).toHaveURL(/\/login$/);
});

for (const section of ["departments", "projects", "tags", "tasks"]) {
  test(`Staff CRUD ${section} uses modal, Bearer header and confirmation`, async ({ page, context }) => {
    const mocked = await mockApi(context); await login(page); await page.goto(`/admin/${section}`);
    const singular = section.slice(0, -1); const title = `New ${singular} for E2E`;
    await page.getByRole("button", { name: section === "tasks" ? "New task" : `Create ${singular}`, exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(section === "tasks" ? /Task title/ : new RegExp(`${singular} name`, "i")).fill(title);
    if (section === "departments") await dialog.getByLabel(/Description/).fill("Test description");
    if (section === "projects") await dialog.getByLabel("Start date", { exact: true }).fill("2026-10-13");
    if (section === "tasks") { await dialog.getByLabel("frontend", { exact: true }).check(); await dialog.getByLabel("backend", { exact: true }).check(); }
    await dialog.getByRole("button", { name: `Save ${singular}`, exact: true }).click(); await expect(dialog).toHaveCount(0);
    await page.getByRole("button", { name: `Edit ${title}`, exact: true }).click(); await dialog.getByLabel(section === "tasks" ? /Task title/ : new RegExp(`${singular} name`, "i")).fill(title + " edited"); await dialog.getByRole("button", { name: `Save ${singular}`, exact: true }).click(); await expect(dialog).toHaveCount(0);
    await page.getByRole("button", { name: `${section === "tasks" ? "Archive" : "Delete"} ${title} edited`, exact: true }).click();
    await expect(dialog).toBeVisible(); expect(mocked.writes.filter(x => x.method === "DELETE")).toHaveLength(0);
    await dialog.getByRole("button", { name: section === "tasks" ? "Archive task" : "Delete", exact: true }).click(); await expect(dialog).toHaveCount(0);
    expect(mocked.writes.map(x => x.method)).toEqual(["POST", "PUT", "DELETE"]);
    if (section === "tasks") expect(mocked.writes[0].body.tagIds).toEqual([1, 2]);
  });
}

test("Admin edits roles, account deletion conflict is clear, profile and password work", async ({ page, context }) => {
  await mockApi(context, 1); await login(page); await page.goto("/admin/accounts");
  const row = page.getByRole("row").filter({ hasText: "Other account" }); await row.getByRole("button", { name: "Edit", exact: true }).click();
  const dialog = page.getByRole("dialog"); await dialog.getByLabel(/^Role/).selectOption("1"); await dialog.getByRole("button", { name: "Save account" }).click(); await expect(dialog).toHaveCount(0);
  await context.route("http://localhost:5000/api/accounts/2", route => route.request().method() === "DELETE" ? route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ detail: "Cannot delete an account that has created tasks." }) }) : route.fallback());
  await row.getByRole("button", { name: "Delete", exact: true }).click(); await dialog.getByRole("button", { name: "Delete", exact: true }).click(); await expect(page.getByRole("alert").filter({ hasText: "created tasks" })).toContainText("created tasks"); await dialog.getByRole("button", { name: "Cancel" }).click();
  await page.goto("/profile"); await page.getByLabel("Full Name", { exact: true }).fill("Updated Admin"); await page.getByRole("button", { name: "Save name" }).click(); await expect(page.getByRole("link", { name: "Updated Admin", exact: true })).toBeVisible();
  await page.getByLabel("Current Password", { exact: true }).fill("TestPass@123"); await page.getByLabel("New Password", { exact: true }).fill("ChangedPass@123"); await page.getByLabel("Confirm Password", { exact: true }).fill("ChangedPass@123"); await page.getByRole("button", { name: "Change password", exact: true }).click(); await expect(page).toHaveURL(/\/login$/);
});

test("refresh near expiry rotates once across tabs and logout prevents session resurrection", async ({ page, context }) => {
  await mockApi(context); await page.goto("/login"); const nearExpiry = makeSession(0, 120); await page.evaluate(({ key, session }) => localStorage.setItem(key, JSON.stringify(session)), { key: KEY, session: nearExpiry });
  let refreshCalls = 0;
  await context.route("http://localhost:5000/api/auth/refresh", async route => { if (route.request().method() === "POST") refreshCalls++; await new Promise(resolve => setTimeout(resolve, 200)); await route.fallback(); });
  const second = await context.newPage(); await Promise.all([page.goto("/admin"), second.goto("/admin")]);
  await expect.poll(() => refreshCalls).toBe(1); await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) || "null")?.refreshToken, KEY)).not.toBe(nearExpiry.refreshToken);
  await expect(page.getByRole("button", { name: "Logout", exact: true })).toBeVisible(); await page.getByRole("button", { name: "Logout", exact: true }).click(); await expect.poll(() => page.evaluate(key => localStorage.getItem(key), KEY)).toBeNull(); await expect(second).toHaveURL(/\/login$/);
});

test("public browsing and legacy management routes remain accessible", async ({ page, context }) => {
  await mockApi(context); await page.goto("/"); await expect(page.getByRole("link", { name: "Login", exact: true })).toBeVisible();
  await page.goto("/departments"); await expect(page.getByText("Engineering", { exact: true })).toBeVisible();
  await page.goto("/search"); await expect(page.getByRole("heading", { name: "Search tasks", exact: true })).toBeVisible();
  await page.goto("/tasks/manage"); await expect(page).toHaveURL(/\/login$/);
});
