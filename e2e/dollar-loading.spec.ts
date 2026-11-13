import { expect, test } from "@playwright/test";

test("Muestra el estado de carga durante la consulta", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-11T15:00:00Z"));
  let release!: () => void;
  let pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/dollar?*", async (route) => {
    await pending;
    await route.fulfill({ json: [] });
  });
  const status = page.getByRole("main").getByRole("status");

  try {
    await page.goto("/");
    await expect(status).toHaveText("Cargando…");
    release();
    await expect(status).toHaveCount(0);

    pending = new Promise<void>((resolve) => { release = resolve; });
    await page.getByLabel("Fecha inicial").fill("2026-11-10");
    await page.getByLabel("Fecha final").fill("2026-11-10");
    await page.getByRole("button", { name: "Consultar", exact: true }).click();
    await expect(status).toHaveText("Cargando…");
    release();
    await expect(status).toHaveCount(0);
  } finally {
    release();
  }
});
