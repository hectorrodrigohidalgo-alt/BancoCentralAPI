import { expect, test } from "@playwright/test";

test.use({ timezoneId: "America/Santiago" });

test("Inicializa las fechas desde el día 1 del mes actual hasta hoy", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-11T15:00:00Z"));
  await page.goto("/");

  await expect(page.getByLabel("Fecha inicial")).toHaveValue("2026-11-01");
  await expect(page.getByLabel("Fecha final")).toHaveValue("2026-11-11");
});
