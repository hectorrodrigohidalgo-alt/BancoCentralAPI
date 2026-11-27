"use client";

import dynamic from "next/dynamic";

const DateRange = dynamic(() => import("./date-range"), { ssr: false });
const UfKpi = dynamic(() => import("./uf-kpi"), { ssr: false });
const UfForm = dynamic(() => import("./uf-form"), { ssr: false });

export default function Home() {
  return (
    <main>
      <h1>Indicadores del Banco Central de Chile</h1>
      <UfKpi />
      <UfForm />
      <DateRange />
    </main>
  );
}
