import { expect, test } from "@playwright/test";

test.use({ timezoneId: "America/Santiago" });

test("Solicita el período inicial al abrir el dashboard", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-11T15:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  const initialRequest = page.waitForRequest("**/api/dollar?*", { timeout: 5000 });

  await page.goto("/");
  const request = await initialRequest;

  expect(request.method()).toBe("GET");
  expect(Object.fromEntries(new URL(request.url()).searchParams)).toEqual({
    startDate: "2026-11-01",
    endDate: "2026-11-11",
  });
});
