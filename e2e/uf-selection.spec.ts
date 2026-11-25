import { expect, test } from "@playwright/test";

test("Permite seleccionar UF y consultar un rango histórico", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-11T15:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [
    { indexDateString: "02-11-2026", value: "950.25", statusCode: "OK" },
  ] }));
  await page.route("**/api/uf?*", (route) => route.fulfill({ json: [
    { indexDateString: "06-11-2026", value: "40000.25", statusCode: "OK" },
  ] }));
  await page.goto("/");
  const main = page.getByRole("main");
  await expect(main.getByRole("img", { name: /Dólar observado/ })).toBeVisible();
  await page.getByLabel("Indicador", { exact: true }).selectOption("uf");
  await expect(main.getByRole("img")).toHaveCount(0);
  await page.getByLabel("Fecha inicial", { exact: true }).fill("2026-11-06");
  await page.getByLabel("Fecha final", { exact: true }).fill("2026-11-09");
  const [request] = await Promise.all([
    page.waitForRequest("**/api/uf?*", { timeout: 5000 }),
    page.getByRole("button", { name: "Consultar", exact: true }).click(),
  ]);
  expect(request.method()).toBe("GET");
  expect(Object.fromEntries(new URL(request.url()).searchParams)).toEqual({ startDate: "2026-11-06", endDate: "2026-11-09" });
  await expect(page.getByRole("button", { name: "Consultar", exact: true })).toBeEnabled();
  await expect(main.getByRole("alert")).toHaveCount(0);
  await expect(main.getByRole("img", { name: /UF/ })).toBeVisible();
  await page.getByLabel("Indicador", { exact: true }).selectOption("dollar");
  await expect(main.getByRole("img")).toHaveCount(0);
});

test("Muestra la evolución UF en CLP/UF con fecha y valor en el tooltip", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-11T15:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/uf?*", (route) => route.fulfill({ json: [
    { indexDateString: "02-11-2026", value: "40000.25", statusCode: "OK" },
    { indexDateString: "03-11-2026", value: "40002.50", statusCode: "OK" },
  ] }));
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Consultar", exact: true })).toBeEnabled();
  await page.getByLabel("Indicador", { exact: true }).selectOption("uf");
  await page.getByRole("button", { name: "Consultar", exact: true }).click();
  const chart = page.getByRole("img", { name: /UF/ });
  await expect(chart).toHaveAttribute("aria-label", /UF \(CLP\/UF\).*02-11-2026.*40000\.25.*03-11-2026.*40002\.5/);
  await expect(chart.getByText("CLP/UF", { exact: true })).toBeVisible();
  await expect(chart.locator("svg")).toBeVisible();
  const bounds = (await chart.boundingBox())!;
  for (const [fraction, expected] of [
    [0.25, "02-11-2026: 40000.25 CLP/UF"],
    [0.75, "03-11-2026: 40002.5 CLP/UF"],
  ] as const) {
    await chart.hover({ position: { x: bounds.width * fraction, y: bounds.height / 2 } });
    await expect(page.getByRole("tooltip")).toBeVisible();
    await expect(page.getByRole("tooltip")).toHaveText(expected);
  }
});

test("Muestra carga durante una consulta UF", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-11T15:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/uf?*", async (route) => {
    await pending;
    await route.fulfill({ json: [
      { indexDateString: "02-11-2026", value: "40000.25", statusCode: "OK" },
    ] });
  });
  const consult = page.getByRole("button", { name: "Consultar", exact: true });
  const status = page.getByRole("main").getByRole("status");
  try {
    await page.goto("/");
    await expect(consult).toBeEnabled();
    await page.getByLabel("Indicador", { exact: true }).selectOption("uf");
    await Promise.all([page.waitForRequest("**/api/uf?*", { timeout: 5000 }), consult.click()]);
    await expect(status).toHaveText("Cargando…");
    await expect(consult).toBeDisabled();
    await expect(page.getByLabel("Indicador", { exact: true })).toBeDisabled();
    release();
    await expect(status).toHaveCount(0);
    await expect(consult).toBeEnabled();
    await expect(page.getByLabel("Indicador", { exact: true })).toBeEnabled();
    await expect(page.getByRole("img", { name: /UF/ })).toHaveAttribute("aria-label", /02-11-2026.*40000\.25/);
  } finally {
    release();
  }
});

