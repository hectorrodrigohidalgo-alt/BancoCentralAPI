import { expect, test } from "@playwright/test";

test.use({ timezoneId: "Asia/Tokyo" });

test("Convierte montos decimales positivos sin realizar otra consulta", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-12T01:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  let requests = 0;
  await page.route("**/api/uf?*", (route) => {
    requests += 1;
    const historical = new URL(route.request().url()).searchParams.get("startDate") === "2026-11-10";
    return route.fulfill({ json: [historical
      ? { indexDateString: "10-11-2026", value: "40000.40", statusCode: "OK" }
      : { indexDateString: "11-11-2026", value: "40000.25", statusCode: "OK" }] });
  });
  await page.goto("/");
  await expect(page.getByRole("region", { name: "UF de hoy", exact: true })).toContainText("$40.000,25");
  const form = page.getByRole("form", { name: "Consulta y conversión UF", exact: true });
  const convert = form.getByRole("button", { name: "Convertir", exact: true });
  await expect(convert).toBeDisabled();
  await form.getByLabel("Fecha UF", { exact: true }).fill("2026-11-10");
  await form.getByLabel("Monto en UF", { exact: true }).fill("1");
  await form.getByLabel("Monto en UF", { exact: true }).blur();
  await form.getByRole("button", { name: "Consultar UF", exact: true }).click();
  await expect(form).toContainText("1 UF: $40.000,40");
  await form.getByLabel("Monto en UF", { exact: true }).fill("2.5");
  await form.getByLabel("Monto en UF", { exact: true }).blur();
  await convert.click();
  await expect(form).toContainText("Equivalencia: $100.001");
  expect(requests).toBe(2);
});

test("Habilita únicamente la acción correspondiente al salir del campo de monto", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-12T01:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/uf?*", (route) => route.fulfill({ json: [
    { indexDateString: "11-11-2026", value: "40000.25", statusCode: "OK" },
  ] }));
  await page.goto("/");
  const form = page.getByRole("form", { name: "Consulta y conversión UF", exact: true });
  const amount = form.getByLabel("Monto en UF", { exact: true });
  const convert = form.getByRole("button", { name: "Convertir", exact: true });
  const consult = form.getByRole("button", { name: "Consultar UF", exact: true });
  for (const [value, action] of [
    ["1", "consult"], ["2.5", "convert"], ["2.0", "consult"],
    ["0.5", "convert"], ["-0.5", "none"], ["0", "none"], ["", "none"],
  ] as const) {
    await amount.fill(value);
    await expect(consult).toBeDisabled();
    await expect(convert).toBeDisabled();
    await amount.press("Tab");
    if (action === "consult") await expect(consult).toBeEnabled();
    else await expect(consult).toBeDisabled();
    if (action === "convert") await expect(convert).toBeEnabled();
    else await expect(convert).toBeDisabled();
  }
});

test("Redondea al peso más cercano y muestra fecha y valor UF utilizados, reemplazando el resultado de consulta", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-12T01:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/uf?*", (route) => {
    const historical = new URL(route.request().url()).searchParams.get("startDate") === "2026-11-10";
    return route.fulfill({ json: [historical
      ? { indexDateString: "10-11-2026", value: "40000.20", statusCode: "OK" }
      : { indexDateString: "11-11-2026", value: "40000.25", statusCode: "OK" }] });
  });
  await page.goto("/");
  const form = page.getByRole("form", { name: "Consulta y conversión UF", exact: true });
  await form.getByLabel("Fecha UF", { exact: true }).fill("2026-11-10");
  await form.getByLabel("Monto en UF", { exact: true }).fill("1");
  await form.getByLabel("Monto en UF", { exact: true }).blur();
  await form.getByRole("button", { name: "Consultar UF", exact: true }).click();
  await expect(form.getByText("1 UF: $40.000,20", { exact: true })).toBeVisible();
  for (const [amount, pesos] of [["1.25", "$50.000"], ["2.5", "$100.001"], ["3.75", "$150.001"]]) {
    await form.getByLabel("Monto en UF", { exact: true }).fill(amount);
    await form.getByLabel("Monto en UF", { exact: true }).blur();
    await form.getByRole("button", { name: "Convertir", exact: true }).click();
    const conversion = form.getByRole("region", { name: "Resultado de conversión UF", exact: true });
    await expect(conversion).toContainText(`Equivalencia: ${pesos}`);
    await expect(conversion.locator("time")).toHaveText("10-11-2026");
    await expect(conversion).toContainText("Valor UF utilizado: $40.000,20");
    await expect(form.getByText("1 UF: $40.000,20", { exact: true })).toHaveCount(0);
  }
});

