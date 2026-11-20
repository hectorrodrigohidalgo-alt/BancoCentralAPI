import { useEffect, useRef } from "react";
import { LineChart } from "echarts/charts";
import { AriaComponent, GridComponent, TooltipComponent } from "echarts/components";
import { init, use as registerCharts } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import type { DollarObservation } from "../lib/dollar";

// Registramos los módulos necesarios para la línea, los ejes, la accesibilidad, el tooltip y SVG.
registerCharts([LineChart, AriaComponent, GridComponent, TooltipComponent, SVGRenderer]);

export default function DollarChart({ observations }: { observations: DollarObservation[] }) {
  // ECharts necesita el elemento HTML donde dibujará el gráfico.
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // El efecto crea una instancia al montar el componente y cada vez que cambian los datos.
    const chart = init(container.current!, undefined, { renderer: "svg" });
    chart.setOption({
      // ECharts genera una descripción de las observaciones para lectores de pantalla.
      aria: { enabled: true },
      // En la plantilla, {b} es la fecha del eje X y {c} es el valor de la observación.
      tooltip: { trigger: "axis", formatter: '<span role="tooltip">{b}: {c} CLP/USD</span>' },
      // Las fechas forman las categorías; los valores se convierten de texto a número.
      xAxis: { type: "category", data: observations.map((item) => item.indexDateString) },
      yAxis: { type: "value", name: "CLP/USD" },
      series: [{ name: "Dólar observado (CLP/USD)", type: "line", data: observations.map((item) => Number(item.value)) }],
    });
    // Ajustamos el gráfico cuando cambia el tamaño de su contenedor.
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(container.current!);
    return () => {
      // Antes de recrearlo o desmontarlo, liberamos el observador y la instancia anterior.
      observer.disconnect();
      chart.dispose();
    };
  }, [observations]);
  return <div ref={container} style={{ height: 360 }} />;
}
