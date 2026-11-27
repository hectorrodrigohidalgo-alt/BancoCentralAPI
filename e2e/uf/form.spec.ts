import { expect, test } from "@playwright/test";

test.use({ timezoneId: "Asia/Tokyo" });

test("Inicializa el formulario con hoy, monto vacío y ambas acciones deshabilitadas", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-12T01:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/uf?*", (route) => route.fulfill({ json: [] }));
  await page.goto("/");
  const form = page.getByRole("form", { name: "Consulta y conversión UF", exact: true });
  await expect(form).toBeVisible();
  await expect(form.getByLabel("Fecha UF", { exact: true })).toHaveValue("2026-11-11");
  await expect(form.getByLabel("Monto en UF", { exact: true })).toHaveValue("");
  await expect(form.getByRole("button", { name: "Consultar UF", exact: true })).toBeDisabled();
  await expect(form.getByRole("button", { name: "Convertir", exact: true })).toBeDisabled();
});

test("Consulta una fecha histórica sin modificar el KPI", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-12T01:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  const queries: Record<string, string>[] = [];
  await page.route("**/api/uf?*", (route) => {
    const query = Object.fromEntries(new URL(route.request().url()).searchParams);
    queries.push(query);
    return route.fulfill({ json: [query.startDate === "2026-11-10"
      ? { indexDateString: "10-11-2026", value: "39999.50", statusCode: "OK" }
      : { indexDateString: "11-11-2026", value: "40000.25", statusCode: "OK" }] });
  });
  await page.goto("/");
  const kpi = page.getByRole("region", { name: "UF de hoy", exact: true });
  await expect(kpi).toContainText("$40.000,25");
  const form = page.getByRole("form", { name: "Consulta y conversión UF", exact: true });
  await form.getByLabel("Fecha UF", { exact: true }).fill("2026-11-10");
  await form.getByLabel("Monto en UF", { exact: true }).fill("1");
  await form.getByLabel("Monto en UF", { exact: true }).blur();
  await form.getByRole("button", { name: "Consultar UF", exact: true }).click();
  await expect(form).toContainText("1 UF: $39.999,50");
  await expect(form.locator("time")).toHaveText("10-11-2026");
  await expect(kpi).toContainText("$40.000,25");
  await expect(kpi.locator("time")).toHaveText("11-11-2026");
  expect(queries).toEqual([
    { startDate: "2026-11-11", endDate: "2026-11-11" },
    { startDate: "2026-11-10", endDate: "2026-11-10" },
  ]);
});

test("Rechaza fechas vacías o inválidas y posteriores a hoy sin consultar", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-12T01:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  let requests = 0;
  await page.route("**/api/uf?*", (route) => {
    requests += 1;
    return route.fulfill({ json: [{ indexDateString: "11-11-2026", value: "40000.25", statusCode: "OK" }] });
  });
  await page.goto("/");
  await expect(page.getByRole("region", { name: "UF de hoy", exact: true })).toContainText("$40.000,25");
  const form = page.getByRole("form", { name: "Consulta y conversión UF", exact: true });
  await form.evaluate((element: HTMLFormElement) => { element.noValidate = true; });
  await form.getByLabel("Monto en UF", { exact: true }).fill("1");
  await form.getByLabel("Monto en UF", { exact: true }).blur();
  const date = form.getByLabel("Fecha UF", { exact: true });
  for (const [value, message] of [
    ["", "Selecciona una fecha válida"],
    ["2026-02-30", "Selecciona una fecha válida"],
    ["2026-11-12", "Las fechas no pueden ser posteriores a hoy"],
  ]) {
    // El input date normaliza una fecha imposible a vacío.
    await date.evaluate((input: HTMLInputElement, value) => { input.value = value; }, value);
    await form.getByRole("button", { name: "Consultar UF", exact: true }).click();
    await expect(form.getByRole("alert")).toHaveText(message);
    expect(requests).toBe(1);
  }
});

test("Informa ausencia de datos en la consulta secundaria", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-12T01:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/uf?*", (route) => route.fulfill({ json:
    new URL(route.request().url()).searchParams.get("startDate") === "2026-11-11"
      ? [{ indexDateString: "11-11-2026", value: "40000.25", statusCode: "OK" }]
      : [],
  }));
  await page.goto("/");
  const form = page.getByRole("form", { name: "Consulta y conversión UF", exact: true });
  await expect(form.getByRole("alert")).toHaveCount(0);
  await form.getByLabel("Monto en UF", { exact: true }).fill("1");
  await form.getByLabel("Monto en UF", { exact: true }).blur();
  await form.getByRole("button", { name: "Consultar UF", exact: true }).click();
  await expect(form).toContainText("1 UF: $40.000,25");
  await form.getByLabel("Fecha UF", { exact: true }).fill("2026-11-10");
  await form.getByRole("button", { name: "Consultar UF", exact: true }).click();
  await expect(form.getByRole("alert")).toHaveText("Sin datos de UF para la fecha seleccionada.");
  await expect(form.locator("time")).toHaveCount(0);
  await expect(form).not.toContainText("$");
  const kpi = page.getByRole("region", { name: "UF de hoy", exact: true });
  await expect(kpi).toContainText("$40.000,25");
  await expect(kpi.locator("time")).toHaveText("11-11-2026");
});

