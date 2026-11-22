# Explicación de `dollar-chart.tsx` para un desarrollador junior

Archivo explicado: [`src/app/dollar-chart.tsx`](../../src/app/dollar-chart.tsx).

`DollarChart` recibe el resultado de una consulta y lo dibuja con ECharts. En modo individual muestra una línea con fechas en el eje horizontal. En comparación superpone dos líneas alineadas por días calendario desde el inicio de cada rango. Los valores verticales siempre son precios reales en CLP/USD.

El componente no consulta la API. El formulario se encarga de pedir los datos, esperar las respuestas y mostrar errores o períodos sin información.

## Importaciones y registro de módulos

`useRef` guarda el elemento HTML donde dibujará ECharts. `useEffect` conecta la biblioteca con ese elemento después del renderizado de React.

ECharts permite importar módulos específicos. Registramos `LineChart`, los ejes cartesianos (`GridComponent`), la leyenda (`LegendComponent`), el cuadro de detalle (`TooltipComponent`), la accesibilidad (`AriaComponent`) y el dibujado SVG (`SVGRenderer`). `registerCharts` es el nombre local de `use` de ECharts; no es un hook de React.

`EChartsOption` describe la configuración y permite que TypeScript compruebe sus propiedades. Las importaciones `type` no agregan código al navegador. El gráfico pertenece al árbol cliente de `DateRange`, por lo que no necesita repetir la directiva `"use client"`.

## La entrada del componente

La prop `result` puede tener dos formas, distinguidas por `mode`:

```ts
type ChartResult =
  | { mode: "single"; observations: DollarObservation[] }
  | { mode: "comparison"; periods: DollarPeriodResult[] };
```

Después de comprobar `result.mode`, TypeScript permite leer `observations` o `periods` según corresponda. Una prop es información que el padre entrega al hijo; el gráfico no cambia los datos ni el estado del formulario.

Cada resultado de comparación conserva `period`, `observations` y `failed`. El gráfico usa el rango y las observaciones; el padre muestra los avisos a partir de `failed` y de las listas vacías.

## Crear y liberar ECharts

`useRef<HTMLDivElement>(null)` comienza sin elemento. React guarda el `<div>` real en `container.current` cuando lo conecta. Dentro del efecto llamamos a:

```ts
const chart = init(container.current!, undefined, { renderer: "svg" });
```

`undefined` deja el tema predeterminado. `!` comunica a TypeScript que el elemento ya existe; no es una comprobación en tiempo de ejecución. `chart.setOption(option)` aplica la configuración elegida según el modo.

Un `ResizeObserver` observa el contenedor y llama a `chart.resize()` si cambia su tamaño. Al cambiar `result` o desmontar el componente, la limpieza desconecta el observador y ejecuta `chart.dispose()`. Después, si hay un nuevo resultado, React crea otra instancia con los datos nuevos. No se agregan las curvas nuevas a una instancia que todavía contiene series anteriores.

El contenedor tiene una altura de 360 píxeles. Su ancho depende del espacio disponible.

## El gráfico individual

La configuración conserva un eje horizontal de categorías: cada `indexDateString` es una etiqueta. Los valores se convierten con `Number(item.value)`. ECharts empareja fechas y valores por posición.

El eje vertical se llama `CLP/USD`. El tooltip usa la plantilla `{b}: {c} CLP/USD`: `{b}` es la fecha y `{c}`, el valor. Por ejemplo:

```text
02-11-2026: 950.25 CLP/USD
```

`aria: { enabled: true }` permite que ECharts genere una descripción accesible de la serie. El modo individual mantiene sus fechas como categorías y no utiliza la alineación relativa de la comparación.

## Preparar los puntos de comparación

[`toElapsedDayPoints`](../../src/lib/dollar-comparison.ts) convierte las observaciones de cada período en puntos con dos coordenadas y conserva su fecha original:

```ts
{
  name: "09-11-2026",
  value: [8, 954.75],
}
```

Si el rango empieza el `2026-11-01`, el 9 de noviembre corresponde al día 8, aunque no haya una cotización el día inicial. La primera observación no se mueve automáticamente al día 0.

El inicio del formulario llega como `YYYY-MM-DD`; las observaciones del Banco Central llegan como `DD-MM-YYYY`. La función separa cada formato y calcula:

```ts
(Date.UTC(year, month - 1, day) - start) / 86_400_000
```

Ambas fechas usan una referencia UTC. La resta cuenta días calendario completos sin que el cambio de hora local produzca diferencias de 23 o 25 horas. `86_400_000` es la cantidad de milisegundos de un día.