test("Informa fechas inválidas en una consulta individual UF", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-11T15:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  const requests: string[] = [];
  await page.route("**/api/uf?*", (route) => {
    requests.push(route.request().url());
    return route.fulfill({ json: [{ indexDateString: "02-11-2026", value: "40000.25", statusCode: "OK" }] });
  });
  await page.goto("/");
  const consult = page.getByRole("button", { name: "Consultar", exact: true });
  await expect(consult).toBeEnabled();
  await page.getByLabel("Indicador", { exact: true }).selectOption("uf");
  const start = page.getByLabel("Fecha inicial", { exact: true });
  const end = page.getByLabel("Fecha final", { exact: true });
  const main = page.getByRole("main");
  // Comprobamos la validación de la aplicación además de las restricciones del navegador.
  await page.locator("form").evaluate((form: HTMLFormElement) => { form.noValidate = true; });
  for (const [from, to, message] of [
    ["", "2026-11-10", "Selecciona ambas fechas"],
    ["2026-11-02", "", "Selecciona ambas fechas"],
    ["2026-11-10", "2026-11-02", "La fecha inicial no puede ser posterior a la fecha final"],
    ["2026-11-11", "2026-11-12", "Las fechas no pueden ser posteriores a hoy"],
    ["2026-11-12", "2026-11-12", "Las fechas no pueden ser posteriores a hoy"],
    ["2026-11-13", "2026-11-12", "La fecha inicial no puede ser posterior a la fecha final"],
  ]) {
    await start.fill(from);
    await end.fill(to);
    await consult.click();
    await expect(main.getByRole("alert")).toHaveText(message);
    await expect(main.getByRole("status")).toHaveCount(0);
    expect(requests).toHaveLength(0);
  }
  await start.fill("2026-11-02");
  await end.fill("2026-11-10");
  await consult.click();
  await expect(main.getByRole("img", { name: /UF/ })).toBeVisible();
  await expect(main.getByRole("alert")).toHaveCount(0);
  expect(requests).toHaveLength(1);
});

test("Informa ausencia de datos en una consulta UF", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-11T15:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  const observations = [{ indexDateString: "02-11-2026", value: "40000.25", statusCode: "OK" }];
  let data: typeof observations | null = observations;
  await page.route("**/api/uf?*", (route) => route.fulfill({
    contentType: "application/json", body: JSON.stringify(data),
  }));
  await page.goto("/");
  const consult = page.getByRole("button", { name: "Consultar", exact: true });
  await expect(consult).toBeEnabled();
  await page.getByLabel("Indicador", { exact: true }).selectOption("uf");
  await consult.click();
  const main = page.getByRole("main");
  const chart = main.getByRole("img", { name: /UF/ });
  await expect(chart).toBeVisible();

  for (const empty of [[], null]) {
    data = empty;
    await Promise.all([page.waitForResponse("**/api/uf?*", { timeout: 5000 }), consult.click()]);
    await expect(main.getByText("Sin datos para el período seleccionado.", { exact: true })).toBeVisible();
    await expect(main.getByRole("img")).toHaveCount(0);
    await expect(main.getByRole("status")).toHaveCount(0);
    await expect(main.getByRole("alert")).toHaveCount(0);
    await expect(consult).toBeEnabled();
  }
  data = observations;
  await consult.click();
  await expect(chart).toHaveAttribute("aria-label", /02-11-2026.*40000\.25/);
  await expect(main.getByText("Sin datos para el período seleccionado.", { exact: true })).toHaveCount(0);
});
