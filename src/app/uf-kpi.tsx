"use client";

import { useEffect, useState } from "react";
import { getTodayInSantiago } from "../lib/dates";
import { fetchIndicatorObservations } from "../lib/indicator-client";

export default function UfKpi() {
  const [today] = useState(getTodayInSantiago);
  const [value, setValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const date = today.split("-").reverse().join("-");

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => active ? fetchIndicatorObservations(today, today, "uf") : [])
      .then((observations) => { if (active) setValue(observations.find(({ indexDateString }) => indexDateString === date)?.value ?? null); })
      .catch(() => { if (active) setHasError(true); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [today, date]);

  return (
    <section aria-labelledby="uf-kpi-title">
      <h2 id="uf-kpi-title">UF de hoy</h2>
      {isLoading && <p role="status">Cargando…</p>}
      {hasError && <p role="alert">No fue posible consultar la UF. Intenta nuevamente.</p>}
      {!isLoading && !hasError && value === null && <p role="alert">Sin datos de UF para hoy.</p>}
      {value !== null && <time dateTime={today}>{date}</time>}
      {value !== null && <p>{new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value))}</p>}
    </section>
  );
}
