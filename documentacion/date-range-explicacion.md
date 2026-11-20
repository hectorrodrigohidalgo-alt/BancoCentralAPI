# Explicación de `date-range.tsx` para un desarrollador junior

Archivo explicado: [`src/app/date-range.tsx`](../src/app/date-range.tsx).

Este componente recibe las fechas y decide qué mostrar: carga, error, ausencia de datos o gráfico. La consulta inicial y la manual utilizan `queryDollar` para administrar los estados de la interfaz. La petición HTTP está separada en `fetchDollarObservations`, que devuelve datos o rechaza su promesa cuando falla. El formulario y el endpoint comparten las reglas mediante `validateDateRange`.

Los números de línea corresponden a la versión resultante del refactor. Las líneas vacías separan bloques; si se modifica el código, hay que actualizar estas referencias.

## Líneas 1 a 8: preparación del componente

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { validateDateRange } from "../lib/date-range-validation";
import { getTodayInSantiago } from "../lib/dates";
import type { DollarObservation } from "../lib/dollar";
import { fetchDollarObservations } from "../lib/dollar-client";
import DollarChart from "./dollar-chart";
```

La **línea 1** declara una entrada de componente cliente de Next.js: permite usar estado, efectos y eventos del formulario. La **línea 3** importa tres herramientas de React: `useState` conserva información entre renderizados; `useEffect` inicia la consulta al montar el componente; `useCallback` mantiene estable la referencia a la función de consulta.

Las **líneas 4 y 5** importan la validación compartida y la función que obtiene hoy en Santiago. La **línea 6** importa solo un tipo de TypeScript: `DollarObservation` describe una observación, pero `import type` no incorpora al navegador el código de consulta del servidor. La **línea 7** importa la petición reutilizable del navegador y la **línea 8** importa el gráfico.

## Líneas 10 a 18: información que conserva el componente

```tsx
export default function DateRange() {
  const [today] = useState(getTodayInSantiago);
  // Conservamos el error del rango o del servicio y los datos que recibe el gráfico.
  const [error, setError] = useState("");
  const [observations, setObservations] = useState<DollarObservation[]>([]);
  // Empieza en true porque la primera consulta se hace al montar el componente.
  // Las consultas manuales vuelven a activarlo después de validar el rango.
  // Cada consulta lo desactiva en finally, tanto si termina bien como si falla.
  const [isLoading, setIsLoading] = useState(true);
```

La **línea 10** declara el componente y permite importarlo con `export default`. En la **línea 11**, entregamos `getTodayInSantiago` sin paréntesis para que React la use como función de inicialización. `today` se conserva entre renderizados; no cambia automáticamente si la página queda abierta durante la medianoche.

La **línea 13** crea un mensaje de error inicialmente vacío. `setError` permite reemplazarlo. La **línea 14** conserva una lista inicialmente vacía: `DollarObservation[]` significa «arreglo de observaciones». Cuando llamamos a `setObservations`, React vuelve a evaluar la interfaz con los datos nuevos.

La **línea 18** crea el indicador de carga. Empieza en `true` porque se consultará al abrir la página. Los comentarios de las **líneas 12 y 15 a 17** describen estos estados.

## Líneas 20 a 33: gestión de la consulta y de la interfaz

```tsx
const queryDollar = useCallback(async (startDate: string, endDate: string) => {
  setError("");
  setIsLoading(true);
```

La **línea 20** explica por qué la referencia debe permanecer estable. La **línea 21** define `queryDollar`, que recibe las dos fechas como textos. `async` permite usar `await` y hace que la función devuelva una promesa: un resultado que estará disponible más adelante.

Las **líneas 22 y 23** limpian cualquier error anterior y activan la carga en un único lugar, tanto para la consulta inicial como para la manual. El comentario de la **línea 24** explica la separación: la petición obtiene datos y el componente decide qué mostrar.

```tsx
try {
  const data = await fetchDollarObservations(startDate, endDate);
  setObservations(data);
} catch {
  setError("No fue posible consultar el dólar. Intenta nuevamente.");
} finally {
  setIsLoading(false);
}
```

La **línea 25** abre `try`, el bloque que intentamos ejecutar. La **línea 26** llama a la función de petición; `await` espera sus datos sin bloquear el navegador. La **línea 27** entrega la lista recibida a React mediante `setObservations`. La conversión de `null` a `[]` ya la realizó la función de petición.

Las **líneas 28 y 29** capturan errores de red, HTTP o lectura del JSON y guardan el mensaje del servicio. Las **líneas 30 a 32** desactivan la carga con `finally`, tanto si hubo éxito como si ocurrió un error.

La **línea 33**, `}, []);`, cierra `useCallback`. La lista de dependencias está vacía porque las fechas llegan como argumentos, la función de petición está importada desde otro módulo y las funciones `setError`, `setIsLoading` y `setObservations` tienen referencias estables en React. Así, las actualizaciones normales del estado no crean una nueva referencia a `queryDollar` que vuelva a disparar el efecto inicial.

## La petición reutilizable: `dollar-client.ts`

Las **líneas 1 a 11** de [`src/lib/dollar-client.ts`](../src/lib/dollar-client.ts) contienen:

```ts
import type { DollarObservation } from "./dollar";

export async function fetchDollarObservations(startDate: string, endDate: string): Promise<DollarObservation[]> {
  // Consultamos nuestra API; las credenciales del Banco Central permanecen en el servidor.
  const query = new URLSearchParams({ startDate, endDate });
  const response = await fetch(`/api/dollar?${query}`);
  // Dejamos que el llamador gestione los errores y el estado de cada consulta.
  if (!response.ok) throw new Error("Consulta fallida");
  const data = await response.json();
  return data ?? [];
}
```

La **línea 1** importa solo el tipo de una observación. No incorpora al navegador el código exclusivo del servidor de `dollar.ts`. La **línea 3** exporta una función asíncrona que recibe dos textos y devuelve una promesa de una lista de observaciones. No necesita una directiva `"use client"` propia: se utiliza desde el componente cliente.

La **línea 5** construye los parámetros mediante `URLSearchParams`. `{ startDate, endDate }` abrevia `{ startDate: startDate, endDate: endDate }`. Por ejemplo, las fechas `2026-11-01` y `2026-11-19` producen `startDate=2026-11-01&endDate=2026-11-19`.

La **línea 6** consulta nuestra API. Los acentos graves y `${query}` permiten insertar los parámetros en la URL. Las credenciales del Banco Central permanecen en el servidor.

La **línea 8** comprueba el resultado HTTP. `!response.ok` significa que la respuesta no fue exitosa. Como `fetch` no rechaza automáticamente respuestas HTTP 400 o 502, usamos `throw` para rechazar la promesa. Los fallos de red y los errores de lectura del JSON también se propagan al llamador: esta función no los captura ni los convierte en datos vacíos.

La **línea 9** interpreta el JSON y la **línea 10** devuelve los datos. `data ?? []` reemplaza `null` o `undefined` por una lista vacía; no valida por sí mismo la estructura de la respuesta.

Esta función no importa React ni modifica estados compartidos. Cada llamada devuelve su propio resultado. En la futura comparación podremos usarla para ambos rangos y manejar sus fallos por separado. `queryDollar` sigue administrando los estados de una consulta individual; la coordinación de dos períodos corresponde a la historia 4.

## Líneas 35 a 38: consulta automática inicial

```tsx
useEffect(() => {
  // Iniciamos la consulta de forma asíncrona; la carga inicial ya está activa.
  void Promise.resolve().then(() => queryDollar(`${today.slice(0, 7)}-01`, today));
}, [queryDollar, today]);
```

La **línea 35** declara el efecto que se ejecuta después de montar el componente. La **línea 37** programa el inicio de la consulta en una microtarea mediante `Promise.resolve().then(...)`: se ejecutará después del bloque síncrono actual. De esta forma, el efecto no llama síncronamente a los setters de estado de `queryDollar`, respetando la regla `react-hooks/set-state-in-effect`. El estado inicial ya permite mostrar **Cargando…** durante ese intervalo.

`void` indica que no usamos directamente el resultado de la promesa; no cancela la consulta. La función `queryDollar` maneja los errores del servicio internamente.

Si `today` es `"2026-11-19"`, `today.slice(0, 7)` obtiene `"2026-11"`. Al agregar `-01`, resulta `"2026-11-01"`. El rango inicial va desde ese día hasta hoy, por lo que cumple las reglas de orden y de fechas futuras por construcción.

La **línea 38** declara las dependencias `queryDollar` y `today`. Ambas permanecen estables durante las actualizaciones normales del componente. React puede ejecutar un ciclo adicional del efecto en desarrollo con Strict Mode; `useCallback` no elimina ese comportamiento de desarrollo.

## Líneas 40 a 54: envío y validación del formulario

```tsx
return (
  <form onSubmit={(event) => {
    // Leemos las fechas actuales del formulario y evitamos que el envío recargue la página.
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const startDate = String(values.get("startDate"));
    const endDate = String(values.get("endDate"));
    // Compartimos las reglas con el endpoint y detenemos los rangos inválidos antes del fetch.
    const validationError = validateDateRange(startDate, endDate, today);
    if (validationError) {
      setError(validationError);
      return;
    }
    void queryDollar(startDate, endDate);
  }}>
```

La **línea 40** comienza el JSX, la sintaxis parecida a HTML que describe la interfaz. La **línea 41** define qué hacer al enviar el formulario. La **línea 43** evita que el envío recargue la página. La **línea 44** lee sus campos mediante `FormData`; `event.currentTarget` es el formulario que procesa el evento.

Las **líneas 45 y 46** obtienen los valores según el atributo `name` y los convierten a texto. `String(...)` convierte, pero no valida el formato de una fecha.

La **línea 48** aplica la función compartida con el endpoint. Si devuelve un mensaje, las **líneas 49 a 52** lo guardan y terminan el evento antes de consultar. Ese `return` termina la función del evento, no el componente completo. Si devuelve `null`, la **línea 53** llama a la misma `queryDollar` utilizada al abrir la página. El envío ya no repite los parámetros, el `fetch`, el procesamiento JSON ni los cambios de estado.

## Validación compartida y respuesta del endpoint

En [`src/lib/date-range-validation.ts`](../src/lib/date-range-validation.ts), las **líneas 1 a 10** contienen:

```ts
export function validateDateRange(startDate: string, endDate: string, today: string): string | null {
  // El orden se comprueba primero para conservar la prioridad del mensaje en ambas capas.
  if (startDate > endDate) {
    return "La fecha inicial no puede ser posterior a la fecha final";
  }
  if (startDate > today || endDate > today) {
    return "Las fechas no pueden ser posteriores a hoy";
  }
  return null;
}
```

`string | null` significa que el resultado puede ser un texto o `null`. Primero se comprueba el orden del rango (**líneas 3 a 5**), luego las fechas futuras (**líneas 6 a 8**). Si ambas reglas fallan, se devuelve el mensaje del rango invertido. `||` significa «o»: basta que una de las fechas supere hoy. Al finalizar sin errores, se devuelve `null` (**línea 9**).

Las comparaciones de texto funcionan para fechas válidas en formato `YYYY-MM-DD`, ordenadas de año a día. Un rango de un solo día es válido porque usamos `>` y no `>=`. Esta función conserva las reglas existentes; no agrega comprobaciones de campos ausentes ni de formato.

La función no importa React, APIs del navegador ni código exclusivo del servidor. Recibe `today` como argumento para que ambas capas obtengan esa fecha con `getTodayInSantiago` y apliquen las mismas reglas.

En [`src/app/api/dollar/route.ts`](../src/app/api/dollar/route.ts), la **línea 3** importa la función. Las **líneas 9 a 17** la utilizan antes de consultar al proveedor:

```ts
const today = getTodayInSantiago();
// Validamos también las solicitudes que llegan sin pasar por el formulario.
const validationError = validateDateRange(startDate, endDate, today);
if (validationError) {
  return Response.json(
    { error: validationError },
    { status: 400 },
  );
}
```

El formulario muestra el mensaje con `setError`; el endpoint responde HTTP 400 con `{ error: mensaje }`. Validar en el servidor sigue siendo necesario porque alguien puede llamar a la API directamente. Para un rango válido, las **líneas 19 a 27** conservan la consulta al Banco Central, la respuesta de observaciones y el HTTP 502 si falla el servicio.

## Líneas 55 a 61: campos y botón

```tsx
<label>
  Fecha inicial <input type="date" name="startDate" max={today} defaultValue={`${today.slice(0, 7)}-01`} />
</label>
<label>
  Fecha final <input type="date" name="endDate" max={today} defaultValue={today} />
</label>
<button type="submit">Consultar</button>
```

Las etiquetas de las **líneas 55 y 58** asocian el texto con el campo que envuelven. En las **líneas 56 y 59**, `type="date"` crea un selector de fecha; `name` permite recuperar su valor con `FormData`; `max={today}` mantiene hoy como máximo válido. `defaultValue` establece el primer día del mes para el inicio y hoy para el final.

Con `defaultValue`, el navegador administra los cambios de los campos y nosotros leemos sus valores al enviar. No hay un `useState` por cada fecha elegida. La validación nativa de `max` se mantiene, además de la validación compartida en JavaScript y en el endpoint. El botón de la **línea 61** envía el formulario si la validación nativa lo permite.

## Líneas 62 a 73: decidir qué aparece en pantalla y cerrar el componente

```tsx
{isLoading && <p role="status">Cargando…</p>}
{error && <p role="alert">{error}</p>}
```

La **línea 63** muestra la carga y la **línea 64** muestra el error si contiene texto. `&&` permite mostrar contenido cuando se cumple una condición. `role="status"` y `role="alert"` ayudan a las tecnologías de asistencia a comunicar los avisos. Las llaves insertan valores de JavaScript en JSX.

```tsx
{!isLoading && !error && observations.length === 0 && (
  <p>Sin datos para el período seleccionado.</p>
)}
```

Las **líneas 66 a 68** muestran el mensaje de ausencia de datos solo cuando terminó la carga, no hay error y la lista está vacía. `!` niega una condición; `===` compara estrictamente; `length` indica la cantidad de elementos.

```tsx
{observations.length > 0 && <DollarChart observations={observations} />}
```

La **línea 70** entrega los datos al gráfico mediante la **prop** `observations`, una entrada del componente hijo. Al llegar observaciones nuevas, reemplazan a las anteriores. Si ya había datos, el gráfico puede seguir visible durante otra consulta o un error, porque al iniciar la consulta no vaciamos la lista. Una respuesta vacía o `null` sí la reemplaza por `[]` y oculta el gráfico.

Las **líneas 62, 65 y 69** contienen comentarios JSX, escritos como `{/* comentario */}`. Las **líneas 71 a 73** cierran el formulario, el contenido retornado y la función del componente.

## Recorrido de los datos

```text
Al montar: primer día del mes → hoy (rango válido por construcción)
Al enviar: FormData → validateDateRange → mensaje y fin si hay error
                         ↓ si el rango es válido
              queryDollar(startDate, endDate)
                         ↓
              Limpia el error y activa la carga
                         ↓
              fetchDollarObservations(startDate, endDate)
                         ↓
              GET /api/dollar con ambas fechas
                         ↓
              Endpoint: validateDateRange con hoy en Santiago
                         ↓ si el rango es válido
              Consulta al Banco Central → respuesta JSON
                         ↓
              fetchDollarObservations devuelve data ?? []
                         ↓
              queryDollar ejecuta setObservations(data)
                         ↓
              React actualiza DateRange y DollarChart
```

Si el endpoint rechaza las fechas, responde HTTP 400 con el mensaje de validación; si falla el proveedor, responde HTTP 502. `fetchDollarObservations` propaga el fallo HTTP, de red o de lectura JSON. `queryDollar` captura ese fallo y muestra el aviso del servicio. Su bloque `finally` termina la carga en todos esos casos. Al terminar correctamente sin observaciones, aparece el mensaje de ausencia de datos.

## Referencias de React

- [useState e inicialización del estado](https://react.dev/reference/react/useState#avoiding-recreating-the-initial-state).
- [useCallback y referencias estables](https://react.dev/reference/react/useCallback).
- [useEffect y sus dependencias](https://react.dev/reference/react/useEffect).
- [Regla set-state-in-effect](https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect).
- [Valores iniciales de campos con defaultValue](https://react.dev/reference/react-dom/components/input#providing-an-initial-value-for-an-input).
