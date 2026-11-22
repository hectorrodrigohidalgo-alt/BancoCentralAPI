import { expect, test, type Page } from "@playwright/test";

const firstObservations = [
  { indexDateString: "02-11-2026", value: "950.25", statusCode: "OK" },
  { indexDateString: "06-11-2026", value: "952.50", statusCode: "OK" },
];
const secondObservations = [
  { indexDateString: "01-10-2026", value: "900.25", statusCode: "OK" },
  { indexDateString: "02-10-2026", value: "902.50", statusCode: "OK" },
  { indexDateString: "05-10-2026", value: "905.75", statusCode: "OK" },
];

async function openDashboard(page: Page) {
  await page.clock.setFixedTime(new Date("2026-11-11T15:00:00Z"));
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Consultar", exact: true })).toBeEnabled();
}

async function selectPeriods(page: Page) {
  await page.getByLabel("Activar comparación").check();
  await page.getByLabel("Fecha inicial", { exact: true }).fill("2026-11-02");
  await page.getByLabel("Fecha final", { exact: true }).fill("2026-11-06");
  await page.getByLabel("Inicio del período 2").fill("2026-10-01");
  await page.getByLabel("Fin del período 2").fill("2026-10-10");
}

for (const [now, start, end] of [
  ["2026-11-11T15:00:00Z", "2026-10-01", "2026-10-31"],
  ["2026-01-01T15:00:00Z", "2025-12-01", "2025-12-31"],
  ["2024-03-01T15:00:00Z", "2024-02-01", "2024-02-29"],
  ["2025-03-01T15:00:00Z", "2025-02-01", "2025-02-28"],
  // En UTC ya es noviembre, pero en Santiago todavía es octubre.
  ["2026-11-01T01:00:00Z", "2026-09-01", "2026-09-30"],
]) {
  test(`Prepara el mes anterior (${start}) sin consultar al activar`, async ({ page }) => {
    const requests: string[] = [];
    await page.route("**/api/dollar?*", (route) => {
      requests.push(route.request().url());
      return route.fulfill({ json: [] });
    });
    await page.clock.setFixedTime(new Date(now));
    await page.goto("/");
    await expect(page.getByLabel("Activar comparación")).toBeEnabled();
    const before = requests.length;
    await page.getByLabel("Activar comparación").check();
    await expect(page.getByLabel("Inicio del período 2")).toHaveValue(start);
    await expect(page.getByLabel("Fin del período 2")).toHaveValue(end);
    await expect(page.getByRole("button", { name: "Comparar", exact: true })).toBeEnabled();
    expect(requests).toHaveLength(before);
  });
}

test("Superpone curvas por días transcurridos con leyenda, estilos y fechas reales en el tooltip", async ({ page }) => {
  const requests: URL[] = [];
  await page.route("**/api/dollar?*", (route) => {
    const url = new URL(route.request().url());
    requests.push(url);
    return route.fulfill({ json: url.searchParams.get("startDate") === "2026-10-01" ? secondObservations : firstObservations });
  });
  await openDashboard(page);
  await selectPeriods(page);
  const before = requests.length;
  await page.getByRole("button", { name: "Comparar", exact: true }).click();
  const chart = page.getByRole("img", { name: /Comparación del dólar/ });
  await expect(chart).toBeVisible();
  expect(requests.slice(before).map((url) => Object.fromEntries(url.searchParams))).toEqual(expect.arrayContaining([
    { startDate: "2026-11-02", endDate: "2026-11-06" },
    { startDate: "2026-10-01", endDate: "2026-10-10" },
  ]));
  expect(requests.length - before).toBe(2);
  await expect(chart).toHaveAttribute("aria-label", /Período 1.*Día 0, 02-11-2026: 950\.25.*Día 4, 06-11-2026: 952\.5/);
  await expect(chart).toHaveAttribute("aria-label", /Período 2.*Día 0, 01-10-2026: 900\.25.*Día 1, 02-10-2026: 902\.5.*Día 4, 05-10-2026: 905\.75/);
  await expect(chart.getByText("Período 1 (2026-11-02 a 2026-11-06)", { exact: true })).toBeVisible();
  await expect(chart.getByText("Período 2 (2026-10-01 a 2026-10-10)", { exact: true })).toBeVisible();
  await expect(chart.getByText("Días transcurridos", { exact: true })).toBeVisible();
  await expect(chart.getByText("CLP/USD", { exact: true })).toBeVisible();
  await expect(chart.locator('svg path[stroke="#2563eb"]').first()).toBeVisible();
  await expect(chart.locator('svg path[stroke="#b45309"][stroke-dasharray]').first()).toBeVisible();
  // El borde izquierdo del área de ejes corresponde al día 0 de ambos períodos.
  await chart.hover({ position: { x: 66, y: 180 } });
  await expect(page.getByRole("tooltip")).toContainText("Período 1 (2026-11-02 a 2026-11-06) — 02-11-2026: 950.25 CLP/USD");
  await expect(page.getByRole("tooltip")).toContainText("Período 2 (2026-10-01 a 2026-10-10) — 01-10-2026: 900.25 CLP/USD");
});

