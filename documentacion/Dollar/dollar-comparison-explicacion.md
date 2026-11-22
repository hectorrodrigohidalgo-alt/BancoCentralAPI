# Explicación de `dollar-comparison.ts` para un desarrollador junior

Archivo explicado: [`src/lib/dollar-comparison.ts`](../../src/lib/dollar-comparison.ts).

Este archivo define la información de cada período y prepara sus observaciones para compararlas en el gráfico. No consulta servicios ni depende de React o ECharts: transforma los datos recibidos y devuelve otros nuevos.

## Importar solamente el tipo de observación

```ts
import type { DollarObservation } from "./dollar";
```

`DollarObservation` describe una observación con `indexDateString`, `value` y `statusCode`. `import type` sirve para comprobar el código con TypeScript y desaparece al compilar. No incorpora al navegador la función del servidor que utiliza las credenciales del Banco Central.

## Los dos tipos de período

```ts
export type DollarPeriod = { startDate: string; endDate: string };

export type DollarPeriodResult = {
  period: DollarPeriod;
  observations: DollarObservation[];
  failed: boolean;
};
```

`DollarPeriod` es el rango solicitado. Sus fechas usan el formato `YYYY-MM-DD`. `DollarPeriodResult` agrega las observaciones obtenidas y un indicador de fallo.

| Situación | `observations` | `failed` |
| --- | --- | --- |
| Solicitud exitosa con datos | Lista de observaciones. | `false` |
| Solicitud exitosa sin datos | `[]` | `false` |
| Error de la solicitud | `[]` | `true` |

Una lista vacía por sí sola no permite saber si hubo un error. Por eso se conserva `failed`. El formulario construye estos resultados después de esperar ambas solicitudes y muestra el aviso correspondiente.

## `getPeriodLabel`: el nombre visible

```ts
return `Período ${index + 1} (${period.startDate} a ${period.endDate})`;
```

Los índices de un arreglo comienzan en cero. `index + 1` los convierte en números de período para el usuario. La interpolación `${...}` coloca cada valor dentro del texto.

Para el índice `0` y el rango de `2026-11-02` a `2026-11-06`, devuelve **Período 1 (2026-11-02 a 2026-11-06)**. Se reutiliza en la leyenda, los avisos de carga y error, el tooltip y la descripción accesible. El período 2 conserva su número aunque el primero no tenga datos.

## `toElapsedDayPoints`: convertir una observación en un punto

La función recibe el rango y sus observaciones. Devuelve objetos con esta forma:

```ts
{
  name: "09-11-2026",
  value: [8, 954.75],
}
```

`name` conserva la fecha original. `value[0]` es la coordenada horizontal: días desde el inicio solicitado. `value[1]` es la coordenada vertical: el precio real en CLP/USD.

La anotación `as [number, number]` indica a TypeScript que `value` es una tupla de dos números. No transforma los valores en ejecución; documenta y comprueba su estructura.

## Leer los dos formatos de fecha

El rango llega como `YYYY-MM-DD`, así que su desestructuración es `[year, month, day]`. Las observaciones llegan como `DD-MM-YYYY`, así que dentro de `map` se usa `[day, month, year]`.

En ambos casos se separa por `-` y se convierte cada parte con `Number`. Confundir el orden de los formatos desplazaría los puntos a fechas incorrectas.

## Contar días calendario en UTC

```ts
const start = Date.UTC(year, month - 1, day);
const elapsedDays = (Date.UTC(year, month - 1, day) - start) / 86_400_000;
```

La primera línea utiliza los componentes del inicio. La segunda está dentro de `map` y utiliza los componentes de cada observación. Cada llamada a `Date.UTC` representa la medianoche UTC de esa fecha calendario. Se resta el inicio y se divide entre los milisegundos de un día.

`month - 1` adapta el mes del texto a los meses de JavaScript, que empiezan en cero. Usar la misma referencia UTC evita que los cambios de hora de Santiago produzcan diferencias fraccionarias de días.

Si el rango empieza el 1 de noviembre y la primera cotización es del día 2, el primer punto tiene coordenada `1`. No se mueve al día 0: la referencia es el inicio solicitado, no la primera observación disponible.

## Ordenar sin completar días ausentes

```ts
.sort((a, b) => a.value[0] - b.value[0]);
```

`map` crea un arreglo nuevo de puntos. `sort` ordena ese arreglo por la coordenada horizontal; no modifica la lista original de observaciones.

Cada observación produce exactamente un punto. Una lista vacía produce `[]`. No se generan cotizaciones para fines de semana o feriados y no se prolonga una serie hasta el final de la otra. El gráfico une las observaciones disponibles conservando esas distancias.

La función espera observaciones válidas, ya filtradas por el servicio del servidor. No repite la validación de `statusCode` ni filtra valores ausentes antes de `Number`. Tampoco recorta según `endDate`: utiliza los datos que devolvió la consulta de ese rango. Estas responsabilidades permanecen en las capas que la llaman y en el servicio.

La representación visual se explica en el [documento del gráfico](dollar-chart-explicacion.md), y los casos límite en las [pruebas de cálculos](dollar-comparison-test-explicacion.md).
