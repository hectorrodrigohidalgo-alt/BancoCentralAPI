"use client";

import { useCallback, useEffect, useState } from "react";
import { validateDateRange } from "../lib/date-range-validation";
import { getTodayInSantiago } from "../lib/dates";
import type { DollarObservation } from "../lib/dollar";
import DollarChart from "./dollar-chart";

export default function DateRange() {
  const [today] = useState(getTodayInSantiago);
  // Conservamos el error del rango o del servicio y los datos que recibe el gráfico.
  const [error, setError] = useState("");
  const [observations, setObservations] = useState<DollarObservation[]>([]);
  // Empieza en true porque la primera consulta se hace al montar el componente.
  // Las consultas manuales vuelven a activarlo después de validar el rango.
  // Cada fetch lo desactiva en finally, tanto si termina bien como si falla.
  const [isLoading, setIsLoading] = useState(true);

  // Una referencia estable permite reutilizar la consulta sin volver a disparar el efecto.
  const queryDollar = useCallback(async (startDate: string, endDate: string) => {
    setError("");
    setIsLoading(true);
    const query = new URLSearchParams({ startDate, endDate });
    // Convertimos la respuesta JSON en el estado del gráfico; null se trata como una lista vacía.
    // La consulta pasa por nuestro servidor, que mantiene privado el token del Banco Central.
    // Una respuesta HTTP fallida se convierte en error y se muestra un aviso al visitante.
    try {
      const response = await fetch(`/api/dollar?${query}`);
      if (!response.ok) throw new Error("Consulta fallida");
      const data = await response.json();
      setObservations(data ?? []);
    } catch {
      setError("No fue posible consultar el dólar. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Iniciamos la consulta de forma asíncrona; la carga inicial ya está activa.
    void Promise.resolve().then(() => queryDollar(`${today.slice(0, 7)}-01`, today));
  }, [queryDollar, today]);

  return (
    <form onSubmit={(event) => {
      // Leemos las fechas actuales del formulario y evitamos que el envío recargue la página.
      event.preventDefault();
      const values = new FormData(event.currentTarget);
      const startDate = String(values.get("startDate"));
      const endDate = String(values.get("endDate"));
      // Compartimos las reglas con el endpoint y detenemos los rangos inválidos antes del fetch.
      const validationError = validateDateRange(startDate, endDate, today);
      if (validationError) {
        setError(validationError);
        return;
      }
      void queryDollar(startDate, endDate);
    }}>
      <label>
        Fecha inicial <input type="date" name="startDate" max={today} defaultValue={`${today.slice(0, 7)}-01`} />
      </label>
      <label>
        Fecha final <input type="date" name="endDate" max={today} defaultValue={today} />
      </label>
      <button type="submit">Consultar</button>
      {/* El mensaje permanece visible mientras haya una consulta marcada como pendiente. */}
      {isLoading && <p role="status">Cargando…</p>}
      {error && <p role="alert">{error}</p>}
      {/* El mensaje aparece al finalizar la carga, si no hay error ni observaciones. */}
      {!isLoading && !error && observations.length === 0 && (
        <p>Sin datos para el período seleccionado.</p>
      )}
      {/* Solo dibujamos si hay observaciones; esta prop entrega los datos nuevos al gráfico. */}
      {observations.length > 0 && <DollarChart observations={observations} />}
    </form>
  );
}
