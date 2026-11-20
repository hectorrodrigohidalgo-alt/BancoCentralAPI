import { expect, test } from "@playwright/test";

for (const data of [[], null]) {
  test(`Muestra el estado sin datos con respuesta ${JSON.stringify(data)}`, async ({ page }) => {
    // Simulamos una consulta exitosa sin observaciones para no depender del servicio real.
    await page.clock.setFixedTime(new Date("2026-11-11T15:00:00Z"));
    await page.route("**/api/dollar?*", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(data) }));
    await page.goto("/");
    const main = page.getByRole("main");

    // Al terminar la carga debe verse el mensaje, sin un gráfico vacío que pueda confundir.
    await expect(main.getByText("Sin datos para el período seleccionado.", { exact: true })).toBeVisible();
    await expect(main.getByRole("status")).toHaveCount(0);
    await expect(main.getByRole("img", { name: /Dólar observado/ })).toHaveCount(0);

    // Una consulta válida debe limpiar el error de validación y volver a aceptar una respuesta vacía.
    await page.getByLabel("Fecha inicial").fill("2026-11-10");
    await page.getByLabel("Fecha final").fill("2026-11-02");
    await page.getByRole("button", { name: "Consultar", exact: true }).click();
    await expect(main.getByRole("alert")).toBeVisible();
    await page.getByLabel("Fecha final").fill("2026-11-10");
    await page.getByRole("button", { name: "Consultar", exact: true }).click();
    await expect(main.getByText("Sin datos para el período seleccionado.", { exact: true })).toBeVisible();
    await expect(main.getByRole("alert")).toHaveCount(0);
    await expect(main.getByRole("status")).toHaveCount(0);
    await expect(main.getByRole("img", { name: /Dólar observado/ })).toHaveCount(0);
  });
}
