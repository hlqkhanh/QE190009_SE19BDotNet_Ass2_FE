import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

test("real API: Staff CRUD/audit, Admin accounts, profile, public pages and logout", async ({ page, request }) => {
  if (!process.env.E2E_LIVE_API || !process.env.E2E_PRIVATE_CONFIG) throw new Error("Set E2E_LIVE_API and E2E_PRIVATE_CONFIG to run the real API smoke test.");
  const config = JSON.parse(readFileSync(process.env.E2E_PRIVATE_CONFIG, "utf8").replace(/^\uFEFF/, "")) as { adminEmail: string; adminPassword: string; staffEmail: string; staffPassword: string };
  const apiUrl = process.env.E2E_LIVE_API;
  const title = `Browser smoke ${Date.now()}`;
  await page.goto("/login"); await page.getByLabel("Email", { exact: true }).fill(config.staffEmail); await page.getByLabel(/^Password/).fill(config.staffPassword); await page.getByRole("button", { name: "Login", exact: true }).click(); await expect(page).toHaveURL(/\/admin$/);
  const staffSession = await page.evaluate(() => JSON.parse(localStorage.getItem("tasktrack.ass2.session") || "null")) as { accessToken: string; account: { accountId: number } };
  const denied = await request.get(`${apiUrl}/api/accounts`, { headers: { Authorization: `Bearer ${staffSession.accessToken}` } }); expect(denied.status()).toBe(403);
  await page.goto("/admin/tasks"); await page.getByRole("button", { name: "New task" }).click();
  const dialog = page.getByRole("dialog"); await dialog.getByLabel(/Task title/).fill(title); await dialog.getByRole("checkbox").first().check(); await dialog.getByRole("button", { name: "Save task" }).click(); await expect(dialog).toHaveCount(0); await expect(page.getByRole("link", { name: title, exact: true })).toBeVisible();
  const tasks = await (await request.get(`${apiUrl}/api/tasks/search?title=${encodeURIComponent(title)}`)).json() as { taskId: number; title: string; createdById: number }[];
  const created = tasks.find(task => task.title === title)!; expect(created.createdById).toBe(staffSession.account.accountId);
  await page.getByRole("button", { name: `Edit ${title}`, exact: true }).click(); await dialog.getByLabel(/Task title/).fill(title + " updated"); await dialog.getByRole("button", { name: "Save task" }).click(); await expect(dialog).toHaveCount(0);
  await page.getByRole("button", { name: `Archive ${title} updated`, exact: true }).click(); await dialog.getByRole("button", { name: "Archive task", exact: true }).click(); await expect(dialog).toHaveCount(0); expect((await request.get(`${apiUrl}/api/tasks/${created.taskId}`)).status()).toBe(404);
  await page.goto("/admin/accounts"); await expect(page.getByText(/Only Admin accounts/)).toBeVisible();
  await page.goto("/profile"); await page.getByLabel("Full Name", { exact: true }).fill("Assignment 2 Staff"); await page.getByRole("button", { name: "Save name" }).click(); await expect(page.getByRole("link", { name: "Assignment 2 Staff", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Logout", exact: true }).click(); await expect(page).toHaveURL("/");
  expect((await request.get(`${apiUrl}/api/auth/me`, { headers: { Authorization: `Bearer ${staffSession.accessToken}` } })).status()).toBe(401);
  await page.goto("/login"); await page.getByLabel("Email", { exact: true }).fill(config.adminEmail); await page.getByLabel(/^Password/).fill(config.adminPassword); await page.getByRole("button", { name: "Login", exact: true }).click(); await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/accounts"); await expect(page.getByRole("cell", { name: config.staffEmail, exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Logout", exact: true }).click(); await expect(page).toHaveURL("/"); await page.goto("/admin"); await expect(page).toHaveURL(/\/login$/);
  await page.goto("/projects/1"); await expect(page.getByRole("tab", { name: "Kanban", exact: true })).toBeVisible(); await page.getByRole("tab", { name: "Kanban", exact: true }).click(); await page.getByRole("tab", { name: "Timeline", exact: true }).click(); await page.getByRole("tab", { name: "List", exact: true }).click();
});
