import { expect, test } from "@playwright/test";

test.use({ timezoneId: "Asia/Tokyo" });

test("Muestra el KPI UF con valor decimal y fecha de hoy en Santiago", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-12T01:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  const queries: Record<string, string>[] = [];
  await page.route("**/api/uf?*", (route) => {
    queries.push(Object.fromEntries(new URL(route.request().url()).searchParams));
    return route.fulfill({ json: [{ indexDateString: "11-11-2026", value: "40000.25", statusCode: "OK" }] });
  });
  await page.goto("/");
  const kpi = page.getByRole("region", { name: "UF de hoy", exact: true });
  await expect(kpi).toBeVisible();
  await expect(kpi).toContainText("$40.000,25");
  await expect(kpi.locator("time")).toHaveText("11-11-2026");
  expect(queries).toEqual([{ startDate: "2026-11-11", endDate: "2026-11-11" }]);
});

test("Muestra carga mientras espera la UF del KPI", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-12T01:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/uf?*", async (route) => {
    await pending;
    await route.fulfill({ json: [{ indexDateString: "11-11-2026", value: "40000.25", statusCode: "OK" }] });
  });
  try {
    await page.goto("/");
    const kpi = page.getByRole("region", { name: "UF de hoy", exact: true });
    await expect(kpi.getByRole("status")).toHaveText("Cargando…");
    await expect(kpi.locator("time")).toHaveCount(0);
    release();
    await expect(kpi).toContainText("$40.000,25");
    await expect(kpi.getByRole("status")).toHaveCount(0);
  } finally {
    release();
  }
});

test("Informa ausencia de UF de hoy sin sustituirla por un valor anterior", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-12T01:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  for (const observations of [[], [{ indexDateString: "10-11-2026", value: "39999.50", statusCode: "OK" }]]) {
    await page.route("**/api/uf?*", (route) => route.fulfill({ json: observations }));
    await page.goto("/");
    const kpi = page.getByRole("region", { name: "UF de hoy", exact: true });
    await expect(kpi.getByRole("alert")).toHaveText("Sin datos de UF para hoy.");
    await expect(kpi.getByRole("status")).toHaveCount(0);
    await expect(kpi.locator("time")).toHaveCount(0);
    await expect(kpi).not.toContainText("$");
    await page.unroute("**/api/uf?*");
  }
});

test("Informa un fallo de consulta del KPI UF", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-12T01:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  for (const failure of ["http", "network"]) {
    await page.route("**/api/uf?*", (route) => failure === "network"
      ? route.abort("failed")
      : route.fulfill({ status: 502, json: { error: "No fue posible consultar la UF. Intenta nuevamente." } }));
    await page.goto("/");
    const kpi = page.getByRole("region", { name: "UF de hoy", exact: true });
    await expect(kpi.getByRole("alert")).toHaveText("No fue posible consultar la UF. Intenta nuevamente.");
    await expect(kpi.getByRole("status")).toHaveCount(0);
    await expect(kpi.locator("time")).toHaveCount(0);
    await expect(kpi).not.toContainText("$");
    await expect(kpi).not.toContainText("Sin datos de UF para hoy.");
    await page.unroute("**/api/uf?*");
  }
});
