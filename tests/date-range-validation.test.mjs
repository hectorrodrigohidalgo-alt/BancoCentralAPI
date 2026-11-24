import assert from "node:assert/strict";
import test from "node:test";
import { validateFullMonthRange } from "../src/lib/date-range-validation.ts";

test("Valida un único mes calendario completo según su duración y los años bisiestos", () => {
  const message = "Selecciona un mes calendario completo, desde el día 1 hasta el último día del mes.";
  for (const [startDate, endDate, expected] of [
    ["2025-02-01", "2025-02-28", null],
    ["2024-02-01", "2024-02-29", null],
    ["2026-06-01", "2026-06-30", null],
    ["2026-07-01", "2026-07-31", null],
    ["2025-12-01", "2025-12-31", null],
    ["1900-02-01", "1900-02-28", null],
    ["2000-02-01", "2000-02-29", null],
    ["2026-06-01", "2026-06-29", message],
    ["2026-06-02", "2026-06-30", message],
    ["2026-06-01", "2026-06-01", message],
    ["2026-06-15", "2026-07-14", message],
    ["2026-06-01", "2026-07-31", message],
    ["2025-12-01", "2026-01-31", message],
    ["2024-02-01", "2024-02-28", message],
    ["2025-02-01", "2025-02-29", message],
    ["2026-06-01", "2026-06-31", message],
  ]) {
    assert.equal(validateFullMonthRange(startDate, endDate), expected, `${startDate} a ${endDate}`);
  }
});
