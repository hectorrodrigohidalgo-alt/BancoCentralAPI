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
