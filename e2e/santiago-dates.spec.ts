import { expect, test } from "@playwright/test";

test.use({ timezoneId: "UTC" });

test("Usa la fecha de Santiago aunque el visitante esté en otra zona horaria", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-01T01:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  const initialRequest = page.waitForRequest("**/api/dollar?*", { timeout: 5000 });
  await page.goto("/");

  await expect(page.getByLabel("Fecha inicial")).toHaveValue("2026-10-01");
  await expect(page.getByLabel("Fecha final")).toHaveValue("2026-10-31");
  const request = await initialRequest;
  expect(Object.fromEntries(new URL(request.url()).searchParams)).toEqual({
    startDate: "2026-10-01",
    endDate: "2026-10-31",
  });

  for (const label of ["Fecha inicial", "Fecha final"]) {
    const field = page.getByLabel(label);
    await field.fill("2026-10-31");
    expect(await field.evaluate((input: HTMLInputElement) => input.checkValidity())).toBe(true);
    await field.fill("2026-11-01");
    expect(await field.evaluate((input: HTMLInputElement) => input.checkValidity())).toBe(false);
  }
});
