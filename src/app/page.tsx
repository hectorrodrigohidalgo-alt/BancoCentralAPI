"use client";

import dynamic from "next/dynamic";

const DateRange = dynamic(() => import("./date-range"), { ssr: false });

export default function Home() {
  return (
    <main>
      <h1>Indicadores del Banco Central de Chile</h1>
      <DateRange />
    </main>
  );
}
