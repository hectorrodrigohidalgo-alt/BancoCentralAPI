import assert from "node:assert/strict";
import test from "node:test";

test("Consulta la serie UF para el rango solicitado con credenciales en el servidor", async (t) => {
  const originalToken = process.env.BCCH_API_TOKEN;
  t.after(() => {
    if (originalToken === undefined) delete process.env.BCCH_API_TOKEN;
    else process.env.BCCH_API_TOKEN = originalToken;
  });
  process.env.BCCH_API_TOKEN = "token-uf-de-prueba";
  const observations = [{ indexDateString: "02-11-2026", value: "40000.25", statusCode: "OK" }];
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ Codigo: 0, Series: { Obs: observations } }),
  );
  const { getUfSeries } = await import("../src/lib/uf.ts");

  assert.deepEqual(await getUfSeries("2026-11-01", "2026-11-11"), observations);
  assert.equal(fetchMock.mock.callCount(), 1);
  const url = new URL(fetchMock.mock.calls[0].arguments[0]);
  assert.equal(url.origin + url.pathname, "https://si3.bcentral.cl/SieteRestWS/SieteRestWS.ashx");
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    token: "token-uf-de-prueba",
    function: "GetSeries",
    timeseries: "F073.UFF.PRE.Z.D",
    firstdate: "2026-11-01",
    lastdate: "2026-11-11",
  });
});

test("Excluye observaciones UF inválidas sin convertirlas en cero", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ Codigo: 0, Series: { Obs: [
    { indexDateString: "02-11-2026", value: "40000.25", statusCode: "OK" },
    { indexDateString: "03-11-2026", value: "", statusCode: "OK" },
    { indexDateString: "04-11-2026", value: "   ", statusCode: "OK" },
    { indexDateString: "05-11-2026", value: null, statusCode: "OK" },
    { indexDateString: "06-11-2026", value: "NaN", statusCode: "OK" },
    { indexDateString: "07-11-2026", value: "Infinity", statusCode: "OK" },
    { indexDateString: "08-11-2026", value: "desconocido", statusCode: "OK" },
    { indexDateString: "09-11-2026", value: "40001.25", statusCode: "ND" },
    { indexDateString: "10-11-2026", value: "40002.50", statusCode: "OK" },
  ] } }));
  const { getUfSeries } = await import("../src/lib/uf.ts");

  assert.deepEqual(await getUfSeries("2026-11-02", "2026-11-10"), [
    { indexDateString: "02-11-2026", value: "40000.25", statusCode: "OK" },
    { indexDateString: "10-11-2026", value: "40002.50", statusCode: "OK" },
  ]);
});

test("Devuelve una lista vacía cuando UF no tiene observaciones", async (t) => {
  let observations = null;
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ Codigo: 0, Series: { Obs: observations } }),
  );
  const { getUfSeries } = await import("../src/lib/uf.ts");

  for (const empty of [null, undefined, []]) {
    observations = empty;
    assert.deepEqual(await getUfSeries("2026-11-01", "2026-11-11"), []);
  }
});

test("Rechaza fechas UF inválidas sin consultar al Banco Central", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.parse("2026-11-12T01:00:00Z") });
  const observations = [{ indexDateString: "02-11-2026", value: "40000.25", statusCode: "OK" }];
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ Codigo: 0, Series: { Obs: observations } }),
  );
  const { GET } = await import("../src/app/api/[indicator]/route.ts");
  const context = { params: Promise.resolve({ indicator: "uf" }) };

  for (const [startDate, endDate, message] of [
    ["2026-11-10", "2026-11-02", "La fecha inicial no puede ser posterior a la fecha final"],
    ["2026-11-20", "2026-11-19", "La fecha inicial no puede ser posterior a la fecha final"],
    ["2026-11-11", "2026-11-12", "Las fechas no pueden ser posteriores a hoy"],
    ["2026-11-12", "2026-11-12", "Las fechas no pueden ser posteriores a hoy"],
  ]) {
    const response = await GET(new Request(`http://localhost/api/uf?startDate=${startDate}&endDate=${endDate}`), context);
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: message });
    assert.equal(fetchMock.mock.callCount(), 0);
  }

  const corrected = await GET(new Request("http://localhost/api/uf?startDate=2026-11-01&endDate=2026-11-11"), context);
  assert.equal(corrected.status, 200);
  assert.deepEqual(await corrected.json(), observations);
  assert.equal(fetchMock.mock.callCount(), 1);
  const url = new URL(fetchMock.mock.calls[0].arguments[0]);
  assert.equal(url.searchParams.get("timeseries"), "F073.UFF.PRE.Z.D");
});

test("Comunica fallos del proveedor sin exponer credenciales ni detalles internos", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.parse("2026-11-12T01:00:00Z") });
  let failure = -5;
  const fetchMock = t.mock.method(globalThis, "fetch", async () => {
    if (failure === "network") throw new Error("Fallo interno: token=token-uf-de-prueba");
    return Response.json({
      Codigo: failure === "http" ? 0 : failure,
      Descripcion: "Detalle interno: token=token-uf-de-prueba",
      Series: { Obs: [] },
    }, { status: failure === "http" ? 503 : 200 });
  });
  const { GET } = await import("../src/app/api/[indicator]/route.ts");

  for (const outcome of [-5, 12345, "http", "network"]) {
    failure = outcome;
    const response = await GET(new Request("http://localhost/api/uf?startDate=2026-11-01&endDate=2026-11-11"), {
      params: Promise.resolve({ indicator: "uf" }),
    });
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), {
      error: "No fue posible consultar la UF. Intenta nuevamente.",
    });
  }
  assert.equal(fetchMock.mock.callCount(), 4);
});