test("Impide convertir montos enteros, cero, negativos, vacíos o no finitos", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-12T01:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/uf?*", (route) => route.fulfill({ json: [
    { indexDateString: "11-11-2026", value: "40000.25", statusCode: "OK" },
  ] }));
  await page.goto("/");
  const form = page.getByRole("form", { name: "Consulta y conversión UF", exact: true });
  await form.getByLabel("Monto en UF", { exact: true }).fill("1");
  await form.getByLabel("Monto en UF", { exact: true }).blur();
  await form.getByRole("button", { name: "Consultar UF", exact: true }).click();
  await expect(form).toContainText("1 UF: $40.000,25");
  const amount = form.getByLabel("Monto en UF", { exact: true });
  const convert = form.getByRole("button", { name: "Convertir", exact: true });
  for (const value of ["2", "2.0", "0", "-0.5", "", "1e309", "-1e309"]) {
    await amount.fill(value);
    await amount.blur();
    await expect(convert).toBeDisabled();
    await expect(form.getByRole("region", { name: "Resultado de conversión UF", exact: true })).toHaveCount(0);
    await expect(form).not.toContainText("Equivalencia:");
  }
  await amount.fill("0.5");
  await amount.blur();
  await expect(convert).toBeEnabled();
});

test("Convierte un decimal sin consulta previa obteniendo la UF de la fecha seleccionada", async ({ page }) => {
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
  await form.getByLabel("Monto en UF", { exact: true }).fill("2.5");
  await form.getByLabel("Monto en UF", { exact: true }).blur();
  await form.getByRole("button", { name: "Convertir", exact: true }).click();
  const conversion = form.getByRole("region", { name: "Resultado de conversión UF", exact: true });
  await expect(conversion).toContainText("Equivalencia: $99.999");
  await expect(conversion.locator("time")).toHaveText("10-11-2026");
  await expect(conversion).toContainText("Valor UF utilizado: $39.999,50");
  expect(queries).toEqual([
    { startDate: "2026-11-11", endDate: "2026-11-11" },
    { startDate: "2026-11-10", endDate: "2026-11-10" },
  ]);
  await expect(kpi).toContainText("$40.000,25");
  await expect(kpi.locator("time")).toHaveText("11-11-2026");
});

test("Muestra carga y deshabilita ambas acciones mientras obtiene la UF al convertir", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-12T01:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/uf?*", async (route) => {
    const date = new URL(route.request().url()).searchParams.get("startDate")!;
    if (date === "2026-11-10") await pending;
    await route.fulfill({ json: [{ indexDateString: date.split("-").reverse().join("-"), value: "40000.40", statusCode: "OK" }] });
  });
  try {
    await page.goto("/");
    const form = page.getByRole("form", { name: "Consulta y conversión UF", exact: true });
    await form.getByLabel("Fecha UF", { exact: true }).fill("2026-11-10");
    await form.getByLabel("Monto en UF", { exact: true }).fill("2.5");
    await form.getByLabel("Monto en UF", { exact: true }).blur();
    const convert = form.getByRole("button", { name: "Convertir", exact: true });
    const consult = form.getByRole("button", { name: "Consultar UF", exact: true });
    await convert.click();
    await expect(form.getByRole("status")).toHaveText("Cargando…");
    await expect(convert).toBeDisabled();
    await expect(consult).toBeDisabled();
    release();
    await expect(form).toContainText("Equivalencia: $100.001");
    await expect(form.getByRole("status")).toHaveCount(0);
    await expect(convert).toBeEnabled();
    await expect(consult).toBeDisabled();
  } finally {
    release();
  }
});

