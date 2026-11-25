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
