# Explicación de `date-range.tsx` para un desarrollador junior

Archivo explicado: [`src/app/date-range.tsx`](../src/app/date-range.tsx).

Este componente recibe las fechas, consulta los datos y decide qué mostrar: carga, error, ausencia de datos o gráfico.

La explicación sigue las líneas de la versión documentada. Si el archivo cambia, los números pueden desplazarse. Las líneas vacías separan bloques para facilitar la lectura.

## Líneas 1 a 6: preparación del componente

```tsx
"use client";

import { useEffect, useState } from "react";
import { getTodayInSantiago } from "../lib/dates";
import type { DollarObservation } from "../lib/dollar";
import DollarChart from "./dollar-chart";
```

- **Línea 1:** `"use client"` marca este archivo como entrada de un componente cliente de Next.js. Permite utilizar estado, efectos y eventos del formulario en el navegador.
- **Línea 3:** importa `useState`, para conservar información entre renderizados, y `useEffect`, para ejecutar la consulta inicial.
- **Línea 4:** importa la función que obtiene la fecha actual según la zona horaria de Santiago.
- **Línea 5:** importa el tipo `DollarObservation`, que describe una observación del dólar. `import type` sirve para comprobar tipos; no incorpora el código de consulta del servidor al navegador.
- **Línea 6:** importa el componente que dibuja el gráfico.

## Líneas 8 a 16: información que conserva el componente

```tsx
export default function DateRange() {
  const [today] = useState(getTodayInSantiago);
```

- **Línea 8:** declara el componente `DateRange`. `export default` permite importarlo desde otros archivos.
- **Línea 9:** obtiene y conserva la fecha de hoy. Se entrega `getTodayInSantiago` sin paréntesis para que React la utilice como función de inicialización, en lugar de ejecutarla en cada renderizado. Solo extraemos `[today]`, sin una función para actualizarlo. Si la página queda abierta durante la medianoche, este valor no cambia automáticamente.

React puede llamar a la función de inicialización dos veces en desarrollo con Strict Mode para comprobar su comportamiento. Esto no significa que se calcule en cada actualización de la interfaz.

```tsx
const [error, setError] = useState("");
```

- **Línea 10:** contiene un comentario explicativo.
- **Línea 11:** crea el estado del error. `error` contiene el mensaje y `setError` permite actualizarlo. Empieza vacío porque todavía no ocurrió ningún error.

```tsx
const [observations, setObservations] = useState<DollarObservation[]>([]);
```

- **Línea 12:** crea el estado de los datos recibidos. `DollarObservation[]` significa «arreglo de observaciones del dólar». Comienza como una lista vacía, `[]`. Cuando llegan los datos, `setObservations` los guarda y React vuelve a evaluar la interfaz.

```tsx
const [isLoading, setIsLoading] = useState(true);
```

- **Líneas 13 a 15:** comentan cómo se administra la carga.
- **Línea 16:** crea el estado que indica si hay una consulta pendiente. Empieza en `true` porque el componente consulta automáticamente al abrirse. `setIsLoading` permite cambiar ese estado.

## Líneas 18 a 34: consulta automática inicial

```tsx
useEffect(() => {
```

- **Línea 18:** comienza el efecto que realiza la consulta inicial después de que el componente se monta, es decir, se incorpora a la página.

```tsx
const query = new URLSearchParams({
  startDate: `${today.slice(0, 7)}-01`,
  endDate: today,
});
```

- **Línea 19:** crea los parámetros que se agregarán a la URL.
- **Línea 20:** calcula el primer día del mes. Si `today` vale `"2026-11-18"`, `slice(0, 7)` obtiene `"2026-11"`. Al agregar `-01`, queda `"2026-11-01"`. Los acentos graves y `${...}` permiten construir un texto utilizando una expresión.
- **Línea 21:** establece hoy como fecha final.
- **Línea 22:** cierra el objeto y la creación de los parámetros.

El resultado equivale a:

```text
startDate=2026-11-01&endDate=2026-11-18
```

Las **líneas 23 a 25** son comentarios sobre la respuesta, la protección del token y los errores.

```tsx
void fetch(`/api/dollar?${query}`)
```

- **Línea 26:** inicia una solicitud al endpoint de nuestra aplicación. `${query}` introduce los parámetros en la URL. `void` indica que no utilizamos directamente la promesa resultante; el resultado se procesa con los métodos que siguen. No cancela la consulta ni la vuelve síncrona.

Una promesa representa un resultado que estará disponible más adelante, por ejemplo, cuando termine una consulta de red.

```tsx
.then((response) => {
  if (!response.ok) throw new Error("Consulta fallida");
  return response.json();
})
```

