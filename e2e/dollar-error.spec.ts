import { expect, test } from "@playwright/test";

test("Muestra el error cuando falla el servicio", async ({ page }) => {
  // Un HTTP 503 representa un servicio no disponible, no una consulta exitosa sin datos.
  await page.clock.setFixedTime(new Date("2026-11-11T15:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ status: 503, json: { error: "Servicio no disponible" } }));
  await page.goto("/");
  const main = page.getByRole("main");
  await expect(main.getByRole("alert")).toHaveText("No fue posible consultar el dólar. Intenta nuevamente.");
  await expect(main.getByRole("status")).toHaveCount(0);
  await expect(main.getByText("Sin datos para el período seleccionado.", { exact: true })).toHaveCount(0);

  // La consulta manual también debe terminar la carga y mostrar el mismo error.
  await page.getByLabel("Fecha inicial").fill("2026-11-10");
  await page.getByLabel("Fecha final").fill("2026-11-10");
  await Promise.all([
    page.waitForResponse((response) => new URL(response.url()).searchParams.get("startDate") === "2026-11-10"),
    page.getByRole("button", { name: "Consultar", exact: true }).click(),
  ]);
  await expect(main.getByRole("alert")).toHaveText("No fue posible consultar el dólar. Intenta nuevamente.");
  await expect(main.getByRole("status")).toHaveCount(0);
  await expect(main.getByText("Sin datos para el período seleccionado.", { exact: true })).toHaveCount(0);
});
