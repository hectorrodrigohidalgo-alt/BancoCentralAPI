"use client";

import { useCallback, useEffect, useState } from "react";
import { validateDateRange, validateFullMonthRange } from "../lib/date-range-validation";
import { getPreviousMonthRange, getTodayInSantiago } from "../lib/dates";
import type { DollarObservation } from "../lib/dollar";
import { fetchIndicatorObservations } from "../lib/indicator-client";
import { getPeriodLabel, type DollarPeriod, type DollarPeriodResult } from "../lib/dollar-comparison";
import DollarChart from "./dollar-chart";

type QueryResult =
  | { mode: "single"; observations: DollarObservation[] }
  | { mode: "comparison"; periods: DollarPeriodResult[] };

export default function DateRange() {
  const [indicator, setIndicator] = useState<"dollar" | "uf">("dollar");
  const [today] = useState(getTodayInSantiago);
  const previousMonth = getPreviousMonthRange(today);
  const [startDate, setStartDate] = useState(`${today.slice(0, 7)}-01`);
  const [endDate, setEndDate] = useState(today);
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPeriods, setLoadingPeriods] = useState<DollarPeriod[]>([]);

  const queryIndicator = useCallback(async (startDate: string, endDate: string, indicator: "dollar" | "uf" = "dollar") => {
    setError("");
    // La consulta individual conserva su gráfico mientras espera, como antes.
    setResult((current) => current?.mode === "single" ? current : null);
    setLoadingPeriods([]);
    setIsLoading(true);
    try {
      const observations = await fetchIndicatorObservations(startDate, endDate, indicator);
      setResult({ mode: "single", observations });
    } catch {
      setError("No fue posible consultar el dólar. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => queryIndicator(`${today.slice(0, 7)}-01`, today));
  }, [queryIndicator, today]);

  async function queryComparison(periods: DollarPeriod[]) {
    setError("");
    setResult(null);
    setLoadingPeriods(periods);
    setIsLoading(true);
    // allSettled espera ambos períodos aunque uno falle; su orden coincide con el formulario.
    const responses = await Promise.allSettled(periods.map(({ startDate, endDate }) =>
      fetchIndicatorObservations(startDate, endDate, indicator),
    ));
    setResult({
      mode: "comparison",
      periods: responses.map((response, index) => ({
        period: periods[index],
        observations: response.status === "fulfilled" ? response.value : [],
        failed: response.status === "rejected",
      })),
    });
    setIsLoading(false);
  }

  function queryForm(form: HTMLFormElement, compare: boolean) {
    const values = new FormData(form);
    const periods = [{ startDate: String(values.get("startDate") ?? ""), endDate: String(values.get("endDate") ?? "") }];
    if (compare) {
      periods.push({ startDate: String(values.get("secondStartDate") ?? ""), endDate: String(values.get("secondEndDate") ?? "") });
      // Cada envío de comparación retira el gráfico anterior, incluso si las fechas son inválidas.
      setResult(null);
    }
    for (const [index, period] of periods.entries()) {
      const validationError = !period.startDate || !period.endDate
        ? "Selecciona ambas fechas"
        : validateDateRange(period.startDate, period.endDate, today);
      if (validationError) {
        setError(compare ? `${getPeriodLabel(period, index)}: ${validationError}` : validationError);
        return;
      }
    }
    if (compare) {
      for (const [index, period] of periods.entries()) {
        const validationError = validateFullMonthRange(period.startDate, period.endDate);
        if (validationError) {
          setError(`${getPeriodLabel(period, index)}: ${validationError}`);
          return;
        }
      }
      if (periods[0].startDate === periods[1].startDate && periods[0].endDate === periods[1].endDate) {
        setError("Los períodos 1 y 2 no pueden tener el mismo rango de fechas.");
        return;
      }
    }
    if (compare) void queryComparison(periods);
    else void queryIndicator(periods[0].startDate, periods[0].endDate, indicator);
  }

  const incomplete = result?.mode === "comparison" && result.periods.some(({ failed, observations }) => failed || observations.length === 0);
  const hasData = result?.mode === "single"
    ? result.observations.length > 0
    : result?.periods.some(({ observations }) => observations.length > 0);

  return (
    <form noValidate={comparisonEnabled} onSubmit={(event) => {
      event.preventDefault();
      if (!isLoading) queryForm(event.currentTarget, comparisonEnabled);
    }}>
      <label htmlFor="indicator">Indicador</label>
      <select id="indicator" value={indicator} disabled={isLoading} onChange={(event) => {
        setIndicator(event.currentTarget.value === "uf" ? "uf" : "dollar");
        setResult(null);
      }}>
        <option value="dollar">Dólar observado</option>
        <option value="uf">UF</option>
      </select>
      <label>
        <input type="checkbox" checked={comparisonEnabled} disabled={isLoading} onChange={(event) => {
          const enabled = event.currentTarget.checked;
          setComparisonEnabled(enabled);
          setError("");
          // Activar solo prepara el formulario; al salir consultamos el primer rango actual.
          if (enabled) {
            setStartDate(previousMonth.startDate);
            setEndDate(previousMonth.endDate);
          } else {
            setResult(null);
            queryForm(event.currentTarget.form!, false);
          }
        }} /> Activar comparación
      </label>
      <fieldset disabled={isLoading}>
        <legend>Período 1</legend>
        <label>
          Fecha inicial <input type="date" name="startDate" max={today} required={comparisonEnabled} value={startDate} onChange={(event) => setStartDate(event.currentTarget.value)} />
        </label>
        <label>
          Fecha final <input type="date" name="endDate" max={today} required={comparisonEnabled} value={endDate} onChange={(event) => setEndDate(event.currentTarget.value)} />
        </label>
      </fieldset>
      {comparisonEnabled && (
        <fieldset disabled={isLoading}>
          <legend>Período 2</legend>
          <label>
            Inicio del período 2 <input type="date" name="secondStartDate" max={today} required defaultValue={`${today.slice(0, 7)}-01`} />
          </label>
          <label>
            Fin del período 2 <input type="date" name="secondEndDate" max={today} required defaultValue={today} />
          </label>
        </fieldset>
      )}
      <button type="submit" disabled={isLoading}>{comparisonEnabled ? "Comparar" : "Consultar"}</button>
      {isLoading && <p role="status">{loadingPeriods.length > 0
        ? `Cargando ${loadingPeriods.map(getPeriodLabel).join(" y ")}…`
        : "Cargando…"}</p>}
      {error && <p role="alert">{error}</p>}
      {incomplete && (
        <div role="alert">
          <p>Comparación incompleta.</p>
          {result.periods.map(({ period, observations, failed }, index) => (
            (failed || observations.length === 0) && <p key={index}>
              {getPeriodLabel(period, index)}: {failed
                ? "No fue posible consultar el dólar. Intenta nuevamente."
                : "Sin datos para el período seleccionado."}
            </p>
          ))}
        </div>
      )}
      {!isLoading && !error && result?.mode === "single" && !hasData && (
        <p>Sin datos para el período seleccionado.</p>
      )}
      {hasData && result && (indicator === "dollar" || result.mode === "single") && <DollarChart result={result} indicator={indicator} />}
    </form>
  );
}
