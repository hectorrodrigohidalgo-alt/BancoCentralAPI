"use client";

import { useEffect, useState } from "react";
import { getTodayInSantiago } from "../lib/dates";
import type { DollarObservation } from "../lib/dollar";
import DollarChart from "./dollar-chart";

export default function DateRange() {
  const [today] = useState(getTodayInSantiago);
  // Conservamos el error del rango y los datos que recibe el componente del gráfico.
  const [error, setError] = useState("");
  const [observations, setObservations] = useState<DollarObservation[]>([]);
  // Empieza en true porque la primera consulta se hace al montar el componente.
  // Las consultas manuales vuelven a activarlo después de validar el rango.
  // Cada fetch lo desactiva en finally, tanto si termina bien como si falla.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const query = new URLSearchParams({
      startDate: `${today.slice(0, 7)}-01`,
      endDate: today,
    });
    // Convertimos la respuesta JSON en el estado del gráfico; null se trata como una lista vacía.
    // La consulta pasa por nuestro servidor, que mantiene privado el token del Banco Central.
    void fetch(`/api/dollar?${query}`).then((response) => response.json()).then((data) => setObservations(data ?? [])).finally(() => setIsLoading(false));
  }, [today]);

  return (
    <form onSubmit={(event) => {
      // Leemos las fechas actuales del formulario y evitamos que el envío recargue la página.
      event.preventDefault();
      const values = new FormData(event.currentTarget);
      const startDate = String(values.get("startDate"));
      const endDate = String(values.get("endDate"));
      // Un rango invertido muestra el mensaje y termina aquí, antes de enviar la consulta.
      if (startDate > endDate) {
        setError("La fecha inicial no puede ser posterior a la fecha final");
        return;
      }
      // Un rango válido limpia el error anterior e inicia una nueva consulta con sus fechas.
      setError("");
      setIsLoading(true);
      const query = new URLSearchParams({ startDate, endDate });
      void fetch(`/api/dollar?${query}`).then((response) => response.json()).then((data) => setObservations(data ?? [])).finally(() => setIsLoading(false));
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
      {/* Al actualizar observations, el gráfico recibe los datos nuevos mediante esta prop. */}
      <DollarChart observations={observations} />
    </form>
  );
}
