import { expect, test } from "@playwright/test";

test("Mantiene la consulta y comparación del dólar junto al KPI UF", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-11T15:00:00Z"));
  const apiPaths: string[] = [];
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (path.startsWith("/api/")) apiPaths.push(path);
  });
  await page.route("**/api/dollar?*", (route) => {
    const start = new URL(route.request().url()).searchParams.get("startDate");
    const date = start === "2026-09-01" ? "01-09-2026" : start === "2026-10-01" ? "01-10-2026" : "02-11-2026";
    return route.fulfill({ json: [{ indexDateString: date, value: "950.25", statusCode: "OK" }] });
  });
  await page.route("**/api/uf?*", (route) => route.fulfill({ json: [
    { indexDateString: "11-11-2026", value: "40000.25", statusCode: "OK" },
  ] }));
  await page.goto("/");
  const kpi = page.getByRole("region", { name: "UF de hoy", exact: true });
  await expect(kpi).toContainText("$40.000,25");
  await expect(kpi.locator("time")).toHaveText("11-11-2026");
  await expect(page.getByRole("img", { name: /Dólar observado/ })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Indicador", exact: true })).toHaveCount(0);
  await expect(page.getByRole("option", { name: "UF", exact: true })).toHaveCount(0);

  await page.getByLabel("Activar comparación").check();
  for (const [label, value] of [
    ["Fecha inicial", "2026-09-01"], ["Fecha final", "2026-09-30"],
    ["Inicio del período 2", "2026-10-01"], ["Fin del período 2", "2026-10-31"],
  ]) {
    await page.getByLabel(label, { exact: true }).fill(value);
  }
  await page.getByRole("button", { name: "Comparar", exact: true }).click();
  await expect(page.getByRole("img", { name: /Comparación del dólar/ })).toBeVisible();
  await expect(kpi).toContainText("$40.000,25");
  await expect(kpi.locator("time")).toHaveText("11-11-2026");
  expect(new Set(apiPaths)).toEqual(new Set(["/api/dollar", "/api/uf"]));
  expect(apiPaths.filter((path) => path === "/api/uf")).toHaveLength(1);
});
