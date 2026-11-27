"use client";

import { useRef, useState } from "react";
import { getTodayInSantiago } from "../lib/dates";
import { fetchIndicatorObservations } from "../lib/indicator-client";
import { validateDateRange } from "../lib/date-range-validation";

export default function UfForm() {
  const [today] = useState(getTodayInSantiago);
  const [result, setResult] = useState<{ date: string; value: string; amount: number } | null>(null);
  const [error, setError] = useState("");
  const [conversion, setConversion] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [amountConfirmed, setAmountConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const formRevision = useRef(0);
  const numericAmount = Number(amount);
  const validAmount = !isLoading && amountConfirmed && Number.isFinite(numericAmount) && numericAmount > 0;
  const canConsult = validAmount && Number.isInteger(numericAmount);
  const canConvert = validAmount && !Number.isInteger(numericAmount);

  async function queryUf(form: HTMLFormElement, convert = false) {
    if (convert && !canConvert) return;
    const date = String(new FormData(form).get("ufDate") ?? "");
    const validationError = !date ? "Selecciona una fecha válida" : validateDateRange(date, date, today);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (amount.trim() !== "" && numericAmount === 0) {
      setError("El monto en UF no puede ser cero");
      return;
    }
    if (!convert && Number.isFinite(numericAmount) && !Number.isInteger(numericAmount)) {
      setError("Para montos fraccionarios, utiliza Convertir");
      return;
    }
    setError("");
    if (convert && result?.date === date) {
      setConversion(numericAmount * Number(result.value));
      return;
    }
    setIsLoading(true);
    const requestedRevision = formRevision.current;
    try {
      const observations = await fetchIndicatorObservations(date, date, "uf");
      if (requestedRevision !== formRevision.current) return;
      const observation = observations.find(({ indexDateString }) => indexDateString === date.split("-").reverse().join("-"));
      setResult(observation ? { date, value: observation.value, amount: numericAmount } : null);
      if (convert && observation) setConversion(numericAmount * Number(observation.value));
      if (!observation) setError("Sin datos de UF para la fecha seleccionada.");
    } catch (error) {
      if (requestedRevision === formRevision.current) throw error;
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="uf-form" noValidate aria-labelledby="uf-form-title" onSubmit={(event) => {
      event.preventDefault();
      void queryUf(event.currentTarget).catch(() => {
        setResult(null);
        setError("No fue posible consultar la UF. Intenta nuevamente.");
      });
    }}>
      <h2 id="uf-form-title">Consulta y conversión UF</h2>
      <label>
        Fecha UF <input type="date" name="ufDate" defaultValue={today} onChange={() => {
          formRevision.current += 1;
          setResult(null);
          setConversion(null);
        }} />
      </label>
      <label>
        Monto en UF <input type="number" name="ufAmount" step="any" value={amount} onChange={(event) => {
          formRevision.current += 1;
          setAmount(event.currentTarget.value);
          setAmountConfirmed(false);
          setConversion(null);
        }} onBlur={() => setAmountConfirmed(true)} />
      </label>
      <button type="submit" disabled={!canConsult}>Consultar UF</button>
      <button type="button" disabled={!canConvert} onClick={(event) => {
        void queryUf(event.currentTarget.form!, true).catch(() => {
          setResult(null);
          setError("No fue posible consultar la UF. Intenta nuevamente.");
        });
      }}>Convertir</button>
      {isLoading && <p role="status">Cargando…</p>}
      {error && <p role="alert">{error}</p>}
      {result && conversion === null && <section aria-label="Resultado de consulta UF">
        {amountConfirmed && Number.isInteger(result.amount) && result.amount === numericAmount && <p><strong>
          Equivalencia de {result.amount} UF: {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(result.amount * Number(result.value))}
        </strong></p>}
        <time dateTime={result.date}>{result.date.split("-").reverse().join("-")}</time>
        <p>1 UF: {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(result.value))}</p>
      </section>}
      {result && conversion !== null && <section aria-label="Resultado de conversión UF">
        <p>Equivalencia: {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(conversion)}</p>
        <time dateTime={result.date}>{result.date.split("-").reverse().join("-")}</time>
        <p>Valor UF utilizado: {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(result.value))}</p>
      </section>}
    </form>
  );
}
