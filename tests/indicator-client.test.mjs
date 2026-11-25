import assert from "node:assert/strict";
import test from "node:test";
import { fetchIndicatorObservations } from "../src/lib/indicator-client.ts";

test("Conserva los resultados de llamadas independientes y propaga el fallo de cada petición", async (t) => {
  const observations = [{ indexDateString: "02-11-2026", value: "950.25", statusCode: "OK" }];
  let release;
  const pendingResponse = new Promise((resolve) => { release = resolve; });
  t.mock.method(globalThis, "fetch", async (url) => {
    const startDate = new URL(url, "http://localhost").searchParams.get("startDate");
    if (startDate === "2026-11-02") return pendingResponse;
    if (startDate === "2026-11-03") return Response.json({ error: "Servicio no disponible" }, { status: 503 });
    return Response.json(null);
  });

  // La primera petición queda pendiente mientras terminan la fallida y la vacía.
  const first = fetchIndicatorObservations("2026-11-02", "2026-11-02");
  const failed = fetchIndicatorObservations("2026-11-03", "2026-11-03");
  const empty = fetchIndicatorObservations("2026-11-04", "2026-11-04");
  await assert.rejects(failed, /Consulta fallida/);
  assert.deepEqual(await empty, []);
  release(Response.json(observations));
  assert.deepEqual(await first, observations);
});