test("Espera ambas respuestas, bloquea envíos y modo, retira curvas anteriores y permite volver a consulta individual", async ({ page }) => {
  let hold = false;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  const requests: string[] = [];
  await page.route("**/api/dollar?*", async (route) => {
    const url = new URL(route.request().url());
    requests.push(url.search);
    if (hold && url.searchParams.get("startDate") === "2026-10-01") await pending;
    await route.fulfill({ json: url.searchParams.get("startDate") === "2026-10-01" ? secondObservations : firstObservations });
  });
  try {
    await openDashboard(page);
    await selectPeriods(page);
    await page.getByRole("button", { name: "Comparar", exact: true }).click();
    const chart = page.getByRole("img", { name: /Comparación del dólar/ });
    await expect(chart).toBeVisible();
    hold = true;
    const before = requests.length;
    await page.getByRole("button", { name: "Comparar", exact: true }).click();
    const status = page.getByRole("main").getByRole("status");
    await expect(status).toContainText("Período 1 (2026-11-02 a 2026-11-06)");
    await expect(status).toContainText("Período 2 (2026-10-01 a 2026-10-10)");
    await expect(page.getByRole("button", { name: "Comparar", exact: true })).toBeDisabled();
    await expect(page.getByLabel("Activar comparación")).toBeDisabled();
    await expect(page.getByLabel("Fecha inicial", { exact: true })).toBeDisabled();
    await expect(chart).toHaveCount(0);
    // Incluso un envío programático no inicia otra consulta durante la carga.
    await page.locator("form").evaluate((form: HTMLFormElement) => form.requestSubmit());
    await expect.poll(() => requests.length - before).toBe(2);
    release();
    await expect(chart).toBeVisible();
    await expect(status).toHaveCount(0);
    await page.getByLabel("Activar comparación").uncheck();
    await expect(page.getByLabel("Inicio del período 2")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Consultar", exact: true })).toBeEnabled();
    await expect(page.getByRole("img", { name: /Dólar observado/ })).toHaveAttribute("aria-label", /02-11-2026.*950\.25/);
    await expect(chart).toHaveCount(0);
  } finally {
    release();
  }
});

test("Actualiza ambos rangos y admite períodos de un día", async ({ page }) => {
  await page.route("**/api/dollar?*", (route) => {
    const start = new URL(route.request().url()).searchParams.get("startDate");
    return route.fulfill({ json: start === "2026-11-10"
      ? [{ indexDateString: "10-11-2026", value: "970.25", statusCode: "OK" }]
      : start === "2026-09-01"
        ? [{ indexDateString: "01-09-2026", value: "880.50", statusCode: "OK" }]
        : start === "2026-10-01" ? secondObservations : firstObservations });
  });
  await openDashboard(page);
  await selectPeriods(page);
  await page.getByRole("button", { name: "Comparar", exact: true }).click();
  const chart = page.getByRole("img", { name: /Comparación del dólar/ });
  await expect(chart).toHaveAttribute("aria-label", /950\.25.*900\.25/);
  await page.getByLabel("Fecha inicial", { exact: true }).fill("2026-11-10");
  await page.getByLabel("Fecha final", { exact: true }).fill("2026-11-10");
  await page.getByLabel("Inicio del período 2").fill("2026-09-01");
  await page.getByLabel("Fin del período 2").fill("2026-09-01");
  await page.getByRole("button", { name: "Comparar", exact: true }).click();
  await expect(chart).toHaveAttribute("aria-label", /Día 0, 10-11-2026: 970\.25.*Día 0, 01-09-2026: 880\.5/);
  await expect(chart).not.toHaveAttribute("aria-label", /950\.25|900\.25/);
  await expect(chart.locator("svg")).toBeVisible();
});

test("Rechaza períodos idénticos de un día sin consultar y conserva fechas y gráfico", async ({ page }) => {
  const requests: string[] = [];
  await page.route("**/api/dollar?*", (route) => {
    requests.push(route.request().url());
    return route.fulfill({ json: firstObservations });
  });
  await openDashboard(page);
  await selectPeriods(page);
  await page.getByRole("button", { name: "Comparar", exact: true }).click();
  const chart = page.getByRole("img", { name: /Comparación del dólar/ });
  await expect(chart).toBeVisible();
  const previousChart = await chart.getAttribute("aria-label");
  const before = requests.length;
  const fields = ["Fecha inicial", "Fecha final", "Inicio del período 2", "Fin del período 2"];
  for (const label of fields) {
    await page.getByLabel(label, { exact: true }).fill("2026-11-02");
  }

  await page.getByRole("button", { name: "Comparar", exact: true }).click();

  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Los períodos 1 y 2 no pueden tener el mismo rango de fechas.");
  await expect(page.getByRole("main").getByRole("status")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Comparar", exact: true })).toBeEnabled();
  await expect(chart).toBeVisible();
  await expect(chart).toHaveAttribute("aria-label", previousChart!);
  for (const label of fields) {
    await expect(page.getByLabel(label, { exact: true })).toHaveValue("2026-11-02");
  }
  expect(requests).toHaveLength(before);
});

for (const period of [1, 2]) {
  test(`Valida fechas requeridas, invertidas y futuras del período ${period} sin consultar`, async ({ page }) => {
    const requests: string[] = [];
    await page.route("**/api/dollar?*", (route) => {
      requests.push(route.request().url());
      return route.fulfill({ json: [] });
    });
    await openDashboard(page);
    await selectPeriods(page);
    const before = requests.length;
    const start = page.getByLabel(period === 1 ? "Fecha inicial" : "Inicio del período 2", { exact: true });
    const end = page.getByLabel(period === 1 ? "Fecha final" : "Fin del período 2", { exact: true });
    for (const [from, to, message] of [
      ["", "2026-11-10", "Selecciona ambas fechas"],
      ["2026-11-02", "", "Selecciona ambas fechas"],
      ["2026-11-10", "2026-11-02", "La fecha inicial no puede ser posterior a la fecha final"],
      ["2026-11-11", "2026-11-12", "Las fechas no pueden ser posteriores a hoy"],
      ["2026-11-12", "2026-11-12", "Las fechas no pueden ser posteriores a hoy"],
    ]) {
      await start.fill(from);
      await end.fill(to);
      await page.getByRole("button", { name: "Comparar", exact: true }).click();
      const alert = page.getByRole("main").getByRole("alert");
      await expect(alert).toContainText(`Período ${period}`);
      await expect(alert).toContainText(message);
      expect(requests).toHaveLength(before);
    }
  });
}

for (const [first, second] of [
  ["ok", "error"], ["error", "ok"], ["ok", "empty"], ["null", "ok"],
  ["error", "error"], ["empty", "null"], ["error", "null"],
]) {
  test(`Identifica resultados incompletos (${first}, ${second}) sin valores ausentes en cero`, async ({ page }) => {
    await page.route("**/api/dollar?*", (route) => {
      const isSecond = new URL(route.request().url()).searchParams.get("startDate") === "2026-10-01";
      const outcome = isSecond ? second : first;
      if (outcome === "error") return route.fulfill({ status: 503, json: { error: "Servicio no disponible" } });
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(outcome === "null" ? null : outcome === "empty" ? [] : isSecond ? secondObservations : firstObservations) });
    });
    await openDashboard(page);
    await selectPeriods(page);
    await page.getByRole("button", { name: "Comparar", exact: true }).click();
    const alert = page.getByRole("main").getByRole("alert");
    await expect(alert).toContainText("Comparación incompleta.");
    for (const [index, outcome] of [first, second].entries()) {
      if (outcome === "ok") continue;
      await expect(alert).toContainText(`Período ${index + 1}`);
      await expect(alert).toContainText(outcome === "error" ? "No fue posible consultar el dólar" : "Sin datos para el período seleccionado.");
    }
    const chart = page.getByRole("img", { name: /Comparación del dólar/ });
    if (first === "ok" || second === "ok") {
      await expect(chart).toBeVisible();
      await expect(chart).not.toHaveAttribute("aria-label", /: 0 CLP\/USD/);
      await expect(chart).toHaveAttribute("aria-label", first === "ok" ? /02-11-2026: 950\.25/ : /01-10-2026: 900\.25/);
    } else {
      await expect(chart).toHaveCount(0);
    }
    await expect(page.getByRole("button", { name: "Comparar", exact: true })).toBeEnabled();
  });
}
