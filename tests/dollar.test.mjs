import assert from "node:assert/strict";
import test from "node:test";

test("Consulta la serie del dólar para el rango solicitado desde el servidor", async (t) => {
  const originalToken = process.env.BCCH_API_TOKEN;
  t.after(() => {
    if (originalToken === undefined) delete process.env.BCCH_API_TOKEN;
    else process.env.BCCH_API_TOKEN = originalToken;
  });
  process.env.BCCH_API_TOKEN = "token-de-prueba";
  const observations = [{ indexDateString: "02-11-2026", value: "950.25", statusCode: "OK" }];
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ Codigo: 0, Series: { Obs: observations } }),
  );
  const { getDollarSeries } = await import("../src/lib/dollar.ts");

  assert.deepEqual(await getDollarSeries("2026-11-01", "2026-11-11"), observations);
  assert.equal(fetchMock.mock.callCount(), 1);
  const url = new URL(fetchMock.mock.calls[0].arguments[0]);
  assert.equal(url.origin + url.pathname, "https://si3.bcentral.cl/SieteRestWS/SieteRestWS.ashx");
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    token: "token-de-prueba",
    function: "GetSeries",
    timeseries: "F073.TCO.PRE.Z.D",
    firstdate: "2026-11-01",
    lastdate: "2026-11-11",
  });
});

test("Devuelve las observaciones del rango mediante un endpoint del servidor", async (t) => {
  const originalToken = process.env.BCCH_API_TOKEN;
  t.after(() => {
    if (originalToken === undefined) delete process.env.BCCH_API_TOKEN;
    else process.env.BCCH_API_TOKEN = originalToken;
  });
  process.env.BCCH_API_TOKEN = "token-del-servidor";
  const observations = [{ indexDateString: "03-11-2026", value: "952.50", statusCode: "OK" }];
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ Codigo: 0, Series: { Obs: observations } }),
  );
  const { GET } = await import("../src/app/api/dollar/route.ts");
  const response = await GET(new Request("http://localhost/api/dollar?startDate=2026-11-02&endDate=2026-11-10"));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), observations);
  assert.equal(fetchMock.mock.callCount(), 1);
  const url = new URL(fetchMock.mock.calls[0].arguments[0]);
  assert.equal(url.searchParams.get("firstdate"), "2026-11-02");
  assert.equal(url.searchParams.get("lastdate"), "2026-11-10");
  assert.equal(url.searchParams.get("token"), "token-del-servidor");
});

test("Rechaza inicio posterior al fin con HTTP 400 sin consultar al Banco Central", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ Codigo: 0, Series: { Obs: [] } }),
  );
  const { GET } = await import("../src/app/api/dollar/route.ts");
  const response = await GET(new Request("http://localhost/api/dollar?startDate=2026-11-10&endDate=2026-11-02"));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "La fecha inicial no puede ser posterior a la fecha final",
  });
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("Rechaza fechas futuras desde el endpoint usando America/Santiago", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.parse("2026-11-12T01:00:00Z") });
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ Codigo: 0, Series: { Obs: [] } }),
  );
  const { GET } = await import("../src/app/api/dollar/route.ts");

  for (const startDate of ["2026-11-11", "2026-11-12"]) {
    const response = await GET(new Request(
      `http://localhost/api/dollar?startDate=${startDate}&endDate=2026-11-12`,
    ));

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Las fechas no pueden ser posteriores a hoy" });
  }
  assert.equal(fetchMock.mock.callCount(), 0);
});
