import assert from "node:assert/strict";
import test from "node:test";
import { getPreviousMonthRange } from "../src/lib/dates.ts";
import { toElapsedDayPoints } from "../src/lib/dollar-comparison.ts";

test("El mes anterior respeta enero, febrero bisiesto y las distintas duraciones", () => {
  for (const [today, startDate, endDate] of [
    ["2026-11-21", "2026-10-01", "2026-10-31"],
    ["2026-01-01", "2025-12-01", "2025-12-31"],
    ["2024-03-15", "2024-02-01", "2024-02-29"],
    ["2025-03-31", "2025-02-01", "2025-02-28"],
    ["2026-05-01", "2026-04-01", "2026-04-30"],
  ]) {
    assert.deepEqual(getPreviousMonthRange(today), { startDate, endDate });
  }
});

test("Alinea por días calendario desde cada inicio sin rellenar días ni prolongar series", () => {
  const first = toElapsedDayPoints({ startDate: "2026-11-01", endDate: "2026-11-11" }, [
    { indexDateString: "02-11-2026", value: "950.25", statusCode: "OK" },
    { indexDateString: "06-11-2026", value: "952.50", statusCode: "OK" },
    { indexDateString: "09-11-2026", value: "954.75", statusCode: "OK" },
  ]);
  const second = toElapsedDayPoints({ startDate: "2026-10-01", endDate: "2026-10-05" }, [
    { indexDateString: "01-10-2026", value: "900.25", statusCode: "OK" },
    { indexDateString: "02-10-2026", value: "902.50", statusCode: "OK" },
    { indexDateString: "05-10-2026", value: "905.75", statusCode: "OK" },
  ]);
  assert.deepEqual(first, [
    { name: "02-11-2026", value: [1, 950.25] },
    { name: "06-11-2026", value: [5, 952.5] },
    { name: "09-11-2026", value: [8, 954.75] },
  ]);
  assert.deepEqual(second, [
    { name: "01-10-2026", value: [0, 900.25] },
    { name: "02-10-2026", value: [1, 902.5] },
    { name: "05-10-2026", value: [4, 905.75] },
  ]);
});

test("Calcula días enteros al cruzar mes, año, día bisiesto o cambios de hora de Santiago", () => {
  for (const [startDate, endDate, observationDate, elapsed] of [
    ["2026-01-30", "2026-02-02", "02-02-2026", 3],
    ["2025-12-30", "2026-01-02", "02-01-2026", 3],
    ["2024-02-28", "2024-03-01", "01-03-2024", 2],
    ["2026-04-04", "2026-04-06", "06-04-2026", 2],
    ["2026-09-05", "2026-09-07", "07-09-2026", 2],
    ["2026-11-02", "2026-11-02", "02-11-2026", 0],
  ]) {
    assert.deepEqual(toElapsedDayPoints({ startDate, endDate }, [
      { indexDateString: observationDate, value: "950.25", statusCode: "OK" },
    ]), [{ name: observationDate, value: [elapsed, 950.25] }]);
  }
});

test("Un período vacío no genera puntos en cero y las observaciones se ordenan por fecha", () => {
  const period = { startDate: "2026-11-01", endDate: "2026-11-03" };
  assert.deepEqual(toElapsedDayPoints(period, []), []);
  const observations = [
    { indexDateString: "03-11-2026", value: "952.5", statusCode: "OK" },
    { indexDateString: "02-11-2026", value: "950.25", statusCode: "OK" },
  ];
  assert.deepEqual(toElapsedDayPoints(period, observations).map(({ value }) => value), [[1, 950.25], [2, 952.5]]);
  assert.equal(observations[0].indexDateString, "03-11-2026");
});
