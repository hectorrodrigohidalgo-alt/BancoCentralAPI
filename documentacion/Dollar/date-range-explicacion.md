# Explicación de `date-range.tsx` para un desarrollador junior

Archivo explicado: [`src/app/date-range.tsx`](../../src/app/date-range.tsx).

`DateRange` administra las fechas elegidas, consulta el dólar y decide qué resultados y mensajes mostrar. Al abrir el dashboard consulta desde el primer día del mes hasta hoy en Santiago. La opción **Activar comparación** agrega un segundo rango; solo el botón **Comparar** inicia las dos solicitudes.

## Las piezas que utiliza

- `useState` conserva valores entre renderizados, como la carga o el resultado.
- `useEffect` inicia la consulta al montar el componente.
- `useCallback` conserva la referencia de `queryDollar` para usarla como dependencia del efecto.
- [`validateDateRange`](../../src/lib/date-range-validation.ts) contiene las reglas de orden y fechas futuras que también utiliza el endpoint.
- [`getTodayInSantiago` y `getPreviousMonthRange`](../../src/lib/dates.ts) calculan las fechas iniciales.
- [`fetchDollarObservations`](../../src/lib/dollar-client.ts) consulta nuestra API y convierte una respuesta `null` en `[]`.
- [`DollarChart`](../../src/app/dollar-chart.tsx) dibuja los resultados. El formulario no configura ECharts.

`"use client"` permite utilizar eventos y estado en este componente. Las importaciones con `import type` desaparecen al compilar: importar `DollarObservation` no incorpora al navegador el código ni las credenciales del Banco Central.

## El estado y la selección son cosas distintas

`comparisonEnabled` representa la opción marcada en el formulario. `result.mode` representa la consulta que produjo el gráfico visible. Así, marcar la opción prepara los campos sin transformar automáticamente el resultado individual que ya estaba en pantalla.

`QueryResult` es una unión de dos formas posibles:

```ts
type QueryResult =
  | { mode: "single"; observations: DollarObservation[] }
  | { mode: "comparison"; periods: DollarPeriodResult[] };
```

Al comprobar `mode`, TypeScript sabe qué propiedades existen. Una consulta individual tiene `observations`; una comparación tiene los resultados de ambos períodos. Antes de tener un resultado, y durante una comparación nueva, `result` es `null`.

Cada `DollarPeriodResult` conserva el rango solicitado, sus observaciones y `failed`. Una respuesta exitosa sin datos tiene `failed: false` y una lista vacía. Una solicitud fallida tiene `failed: true`; distinguirlas permite mostrar el aviso correcto.

`isLoading` comienza en `true` porque la consulta inicial todavía está pendiente. `loadingPeriods` identifica los rangos de una comparación en el mensaje de carga. `error` guarda el error del formulario o de una consulta individual.

## Las fechas iniciales

`useState(getTodayInSantiago)` calcula hoy al montar el componente usando `America/Santiago`, aunque el visitante esté en otra zona horaria. La fecha queda fija durante esa visita. `today.slice(0, 7)` conserva `YYYY-MM`; agregar `-01` obtiene el primer día del mes.

El segundo período usa el mes calendario anterior completo. Por ejemplo, si hoy es `2026-01-10`, empieza en `2025-12-01` y termina en `2025-12-31`. Si hoy es `2024-03-01`, termina en `2024-02-29`.

`getPreviousMonthRange` utiliza `Date.UTC` y después convierte a texto ISO. El mes se cuenta desde cero; el día cero representa el último día del mes anterior. JavaScript resuelve el cambio de año y los años bisiestos, sin depender del huso horario local.

## Cómo se consulta un solo período

`queryDollar(startDate, endDate)` limpia el error, activa la carga y llama a `fetchDollarObservations`. Conserva el gráfico individual anterior durante la espera o un error, como en la consulta existente. Si recibe datos, guarda `{ mode: "single", observations }`, reemplazando el resultado anterior; una lista vacía oculta el gráfico. Si la solicitud falla, muestra el aviso del servicio. `finally` termina la carga tanto en éxito como en error. Al salir del modo de comparación, el formulario retira las dos curvas antes de consultar individualmente.

El efecto utiliza esta función para el rango inicial. La llamada se programa con `Promise.resolve().then(...)`; la carga inicial ya está activa antes de que comience la solicitud. El botón **Consultar** reutiliza la misma función después de validar.

