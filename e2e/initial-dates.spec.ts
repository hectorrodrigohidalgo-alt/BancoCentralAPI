import { expect, test } from "@playwright/test";

test.use({ timezoneId: "America/Santiago" });

test("Inicializa las fechas desde el día 1 del mes actual hasta hoy", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-11T15:00:00Z"));
  await page.goto("/");

  await expect(page.getByLabel("Fecha inicial")).toHaveValue("2026-11-01");
  await expect(page.getByLabel("Fecha final")).toHaveValue("2026-11-11");
});

test("Rechaza fechas posteriores a hoy en ambos campos y permite hoy", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-11T15:00:00Z"));
  await page.goto("/");

  for (const label of ["Fecha inicial", "Fecha final"]) {
    const field = page.getByLabel(label);
    await field.fill("2026-11-11");
    expect(await field.evaluate((input: HTMLInputElement) => input.checkValidity())).toBe(true);

    for (const futureDate of ["2026-11-12", "2026-12-01"]) {
      await field.fill(futureDate);
      expect(await field.evaluate((input: HTMLInputElement) => input.checkValidity())).toBe(false);
    }
  }
});
