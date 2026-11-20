import { expect, test } from "@playwright/test";

test("Muestra fecha y valor al pasar sobre las observaciones", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-11T15:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [
    { indexDateString: "02-11-2026", value: "950.25", statusCode: "OK" },
    { indexDateString: "03-11-2026", value: "952.50", statusCode: "OK" },
  ] }));
  await page.goto("/");
  const chart = page.getByRole("img", { name: /Dólar observado/ });
  await expect(chart).toHaveAttribute("aria-label", /02-11-2026.*950\.25/);
  const bounds = (await chart.boundingBox())!;
  await expect(page.getByRole("tooltip")).toHaveCount(0);

  for (const [fraction, expected] of [
    [0.25, "02-11-2026: 950.25 CLP/USD"],
    [0.75, "03-11-2026: 952.5 CLP/USD"],
  ] as const) {
    await chart.hover({ position: { x: bounds.width * fraction, y: bounds.height / 2 } });
    await expect(page.getByRole("tooltip")).toBeVisible();
    await expect(page.getByRole("tooltip")).toHaveText(expected);
  }
});