- **Línea 27:** recibe la respuesta HTTP cuando llega.
- **Línea 28:** comprueba si fue exitosa. El signo `!` niega una condición: `!response.ok` significa que la respuesta no fue exitosa. En ese caso lanza un error y pasa al `.catch()`. Esta comprobación es necesaria porque `fetch` no rechaza automáticamente respuestas como HTTP 400 o 502.
- **Línea 29:** interpreta el cuerpo JSON y devuelve una promesa con el valor de JavaScript correspondiente. El siguiente `.then()` espera ese resultado.
- **Línea 30:** cierra este primer procesamiento.

```tsx
.then((data) => setObservations(data ?? []))
```

- **Línea 31:** guarda los datos recibidos. El operador `??` utiliza `[]` si `data` es `null` o `undefined`. Al actualizar el estado, React vuelve a evaluar qué debe mostrar. Esta expresión no valida por sí misma la estructura de los datos recibidos.

```tsx
.catch(() => setError("No fue posible consultar el dólar. Intenta nuevamente."))
```

- **Línea 32:** captura errores de la solicitud o del procesamiento anterior y guarda un mensaje para el usuario.

```tsx
.finally(() => setIsLoading(false));
```

- **Línea 33:** desactiva el indicador de carga cuando termina la consulta, tanto si funcionó como si falló.

```tsx
}, [today]);
```

- **Línea 34:** cierra el efecto y declara su dependencia: `today`. El efecto se ejecuta al montar el componente y volvería a ejecutarse si ese valor cambiara. Aquí permanece estable. En desarrollo, React puede ejecutar un ciclo adicional del efecto cuando está activo Strict Mode.

## Líneas 36 a 47: envío y validación del formulario

```tsx
return (
  <form onSubmit={(event) => {
```

- **Línea 36:** comienza el JSX que representa la interfaz. JSX permite describir elementos de la pantalla con una sintaxis parecida a HTML.
- **Línea 37:** crea un formulario y define qué hacer cuando se envía, por ejemplo, al pulsar **Consultar**. `event` contiene información del evento.

```tsx
event.preventDefault();
```

- **Línea 38:** comenta el propósito del bloque.
- **Línea 39:** evita el comportamiento normal del envío del formulario, que podría recargar la página o navegar a otra dirección.

```tsx
const values = new FormData(event.currentTarget);
```

- **Línea 40:** lee los campos del formulario. `event.currentTarget` hace referencia al formulario que está procesando el evento.

```tsx
const startDate = String(values.get("startDate"));
const endDate = String(values.get("endDate"));
```

- **Línea 41:** obtiene el campo cuyo `name` es `"startDate"` y lo convierte a texto.
- **Línea 42:** hace lo mismo con `"endDate"`.

`String(...)` convierte el valor, pero no valida que sea una fecha correcta.

```tsx
if (startDate > endDate) {
  setError("La fecha inicial no puede ser posterior a la fecha final");
  return;
}
```

- **Línea 43:** explica la validación.
- **Línea 44:** comprueba si la fecha inicial es posterior a la final. La comparación de texto funciona para fechas válidas en formato `YYYY-MM-DD`, porque están ordenadas de año a día.
- **Línea 45:** guarda el mensaje de error.
- **Línea 46:** termina la función del evento para evitar enviar la consulta. No termina el componente completo.
- **Línea 47:** cierra la condición.

## Líneas 48 a 61: consulta con las fechas elegidas

```tsx
setError("");
setIsLoading(true);
const query = new URLSearchParams({ startDate, endDate });
```

- **Línea 48:** comenta el inicio de una consulta válida.
- **Línea 49:** limpia cualquier error anterior.
- **Línea 50:** activa el indicador de carga.
- **Línea 51:** construye los parámetros usando las fechas que el usuario seleccionó. `{ startDate, endDate }` es una forma abreviada de escribir `{ startDate: startDate, endDate: endDate }`.

La **línea 52** explica que también se manejarán los errores de esta consulta.

```tsx
void fetch(`/api/dollar?${query}`)
  .then((response) => {
    if (!response.ok) throw new Error("Consulta fallida");
    return response.json();
  })
  .then((data) => setObservations(data ?? []))
  .catch(() => setError("No fue posible consultar el dólar. Intenta nuevamente."))
  .finally(() => setIsLoading(false));
```

- **Línea 53:** envía la solicitud con las fechas seleccionadas.
- **Línea 54:** recibe la respuesta.
- **Línea 55:** comprueba el resultado HTTP y lanza un error si no fue exitoso.
- **Línea 56:** interpreta el JSON.
- **Línea 57:** cierra el primer `.then()`.
- **Línea 58:** reemplaza las observaciones anteriores por las nuevas, o por una lista vacía si el resultado es `null` o `undefined`.
- **Línea 59:** guarda un mensaje si ocurre un error.
- **Línea 60:** termina el estado de carga.
- **Línea 61:** cierra la función de `onSubmit` y la apertura de `<form>`.