test("Informa ausencia de datos al convertir y permite reintentar", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-12T01:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  let available = false;
  let historicalRequests = 0;
  await page.route("**/api/uf?*", (route) => {
    const historical = new URL(route.request().url()).searchParams.get("startDate") === "2026-11-10";
    if (historical) historicalRequests += 1;
    return route.fulfill({ json: historical
      ? available ? [{ indexDateString: "10-11-2026", value: "40000.40", statusCode: "OK" }] : []
      : [{ indexDateString: "11-11-2026", value: "40000.25", statusCode: "OK" }] });
  });
  await page.goto("/");
  const form = page.getByRole("form", { name: "Consulta y conversión UF", exact: true });
  await form.getByLabel("Fecha UF", { exact: true }).fill("2026-11-10");
  await form.getByLabel("Monto en UF", { exact: true }).fill("2.5");
  await form.getByLabel("Monto en UF", { exact: true }).blur();
  const convert = form.getByRole("button", { name: "Convertir", exact: true });
  await convert.click();
  await expect(form.getByRole("alert")).toHaveText("Sin datos de UF para la fecha seleccionada.");
  await expect(form.getByRole("status")).toHaveCount(0);
  await expect(form.getByRole("region", { name: "Resultado de conversión UF", exact: true })).toHaveCount(0);
  await expect(form).not.toContainText("Equivalencia:");
  await expect(convert).toBeEnabled();
  available = true;
  await convert.click();
  await expect(form).toContainText("Equivalencia: $100.001");
  await expect(form.getByRole("alert")).toHaveCount(0);
  expect(historicalRequests).toBe(2);
  await expect(page.getByRole("region", { name: "UF de hoy", exact: true })).toContainText("$40.000,25");
});

test("Informa errores HTTP y de red al convertir y permite reintentar", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-12T01:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  let failure = "http";
  let shouldFail = true;
  let historicalRequests = 0;
  await page.route("**/api/uf?*", (route) => {
    const historical = new URL(route.request().url()).searchParams.get("startDate") === "2026-11-10";
    if (historical) historicalRequests += 1;
    if (historical && shouldFail) return failure === "network"
      ? route.abort("failed")
      : route.fulfill({ status: 502, json: { error: "Error del proveedor" } });
    return route.fulfill({ json: [historical
      ? { indexDateString: "10-11-2026", value: "40000.40", statusCode: "OK" }
      : { indexDateString: "11-11-2026", value: "40000.25", statusCode: "OK" }] });
  });
  for (const outcome of ["http", "network"]) {
    failure = outcome;
    shouldFail = true;
    await page.goto("/");
    const form = page.getByRole("form", { name: "Consulta y conversión UF", exact: true });
    await form.getByLabel("Fecha UF", { exact: true }).fill("2026-11-10");
    await form.getByLabel("Monto en UF", { exact: true }).fill("2.5");
    await form.getByLabel("Monto en UF", { exact: true }).blur();
    const convert = form.getByRole("button", { name: "Convertir", exact: true });
    await convert.click();
    await expect(form.getByRole("alert")).toHaveText("No fue posible consultar la UF. Intenta nuevamente.");
    await expect(form.getByRole("status")).toHaveCount(0);
    await expect(form).not.toContainText("Equivalencia:");
    await expect(convert).toBeEnabled();
    await expect(form.getByRole("button", { name: "Consultar UF", exact: true })).toBeDisabled();
    shouldFail = false;
    await convert.click();
    await expect(form).toContainText("Equivalencia: $100.001");
    await expect(form.getByRole("alert")).toHaveCount(0);
    await expect(page.getByRole("region", { name: "UF de hoy", exact: true })).toContainText("$40.000,25");
  }
  expect(historicalRequests).toBe(4);
});

test("Invalida el resultado al cambiar la fecha o el monto", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-12T01:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  const queries: string[] = [];
  await page.route("**/api/uf?*", (route) => {
    const date = new URL(route.request().url()).searchParams.get("startDate")!;
    queries.push(date);
    return route.fulfill({ json: [{ indexDateString: date.split("-").reverse().join("-"),
      value: date === "2026-11-10" ? "39999.50" : "40000.40", statusCode: "OK" }] });
  });
  await page.goto("/");
  await expect(page.getByRole("region", { name: "UF de hoy", exact: true })).toContainText("$40.000,40");
  const form = page.getByRole("form", { name: "Consulta y conversión UF", exact: true });
  const date = form.getByLabel("Fecha UF", { exact: true });
  const amount = form.getByLabel("Monto en UF", { exact: true });
  const convert = form.getByRole("button", { name: "Convertir", exact: true });
  const conversion = form.getByRole("region", { name: "Resultado de conversión UF", exact: true });
  await date.fill("2026-11-10");
  await amount.fill("2.5");
  await amount.blur();
  await convert.click();
  await expect(conversion).toContainText("Equivalencia: $99.999");
  await amount.fill("3.5");
  await expect(conversion).toHaveCount(0);
  await expect(form).toContainText("1 UF: $39.999,50");
  await expect(convert).toBeDisabled();
  await amount.blur();
  await convert.click();
  await expect(conversion).toContainText("Equivalencia: $139.998");
  expect(queries).toEqual(["2026-11-11", "2026-11-10"]);
  await date.fill("2026-11-09");
  await expect(conversion).toHaveCount(0);
  await expect(form.locator("time")).toHaveCount(0);
  await expect(form).not.toContainText("1 UF:");
  await convert.click();
  await expect(conversion).toContainText("Equivalencia: $140.001");
  await expect(conversion.locator("time")).toHaveText("09-11-2026");
  expect(queries).toEqual(["2026-11-11", "2026-11-10", "2026-11-09"]);
});

