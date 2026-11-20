import { expect, test } from "@playwright/test";

test("Dibuja las observaciones recibidas con ECharts", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-11T15:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [
    { indexDateString: "02-11-2026", value: "950.25", statusCode: "OK" },
    { indexDateString: "03-11-2026", value: "952.50", statusCode: "OK" },
  ] }));
  await page.goto("/");
  const chart = page.getByRole("img", { name: /Dólar observado/ });
  await expect(chart).toBeVisible();
  await expect(chart).toHaveAttribute("aria-label", /02-11-2026.*950\.25/);
  await expect(chart).toHaveAttribute("aria-label", /03-11-2026.*952\.5/);
  await expect(chart.locator("svg")).toBeVisible();
});