Este bloque se parece al anterior porque existen dos momentos de consulta: al abrir la página y al enviar el formulario. Cada solicitud comprueba su propia respuesta con `response.ok`.

## Líneas 62 a 68: campos y botón

```tsx
<label>
  Fecha inicial <input type="date" name="startDate" max={today} defaultValue={`${today.slice(0, 7)}-01`} />
</label>
```

- **Línea 62:** abre la etiqueta del campo. Al envolver el `input`, asocia el texto con ese control.
- **Línea 63:** muestra el texto y el selector de fecha. `type="date"` crea un campo de fecha; `name="startDate"` permite recuperarlo mediante `FormData`; `max={today}` establece hoy como fecha máxima válida; `defaultValue` establece el primer día del mes como valor inicial.
- **Línea 64:** cierra la etiqueta.

```tsx
<label>
  Fecha final <input type="date" name="endDate" max={today} defaultValue={today} />
</label>
```

- **Línea 65:** abre la etiqueta de la fecha final.
- **Línea 66:** crea el segundo campo. Su nombre es `"endDate"`, su máximo es hoy y su valor inicial también es hoy.
- **Línea 67:** cierra la etiqueta.

Como usamos `defaultValue`, el navegador administra los cambios de estos campos. React establece el valor inicial y nosotros leemos el valor actual al enviar el formulario. Por eso no hay un `useState` separado para cada fecha seleccionada.

La restricción `max` participa en la validación nativa del navegador. El endpoint también debe validar las fechas, porque puede recibir solicitudes sin pasar por este formulario.

```tsx
<button type="submit">Consultar</button>
```

- **Línea 68:** crea el botón que envía el formulario y activa `onSubmit` si la validación nativa permite el envío.

## Líneas 69 a 77: decidir qué aparece en pantalla

La **línea 69** contiene un comentario JSX. Dentro de JSX los comentarios se escriben como `{/* comentario */}`.

```tsx
{isLoading && <p role="status">Cargando…</p>}
```

- **Línea 70:** muestra **Cargando…** si `isLoading` es `true`. El operador `&&` permite mostrar contenido cuando se cumple una condición. `role="status"` ayuda a las tecnologías de asistencia a comunicar el estado.

```tsx
{error && <p role="alert">{error}</p>}
```

- **Línea 71:** muestra el mensaje si `error` contiene texto. Un texto vacío no muestra el párrafo. `role="alert"` identifica un aviso importante para tecnologías de asistencia. Las llaves interiores, `{error}`, insertan el mensaje en el párrafo.

La **línea 72** comenta cuándo corresponde mostrar ausencia de datos.

```tsx
{!isLoading && !error && observations.length === 0 && (
  <p>Sin datos para el período seleccionado.</p>
)}
```

- **Línea 73:** exige tres condiciones: que haya terminado la carga, que no exista un error y que la lista esté vacía. `===` realiza una comparación estricta y `length` indica cuántos elementos hay en el arreglo.
- **Línea 74:** contiene el mensaje que se mostrará.
- **Línea 75:** cierra la expresión condicional.

La **línea 76** explica la conexión con el gráfico.

```tsx
{observations.length > 0 && <DollarChart observations={observations} />}
```

- **Línea 77:** muestra el gráfico cuando existen observaciones. `observations={observations}` entrega los datos como una **prop**, es decir, como una entrada del componente `DollarChart`. A la izquierda está el nombre de la prop; entre llaves está el estado que se entrega.

La condición del gráfico solo comprueba si hay observaciones. Por eso, si ya había datos, el gráfico anterior puede seguir visible mientras se consulta otro período o aparece un error. Al iniciar otra consulta no se vacía el estado `observations`.

## Líneas 78 a 80: cierre

```tsx
    </form>
  );
}
```

- **Línea 78:** cierra el formulario.
- **Línea 79:** cierra el contenido retornado.
- **Línea 80:** cierra la función `DateRange`.

## Recorrido de los datos

```text
Consulta inicial o envío del formulario
                  ↓
GET /api/dollar con startDate y endDate
                  ↓
Respuesta JSON del endpoint
                  ↓
setObservations(data)
                  ↓
React actualiza el componente
                  ↓
DollarChart recibe las observaciones como prop
                  ↓
El gráfico muestra los datos
```

Mientras la consulta está pendiente, `isLoading` permite mostrar el estado de carga. Si falla, `error` permite mostrar el aviso. Si termina correctamente sin observaciones, aparece el mensaje de ausencia de datos.

## Referencias de React

- [useState e inicialización del estado](https://react.dev/reference/react/useState#avoiding-recreating-the-initial-state).
- [useEffect y sus dependencias](https://react.dev/reference/react/useEffect).
- [Valores iniciales de campos con defaultValue](https://react.dev/reference/react-dom/components/input#providing-an-initial-value-for-an-input).
