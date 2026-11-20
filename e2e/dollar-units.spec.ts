import { expect, test } from "@playwright/test";

test("Expresa los valores en pesos chilenos por dólar", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-11T15:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [
    { indexDateString: "02-11-2026", value: "950.25", statusCode: "OK" },
  ] }));
  await page.goto("/");

  const chart = page.getByRole("img", { name: /Dólar observado/ });
  await expect(chart.getByText("CLP/USD", { exact: true })).toBeVisible();
  await expect(chart).toHaveAttribute("aria-label", /CLP\/USD.*950\.25/);
});