test("Ignora una respuesta pendiente si cambia la fecha o el monto", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-12T01:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  for (const [label, value] of [["Fecha UF", "2026-11-09"], ["Monto en UF", "3.5"]]) {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    await page.route("**/api/uf?*", async (route) => {
      const date = new URL(route.request().url()).searchParams.get("startDate")!;
      if (date === "2026-11-10") await pending;
      await route.fulfill({ json: [{ indexDateString: date.split("-").reverse().join("-"), value: "40000.40", statusCode: "OK" }] });
    });
    try {
      await page.goto("/");
      const form = page.getByRole("form", { name: "Consulta y conversión UF", exact: true });
      await form.getByLabel("Fecha UF", { exact: true }).fill("2026-11-10");
      await form.getByLabel("Monto en UF", { exact: true }).fill("2.5");
      await form.getByLabel("Monto en UF", { exact: true }).blur();
      await form.getByRole("button", { name: "Convertir", exact: true }).click();
      await expect(form.getByRole("status")).toHaveText("Cargando…");
      await form.getByLabel(label, { exact: true }).fill(value);
      await form.getByLabel(label, { exact: true }).blur();
      release();
      await expect(form.getByRole("status")).toHaveCount(0);
      await expect(form.getByRole("region", { name: "Resultado de conversión UF", exact: true })).toHaveCount(0);
      await expect(form.locator("time")).toHaveCount(0);
      await expect(form).not.toContainText("Equivalencia:");
      await expect(form.getByLabel(label, { exact: true })).toHaveValue(value);
      await expect(form.getByRole("button", { name: "Convertir", exact: true })).toBeEnabled();
    } finally {
      release();
      await page.unroute("**/api/uf?*");
    }
  }
});

test("Ignora errores pendientes si cambia la fecha o el monto", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-12T01:00:00Z"));
  await page.route("**/api/dollar?*", (route) => route.fulfill({ json: [] }));
  for (const [label, value, failure] of [["Fecha UF", "2026-11-09", "http"], ["Monto en UF", "3.5", "network"]]) {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    await page.route("**/api/uf?*", async (route) => {
      if (new URL(route.request().url()).searchParams.get("startDate") === "2026-11-10") {
        await pending;
        return failure === "network" ? route.abort("failed") : route.fulfill({ status: 502, json: { error: "Error del proveedor" } });
      }
      await route.fulfill({ json: [{ indexDateString: "11-11-2026", value: "40000.25", statusCode: "OK" }] });
    });
    try {
      await page.goto("/");
      const form = page.getByRole("form", { name: "Consulta y conversión UF", exact: true });
      await form.getByLabel("Fecha UF", { exact: true }).fill("2026-11-10");
      await form.getByLabel("Monto en UF", { exact: true }).fill("2.5");
      await form.getByLabel("Monto en UF", { exact: true }).blur();
      await form.getByRole("button", { name: "Convertir", exact: true }).click();
      await expect(form.getByRole("status")).toHaveText("Cargando…");
      await form.getByLabel(label, { exact: true }).fill(value);
      await form.getByLabel(label, { exact: true }).blur();
      release();
      await expect(form.getByRole("status")).toHaveCount(0);
      await expect(form.getByRole("alert")).toHaveCount(0);
      await expect(form).not.toContainText("Equivalencia:");
      await expect(form.getByLabel(label, { exact: true })).toHaveValue(value);
      await expect(form.getByRole("button", { name: "Convertir", exact: true })).toBeEnabled();
    } finally {
      release();
      await page.unroute("**/api/uf?*");
    }
  }
});
