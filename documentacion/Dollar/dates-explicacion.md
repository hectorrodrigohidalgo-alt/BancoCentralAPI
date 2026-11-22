# Explicación de `dates.ts` para un desarrollador junior

Archivo explicado: [`src/lib/dates.ts`](../../src/lib/dates.ts).

Este archivo reúne dos funciones para las fechas iniciales del formulario. Una obtiene hoy en Santiago; la otra calcula el mes calendario anterior completo. Devuelven texto o un objeto de textos, sin consultar la API ni modificar la interfaz.

## `getTodayInSantiago`: qué significa hoy

```ts
export function getTodayInSantiago(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
```

`new Date()` representa el instante actual. `Intl.DateTimeFormat` decide cómo expresar ese instante como fecha. La opción `timeZone` usa el calendario de Santiago aunque el navegador esté configurado en otra zona horaria.

La configuración `en-CA` y los campos de año, mes y día producen el formato `YYYY-MM-DD` utilizado por los inputs de fecha en este entorno. `2-digit` incluye el cero inicial cuando corresponde.

Por ejemplo, en `2026-11-01T01:00:00Z`, en Santiago todavía es 31 de octubre. La función devuelve `2026-10-31`. Utilizar directamente el día UTC daría noviembre y alteraría el rango inicial.

`DateRange` guarda ese resultado mediante `useState(getTodayInSantiago)`: se calcula al montar el componente y se conserva durante esa visita. El primer rango va desde el día 1 de ese mes hasta ese día.

## `getPreviousMonthRange`: entradas y salida

La función recibe una fecha válida en formato `YYYY-MM-DD`. Por ejemplo:

```ts
getPreviousMonthRange("2026-11-21");
// { startDate: "2026-10-01", endDate: "2026-10-31" }
```

El día recibido no cambia el resultado: siempre se toma el mes anterior completo. `startDate` y `endDate` son los nombres que espera el resto de la implementación.

## Separar año y mes

```ts
const [year, month] = today.split("-").map(Number);
```

`split("-")` separa el texto en partes. `map(Number)` convierte esas partes a números. La desestructuración guarda el año y el mes en variables; aquí no necesitamos el día.

Para `2026-11-21`, `year` vale `2026` y `month` vale `11`. La función espera una fecha válida proveniente de `getTodayInSantiago`; no agrega una validación de formato para entradas arbitrarias.

## Primer y último día del mes anterior

```ts
startDate: new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 10),
endDate: new Date(Date.UTC(year, month - 1, 0)).toISOString().slice(0, 10),
```

Los meses de `Date.UTC` comienzan en cero: enero es `0` y noviembre es `10`. El mes del texto comienza en uno. Por eso `month - 2` representa el mes anterior en el sistema de JavaScript.

Para el final se usa el mes actual con día `0`. JavaScript interpreta ese día como el último del mes anterior. Así no tenemos que mantener una tabla con la cantidad de días de cada mes.

`Date.UTC` construye una referencia temporal en UTC. `new Date(...)` permite convertirla a ISO con `toISOString()`. `slice(0, 10)` conserva solamente `YYYY-MM-DD`, descartando hora y zona horaria.

| Fecha recibida | Inicio devuelto | Fin devuelto | Caso |
| --- | --- | --- | --- |
| 2026-11-21 | 2026-10-01 | 2026-10-31 | Mes de 31 días. |
| 2026-01-01 | 2025-12-01 | 2025-12-31 | Cambio de año. |
| 2024-03-15 | 2024-02-01 | 2024-02-29 | Febrero bisiesto. |
| 2025-03-31 | 2025-02-01 | 2025-02-28 | Febrero común. |
| 2026-05-01 | 2026-04-01 | 2026-04-30 | Mes de 30 días. |

Estos casos se comprueban en las [pruebas de cálculos](dollar-comparison-test-explicacion.md). El uso real de las fechas se explica en el [formulario](date-range-explicacion.md).