Después se ordenan los puntos por días transcurridos. Se crea un arreglo nuevo, sin modificar las observaciones recibidas.

Por ejemplo, dos períodos pueden producir:

| Período | Inicio solicitado | Fecha real | Día transcurrido | CLP/USD |
| --- | --- | --- | --- | --- |
| 1 | 2026-11-01 | 02-11-2026 | 1 | 950.25 |
| 1 | 2026-11-01 | 06-11-2026 | 5 | 952.5 |
| 1 | 2026-11-01 | 09-11-2026 | 8 | 954.75 |
| 2 | 2026-10-01 | 01-10-2026 | 0 | 900.25 |
| 2 | 2026-10-01 | 02-10-2026 | 1 | 902.5 |
| 2 | 2026-10-01 | 05-10-2026 | 4 | 905.75 |

Las observaciones del 2 de noviembre y del 2 de octubre comparten la posición horizontal 1. El fin de semana entre el 6 y el 9 de noviembre conserva una distancia de tres días.

## Ejes y curvas superpuestas

En comparación el eje horizontal utiliza `type: "value"`. Las coordenadas numéricas mantienen la distancia entre días: las categorías comprimirían los días sin observaciones. `min: 0` fija el origen en el comienzo de los rangos y `minInterval: 1` evita etiquetas de fracciones de día. Las etiquetas dicen **Día 0**, **Día 1**, etc., y el eje se llama **Días transcurridos**.

El eje vertical sigue siendo numérico y usa los valores reales en CLP/USD. No se normalizan a base 100 ni se calculan métricas adicionales.

Cada período tiene su propio arreglo. La línea une las observaciones disponibles, pero no crea puntos para fines de semana o feriados. Una curva termina en su última observación, aunque la otra continúe. Un período de un día se representa mediante su símbolo en el día 0.

Los valores ausentes e inválidos se filtran en el servidor, en `dollar.ts`, antes de convertirlos a número. Una respuesta vacía produce un arreglo vacío, sin puntos en cero ni relleno hasta la duración del otro período.

## Identificar los períodos

`getPeriodLabel` construye nombres como **Período 1 (2026-11-02 a 2026-11-06)**. Esos nombres aparecen en la leyenda, el tooltip y la descripción accesible.

El período 1 usa azul, línea continua y círculos. El período 2 usa marrón, línea discontinua y rombos. El índice original se conserva aunque un período esté vacío: la curva del período 2 no cambia a los estilos del período 1 si es la única disponible.

`LegendComponent` muestra los nombres y permite identificar u ocultar cada curva. La leyenda admite desplazamiento cuando falta espacio. `grid` reserva espacio para la leyenda y los nombres de los ejes.

## El tooltip de comparación

Con `trigger: "axis"`, ECharts entrega al `formatter` los puntos disponibles en la posición señalada. La función usa `seriesIndex` y `dataIndex` para recuperar los puntos originales; no inventa una cotización para una fecha sin observación.

Cada línea muestra el período, su rango, la fecha real y el precio:

```text
Período 1 (2026-11-02 a 2026-11-06) — 02-11-2026: 950.25 CLP/USD
Período 2 (2026-10-01 a 2026-10-10) — 01-10-2026: 900.25 CLP/USD
```

Se crean elementos HTML con `document.createElement` y se escribe el contenido mediante `textContent`. Así los textos se muestran como texto, sin interpretarlos como HTML. El contenedor del detalle tiene `role="tooltip"`.

La descripción ARIA personalizada también incluye período, día transcurrido, fecha y valor. Si una serie está vacía, indica **Sin datos**. El aviso visible de comparación incompleta sigue siendo responsabilidad del formulario.

## Verificación y lecturas relacionadas

[`tests/dollar-comparison.test.mjs`](../../tests/dollar-comparison.test.mjs) verifica la alineación, fines de semana, cambios de mes y año, días bisiestos, cambios de hora, rangos de un día y períodos de distinta duración. [`e2e/dollar-comparison.spec.ts`](../../e2e/dollar-comparison.spec.ts) verifica las curvas visibles, leyenda, colores y línea discontinua, unidades, tooltip, actualización y datos parciales.

- [Explicación del formulario](date-range-explicacion.md).
- [Origen y filtrado de las observaciones](dollar-explicacion.md).
- [ECharts: datos de una serie](https://echarts.apache.org/en/option.html#series-line.data).
- [ECharts: formatter del tooltip](https://echarts.apache.org/en/option.html#tooltip.formatter).
- [React: limpieza de efectos](https://react.dev/reference/react/useEffect).