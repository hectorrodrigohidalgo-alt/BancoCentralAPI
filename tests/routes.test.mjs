import assert from "node:assert/strict";
import test from "node:test";

test("Delega dólar al handler correspondiente y rechaza indicadores desconocidos sin consultar al proveedor", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.parse("2026-11-12T01:00:00Z") });
  const observations = [{ indexDateString: "03-11-2026", value: "952.50", statusCode: "OK" }];
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ Codigo: 0, Series: { Obs: observations } }),
  );
  const { GET } = await import("../src/app/api/[indicator]/route.ts");

  const unknown = await GET(new Request("http://localhost/api/desconocido"), {
    params: Promise.resolve({ indicator: "desconocido" }),
  });
  assert.equal(unknown.status, 404);
  assert.deepEqual(await unknown.json(), { error: "Indicador no encontrado" });
  assert.equal(fetchMock.mock.callCount(), 0);

  const response = await GET(new Request("http://localhost/api/dollar?startDate=2026-11-02&endDate=2026-11-10"), {
    params: Promise.resolve({ indicator: "dollar" }),
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), observations);
  assert.equal(fetchMock.mock.callCount(), 1);
  const url = new URL(fetchMock.mock.calls[0].arguments[0]);
  assert.equal(url.searchParams.get("timeseries"), "F073.TCO.PRE.Z.D");
  assert.equal(url.searchParams.get("firstdate"), "2026-11-02");
  assert.equal(url.searchParams.get("lastdate"), "2026-11-10");
});