test("Informa fallos en la consulta secundaria y permite reintentar", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-12T01:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  let failure: string | null = null;
  await page.route("**/api/uf?*", (route) => {
    const historical = new URL(route.request().url()).searchParams.get("startDate") === "2026-11-10";
    if (historical && failure === "network") return route.abort("failed");
    if (historical && failure === "http") return route.fulfill({ status: 502, json: { error: "Error del proveedor" } });
    return route.fulfill({ json: [historical
      ? { indexDateString: "10-11-2026", value: "39999.50", statusCode: "OK" }
      : { indexDateString: "11-11-2026", value: "40000.25", statusCode: "OK" }] });
  });
  await page.goto("/");
  const form = page.getByRole("form", { name: "Consulta y conversión UF", exact: true });
  await form.getByLabel("Monto en UF", { exact: true }).fill("1");
  await form.getByLabel("Monto en UF", { exact: true }).blur();
  await form.getByRole("button", { name: "Consultar UF", exact: true }).click();
  await expect(form).toContainText("1 UF: $40.000,25");
  await form.getByLabel("Fecha UF", { exact: true }).fill("2026-11-10");
  for (const outcome of ["http", "network"]) {
    failure = outcome;
    await form.getByRole("button", { name: "Consultar UF", exact: true }).click();
    await expect(form.getByRole("alert")).toHaveText("No fue posible consultar la UF. Intenta nuevamente.");
    await expect(form.locator("time")).toHaveCount(0);
    await expect(form).not.toContainText("$");
    failure = null;
    await form.getByRole("button", { name: "Consultar UF", exact: true }).click();
    await expect(form).toContainText("1 UF: $39.999,50");
    await expect(form.locator("time")).toHaveText("10-11-2026");
    await expect(form.getByRole("alert")).toHaveCount(0);
  }
  const kpi = page.getByRole("region", { name: "UF de hoy", exact: true });
  await expect(kpi).toContainText("$40.000,25");
  await expect(kpi.locator("time")).toHaveText("11-11-2026");
});

test("Rechaza consultar cero UF sin hacer una petición y permite corregir el monto", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-12T01:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  let requests = 0;
  await page.route("**/api/uf?*", (route) => {
    requests += 1;
    return route.fulfill({ json: [{ indexDateString: "11-11-2026", value: "40000.25", statusCode: "OK" }] });
  });
  await page.goto("/");
  await expect(page.getByRole("region", { name: "UF de hoy", exact: true })).toContainText("$40.000,25");
  const form = page.getByRole("form", { name: "Consulta y conversión UF", exact: true });
  for (const amount of ["0", "0.0"]) {
    await form.getByLabel("Monto en UF", { exact: true }).fill(amount);
    await form.getByLabel("Monto en UF", { exact: true }).blur();
    await expect(form.getByRole("button", { name: "Consultar UF", exact: true })).toBeDisabled();
    await expect(form.locator("time")).toHaveCount(0);
    expect(requests).toBe(1);
  }
  await form.getByLabel("Monto en UF", { exact: true }).fill("1");
  await form.getByLabel("Monto en UF", { exact: true }).blur();
  await form.getByRole("button", { name: "Consultar UF", exact: true }).click();
  await expect(form).toContainText("1 UF: $40.000,25");
  await expect(form.getByRole("alert")).toHaveCount(0);
  expect(requests).toBe(2);
});

test("Rechaza consultar montos fraccionarios sin hacer una petición y permite corregir el monto", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-12T01:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  let requests = 0;
  await page.route("**/api/uf?*", (route) => {
    requests += 1;
    return route.fulfill({ json: [{ indexDateString: "11-11-2026", value: "40000.25", statusCode: "OK" }] });
  });
  await page.goto("/");
  await expect(page.getByRole("region", { name: "UF de hoy", exact: true })).toContainText("$40.000,25");
  const form = page.getByRole("form", { name: "Consulta y conversión UF", exact: true });
  for (const amount of ["0.5", "2.5"]) {
    await form.getByLabel("Monto en UF", { exact: true }).fill(amount);
    await form.getByLabel("Monto en UF", { exact: true }).blur();
    await expect(form.getByRole("button", { name: "Consultar UF", exact: true })).toBeDisabled();
    await expect(form.locator("time")).toHaveCount(0);
    expect(requests).toBe(1);
  }
  for (const [amount, expectedRequests] of [["1", 2], ["2.0", 3]] as const) {
    await form.getByLabel("Monto en UF", { exact: true }).fill(amount);
    await form.getByLabel("Monto en UF", { exact: true }).blur();
    await form.getByRole("button", { name: "Consultar UF", exact: true }).click();
    await expect(form).toContainText("1 UF: $40.000,25");
    await expect(form.getByRole("alert")).toHaveCount(0);
    await expect.poll(() => requests).toBe(expectedRequests);
  }
});

test("Consulta la equivalencia de montos enteros con ceros a la derecha", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-12T01:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/uf?*", (route) => {
    const date = new URL(route.request().url()).searchParams.get("startDate")!;
    return route.fulfill({ json: [{ indexDateString: date.split("-").reverse().join("-"), value: "40000.25", statusCode: "OK" }] });
  });
  await page.goto("/");
  const form = page.getByRole("form", { name: "Consulta y conversión UF", exact: true });
  await form.getByLabel("Fecha UF", { exact: true }).fill("2026-11-10");
  for (const [amount, pesos] of [["100", "$4.000.025"], ["1000", "$40.000.250"], ["10000", "$400.002.500"]]) {
    await form.getByLabel("Monto en UF", { exact: true }).fill(amount);
    await form.getByLabel("Monto en UF", { exact: true }).blur();
    await form.getByRole("button", { name: "Consultar UF", exact: true }).click();
    const result = form.getByRole("region", { name: "Resultado de consulta UF", exact: true });
    await expect(result).toContainText(`Equivalencia de ${amount} UF: ${pesos}`);
    await expect(result.locator("time")).toHaveText("10-11-2026");
    await expect(result).toContainText("1 UF: $40.000,25");
    await expect(form.getByLabel("Monto en UF", { exact: true })).toHaveValue(amount);
  }
});
