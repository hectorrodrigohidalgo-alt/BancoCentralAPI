import { expect, test } from "@playwright/test";

test("Consulta un solo día desde la interfaz", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-11T15:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  await page.goto("/");
  await page.getByLabel("Fecha inicial").fill("2026-11-10");
  await page.getByLabel("Fecha final").fill("2026-11-10");

  const [request] = await Promise.all([
    page.waitForRequest((request) => {
      const url = new URL(request.url());
      return url.pathname === "/api/dollar" && url.searchParams.get("startDate") === "2026-11-10";
    }, { timeout: 5000 }),
    page.getByRole("button", { name: "Consultar", exact: true }).click(),
  ]);

  expect(request.method()).toBe("GET");
  expect(Object.fromEntries(new URL(request.url()).searchParams)).toEqual({
    startDate: "2026-11-10",
    endDate: "2026-11-10",
  });
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
});