## Cómo se consultan dos períodos

`queryComparison(periods)` también retira el gráfico anterior antes de empezar. Luego inicia una solicitud por rango al mismo `GET /api/dollar`, sin cambiar el endpoint ni enviar credenciales desde el navegador.

```ts
const responses = await Promise.allSettled(periods.map(({ startDate, endDate }) =>
  fetchDollarObservations(startDate, endDate),
));
```

`map` produce las dos promesas e inicia ambas solicitudes. `Promise.allSettled` espera a que todas terminen, incluso cuando una falla. Conserva el orden de entrada: `responses[0]` corresponde al período 1 aunque el período 2 termine primero.

Cada resultado tiene `status: "fulfilled"` y `value`, o `status: "rejected"` y el motivo del fallo. La función los convierte a `DollarPeriodResult` usando `periods[index]` para conservar el rango original. Solo después publica ambos resultados y termina la carga. No aparece una comparación parcial mientras todavía hay una solicitud pendiente.

## Leer y validar el formulario

`queryForm(form, compare)` lee los campos con `new FormData(form)`. Los nombres `startDate` y `endDate` identifican el primer rango; `secondStartDate` y `secondEndDate`, el segundo. `String(values.get(...) ?? "")` convierte un campo ausente en texto vacío.

Primero exige ambas fechas. Después aplica `validateDateRange` a cada rango: el inicio no puede superar al fin y ninguna fecha puede superar hoy. Un rango de un día es válido porque la regla usa `>` en lugar de `>=`. Si encuentra un error, termina antes de iniciar cualquier solicitud. En comparación agrega el número y las fechas del período afectado.

Los campos mantienen `max={today}`. En comparación, `noValidate` permite que el envío llegue a nuestra validación en JavaScript incluso con campos requeridos vacíos o fechas futuras. Así mostramos un mensaje consistente que identifica el período. Esto no omite la validación: `queryForm` la realiza antes de consultar y el endpoint conserva sus propias reglas.

`defaultValue` establece el valor inicial de cada campo, pero el navegador administra los cambios posteriores. No necesitamos un estado de React por fecha. `FormData` toma una fotografía de los valores al consultar; los resultados conservan ese rango aunque el usuario cambie los campos después.

## Cambiar de modo y esperar respuestas

Marcar **Activar comparación** muestra el segundo rango con el mes anterior y cambia el botón a **Comparar**; no consulta. Desmarcarlo retira la comparación y valida y consulta el primer rango actual en modo individual. Si ese rango es inválido, aparece su error y el usuario puede corregirlo antes de pulsar **Consultar**.

Durante una consulta, el botón, el cambio de modo y los dos grupos de fechas están deshabilitados. El manejador de envío también comprueba `isLoading`, por lo que un envío programático no inicia otra consulta mientras se espera. Los `fieldset` agrupan cada período mediante su `legend` y permiten deshabilitar todos sus campos juntos.

## Qué se muestra al terminar

`hasData` indica si existe al menos una observación para dibujar. En modo individual, una respuesta vacía muestra **Sin datos para el período seleccionado.** Un fallo muestra el aviso del servicio.

`incomplete` indica que algún período de la comparación falló o quedó vacío. Aparece **Comparación incompleta.** y un mensaje por cada período afectado, con su rango y motivo. Si el otro período tiene datos, el gráfico conserva esa curva. Si ninguno tiene datos, no dibuja un gráfico vacío.

`role="status"` identifica la carga y `role="alert"` los avisos. El gráfico solo recibe resultados publicados; no inicia solicitudes ni decide si faltó un período.

## Recorrido de la comparación

```text
Activar comparación → preparar segundo rango, sin consultar
Comparar → FormData → validar ambos rangos
                          ↓
               limpiar resultado y activar carga
                          ↓
         dos GET /api/dollar → Promise.allSettled
                          ↓
         asociar cada respuesta con su rango original
                          ↓
        publicar resultados, terminar carga y mostrar avisos
                          ↓
                DollarChart recibe el resultado
```

Las pruebas de [`e2e/dollar-comparison.spec.ts`](../../e2e/dollar-comparison.spec.ts) verifican estos recorridos con respuestas simuladas. Las pruebas de consulta individual se conservan. El cálculo del mes anterior y la alineación del gráfico se verifican además en [`tests/dollar-comparison.test.mjs`](../../tests/dollar-comparison.test.mjs).
