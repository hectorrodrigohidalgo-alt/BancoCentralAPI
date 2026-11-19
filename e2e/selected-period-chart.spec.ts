import { expect, test } from "@playwright/test";

test("El gráfico cambia al período seleccionado", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-11T15:00:00Z"));
  // Cada rango tiene datos diferentes: solo una consulta con ambas fechas correctas recibe los nuevos.
  await page.route("**/api/dollar?*", (route) => {
    const params = new URL(route.request().url()).searchParams;
    const selected = params.get("startDate") === "2026-11-06" && params.get("endDate") === "2026-11-09";
    return route.fulfill({ json: selected ? [
      { indexDateString: "06-11-2026", value: "970.25", statusCode: "OK" },
      { indexDateString: "09-11-2026", value: "972.50", statusCode: "OK" },
    ] : [
      { indexDateString: "02-11-2026", value: "950.25", statusCode: "OK" },
      { indexDateString: "03-11-2026", value: "952.50", statusCode: "OK" },
    ] });
  });
  await page.goto("/");
  const chart = page.getByRole("img", { name: /Dólar observado/ });
  await expect(chart).toHaveAttribute("aria-label", /02-11-2026.*950\.25.*03-11-2026.*952\.5/);

  // Después de consultar, las observaciones nuevas deben reemplazar a las del período inicial.
  await page.getByLabel("Fecha inicial").fill("2026-11-06");
  await page.getByLabel("Fecha final").fill("2026-11-09");
  await page.getByRole("button", { name: "Consultar", exact: true }).click();
  await expect(chart).toHaveAttribute("aria-label", /06-11-2026.*970\.25.*09-11-2026.*972\.5/);
  await expect(chart).not.toHaveAttribute("aria-label", /02-11-2026|03-11-2026/);
  await expect(chart.locator("svg")).toBeVisible();
});
