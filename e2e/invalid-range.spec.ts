import { expect, test } from "@playwright/test";

test("Muestra el mensaje y bloquea la consulta cuando el inicio supera al fin", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-11T15:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  await page.goto("/");
  await page.getByLabel("Fecha inicial").fill("2026-11-10");
  await page.getByLabel("Fecha final").fill("2026-11-02");
  const requests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/dollar") requests.push(request.url());
  });

  await page.getByRole("button", { name: "Consultar", exact: true }).click({ timeout: 5000 });

  await expect(page.getByRole("main").getByRole("alert")).toHaveText("La fecha inicial no puede ser posterior a la fecha final");
  await expect(page.getByLabel("Fecha inicial")).toHaveValue("2026-11-10");
  await expect(page.getByLabel("Fecha final")).toHaveValue("2026-11-02");
  expect(requests).toHaveLength(0);
});

test("Valida fechas futuras aunque se omita la restricción nativa del formulario", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-11T15:00:00Z"));
  const requests: string[] = [];
  await page.route("**/api/dollar?*", (route) => {
    requests.push(route.request().url());
    return route.fulfill({ json: [] });
  });
  await page.goto("/");
  await expect(page.getByText("Sin datos para el período seleccionado.", { exact: true })).toBeVisible();
  const initialCount = requests.length;
  const form = page.locator("form").filter({ has: page.getByLabel("Activar comparación", { exact: true }) });
  // Esto permite comprobar la validación de JavaScript además del max de los inputs.
  await form.evaluate((element: HTMLFormElement) => { element.noValidate = true; });

  for (const [startDate, endDate, message] of [
    ["2026-11-11", "2026-11-12", "Las fechas no pueden ser posteriores a hoy"],
    ["2026-11-12", "2026-11-12", "Las fechas no pueden ser posteriores a hoy"],
    ["2026-11-13", "2026-11-12", "La fecha inicial no puede ser posterior a la fecha final"],
  ]) {
    await form.getByLabel("Fecha inicial").fill(startDate);
    await form.getByLabel("Fecha final").fill(endDate);
    await form.getByRole("button", { name: "Consultar", exact: true }).click();
    await expect(form.getByRole("alert")).toHaveText(message);
    await expect(form.getByRole("status")).toHaveCount(0);
    expect(requests).toHaveLength(initialCount);
  }
});
