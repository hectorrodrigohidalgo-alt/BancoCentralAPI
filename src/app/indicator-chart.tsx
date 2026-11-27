import { useEffect, useRef } from "react";
import { LineChart } from "echarts/charts";
import { AriaComponent, GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import { init, use as registerCharts } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import type { EChartsOption } from "echarts";
import type { DollarObservation } from "../lib/dollar";
import { getPeriodLabel, toElapsedDayPoints, type DollarPeriodResult } from "../lib/dollar-comparison";

registerCharts([LineChart, AriaComponent, GridComponent, LegendComponent, TooltipComponent, SVGRenderer]);

type ChartResult =
  | { mode: "single"; observations: DollarObservation[] }
  | { mode: "comparison"; periods: DollarPeriodResult[] };

export default function IndicatorChart({ result, indicator }: { result: ChartResult; indicator: "dollar" | "uf" }) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const chart = init(container.current!, undefined, { renderer: "svg" });
    const unit = indicator === "uf" ? "CLP/UF" : "CLP/USD";
    let option: EChartsOption;
    if (result.mode === "single") {
      const label = indicator === "uf" ? "UF" : "Dólar observado";
      option = {
        aria: { enabled: true },
        tooltip: { trigger: "axis", formatter: `<span role="tooltip">{b}: {c} ${unit}</span>` },
        xAxis: { type: "category", data: result.observations.map((item) => item.indexDateString) },
        yAxis: { type: "value", name: unit },
        series: [{ name: `${label} (${unit})`, type: "line", data: result.observations.map((item) => Number(item.value)) }],
      };
    } else {
      const points = result.periods.map(({ period, observations }) => toElapsedDayPoints(period, observations));
      const labels = result.periods.map(({ period }, index) => getPeriodLabel(period, index));
      option = {
        aria: {
          enabled: true,
          label: { description: `Comparación ${indicator === "uf" ? "de la UF" : "del dólar observado"} (${unit}). ${points.map((data, index) =>
            `${labels[index]}: ${data.map(({ name, value }) => `Día ${value[0]}, ${name}: ${value[1]} ${unit}`).join("; ") || "Sin datos"}`,
          ).join(". ")}` },
        },
        legend: { top: 0, type: "scroll" },
        grid: { top: 75, bottom: 65, left: 65, right: 30 },
        tooltip: {
          trigger: "axis",
          formatter: (params) => {
            // Usamos los puntos originales, no fechas calculadas desde la posición del cursor.
            const tooltip = document.createElement("div");
            tooltip.setAttribute("role", "tooltip");
            for (const item of Array.isArray(params) ? params : [params]) {
              const index = item.seriesIndex!;
              const point = points[index][item.dataIndex];
              const line = document.createElement("div");
              line.textContent = `${labels[index]} — ${point.name}: ${point.value[1]} ${unit}`;
              tooltip.append(line);
            }
            return tooltip;
          },
        },
        xAxis: {
          type: "value", min: 0, minInterval: 1,
          name: "Días transcurridos", nameLocation: "middle", nameGap: 35,
          axisLabel: { formatter: "Día {value}" },
        },
        yAxis: { type: "value", name: unit },
        series: points.map((data, index) => ({
          name: labels[index], type: "line", data,
          // Conservamos identidad visual incluso cuando solo un período contiene datos.
          color: index === 0 ? "#2563eb" : "#b45309",
          lineStyle: { type: index === 0 ? "solid" : "dashed", width: 2 },
          symbol: index === 0 ? "circle" : "diamond", symbolSize: 8,
        })),
      };
    }
    chart.setOption(option);
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(container.current!);
    return () => {
      observer.disconnect();
      chart.dispose();
    };
  }, [result, indicator]);
  return <div ref={container} style={{ height: 360 }} />;
}
