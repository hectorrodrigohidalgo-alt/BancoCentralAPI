import { expect, test } from "@playwright/test";

test("Muestra el estado sin datos", async ({ page }) => {
  // Simulamos una consulta exitosa sin observaciones para no depender del servicio real.
  await page.clock.setFixedTime(new Date("2026-11-11T15:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  await page.goto("/");
  const main = page.getByRole("main");

  // Al terminar la carga debe verse el mensaje, sin un gráfico vacío que pueda confundir.
  await expect(main.getByText("Sin datos para el período seleccionado.", { exact: true })).toBeVisible();
  await expect(main.getByRole("status")).toHaveCount(0);
  await expect(main.getByRole("img", { name: /Dólar observado/ })).toHaveCount(0);
});
