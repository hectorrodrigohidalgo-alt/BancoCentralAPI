# Explicación de `dollar.ts` para un desarrollador junior

Archivo explicado: [`src/lib/dollar.ts`](../src/lib/dollar.ts).

Este archivo conecta nuestro servidor con el Banco Central. Define la estructura de una observación, arma la consulta externa y devuelve únicamente observaciones con valores válidos.

La explicación corresponde al código actual. Las líneas vacías separan bloques y los números pueden cambiar si se modifica el archivo.

## Línea 1: mantener la consulta en el servidor

```ts
import "server-only";
```

- **Línea 1:** marca el módulo como exclusivo del servidor. En Next.js, importar su código ejecutable desde un componente cliente provoca un error de compilación. Esto ayuda a mantener el acceso al token fuera del navegador.

Es diferente de `import type { DollarObservation }`: esa importación solo utiliza información de TypeScript y se elimina del código ejecutable.

## Líneas 3 a 7: describir una observación

```ts
export type DollarObservation = {
  indexDateString: string;
  value: string;
  statusCode: string;
};
```

- **Línea 3:** declara y exporta un tipo de TypeScript. Un tipo describe la forma esperada de un dato; no crea datos ni valida automáticamente una respuesta de red.
- **Línea 4:** `indexDateString` contiene la fecha de la observación como texto, por ejemplo `"02-11-2026"`.
- **Línea 5:** `value` contiene el valor como texto, por ejemplo `"992.66"`. La API puede representar un número mediante una cadena.
- **Línea 6:** `statusCode` contiene el estado de esa observación. El filtro de este archivo acepta el estado `"OK"`.
- **Línea 7:** cierra la definición del tipo.

Una observación representa un registro, no todo el período:

```json
{
  "indexDateString": "02-11-2026",
  "value": "992.66",
  "statusCode": "OK"
}
```

## Línea 9: declarar la función de consulta

```ts
export async function getDollarSeries(startDate: string, endDate: string): Promise<DollarObservation[]> {
```

- **Línea 9:** exporta una función asíncrona que recibe dos textos: fecha inicial y fecha final. `Promise<DollarObservation[]>` indica que, si la operación tiene éxito, entregará un arreglo de observaciones. Puede fallar y rechazar esa promesa; `route.ts` se encarga de capturar la falla.

Esta función recibe el rango ya revisado por el endpoint. No implementa aquí las reglas de orden y límite de fechas.

## Líneas 10 a 17: construir la URL externa

```ts
const url = new URL("https://si3.bcentral.cl/SieteRestWS/SieteRestWS.ashx");
url.search = new URLSearchParams({
  token: process.env.BCCH_API_TOKEN!,
  function: "GetSeries",
  timeseries: "F073.TCO.PRE.Z.D",
  firstdate: startDate,
  lastdate: endDate,
}).toString();
```

- **Línea 10:** crea un objeto `URL` con la dirección del servicio del Banco Central.
- **Línea 11:** comienza a construir los parámetros y asignarlos a `url.search`, la parte de la URL destinada a la consulta.
- **Línea 12:** obtiene el token desde una variable de entorno del servidor. El `!` informa a TypeScript que asumimos que existe; no valida su presencia durante la ejecución. No se debe escribir el token real en ejemplos, registros o documentación.
- **Línea 13:** indica la operación `GetSeries` que se solicita al servicio.
- **Línea 14:** envía el identificador utilizado por esta aplicación para la serie del dólar observado: `F073.TCO.PRE.Z.D`.
- **Línea 15:** utiliza `startDate` como inicio del período solicitado al proveedor.
- **Línea 16:** utiliza `endDate` como final del período.
- **Línea 17:** convierte los parámetros en texto mediante `toString()` y termina la asignación. `URLSearchParams` se encarga de codificar los valores para una URL.

La diferencia entre las direcciones es:

| Dirección | Quién la consulta | Dónde se define |
| --- | --- | --- |
| `/api/dollar` | El navegador | Carpetas de `src/app/api/dollar/route.ts` |
| Servicio externo del Banco Central | Nuestro servidor | Este archivo, en la línea 10 |

## Líneas 18 y 19: enviar la consulta y leer la respuesta

```ts
const response = await fetch(url);
const data = await response.json();
```

- **Línea 18:** realiza la solicitud HTTP y espera la respuesta. `response` contiene el estado HTTP, encabezados y acceso al cuerpo.
- **Línea 19:** interpreta el cuerpo JSON y lo guarda en `data`. Si hay una falla de red o el cuerpo no puede interpretarse como JSON, la función falla y el error llega al `catch` de `route.ts`.

`await` permite escribir pasos asíncronos en orden, sin bloquear todas las demás solicitudes del servidor.

## Líneas 20 a 23: comprobar el resultado del proveedor

```ts
// HTTP 200 no garantiza éxito: solo aceptamos el código 0 del Banco Central.
if (data.Codigo !== 0) {
  throw new Error("Error en la consulta al Banco Central");
}
```

- **Línea 20:** explica la diferencia entre una respuesta HTTP y el resultado de la operación solicitada.
- **Línea 21:** comprueba el campo `Codigo` del JSON. `!==` significa «distinto de», con comparación estricta. Esta aplicación solo acepta el número `0` como éxito.
- **Línea 22:** lanza un error si el código no es cero. La ejecución no continúa hacia el filtrado.
- **Línea 23:** cierra la condición.

`Codigo` corresponde al resultado general de la consulta; `statusCode` corresponde al estado de cada observación. Son comprobaciones diferentes.

Esta versión comprueba `data.Codigo`; no contiene una comprobación explícita de `response.ok` en este archivo. La explicación describe lo implementado, sin agregar validaciones nuevas.

## Líneas 24 y 25: obtener las observaciones

```ts
// Una respuesta exitosa sin observaciones se representa como una lista vacía.
const observations: DollarObservation[] = data.Series.Obs ?? [];
```

- **Línea 24:** comenta el tratamiento de la ausencia de observaciones.
- **Línea 25:** extrae `Obs` dentro de `Series`. Si `Obs` es `null` o `undefined`, `?? []` utiliza una lista vacía. La anotación `DollarObservation[]` expresa el tipo esperado.

El operador `??` no protege el acceso si `Series` no existe. Tampoco la anotación de TypeScript comprueba la estructura real del JSON. Si el acceso falla dentro de esta función, el endpoint captura el error y responde con HTTP 502.

## Líneas 26 a 30: filtrar y devolver valores válidos

```ts
// Los vacíos y null se descartan antes de convertir: Number podría interpretarlos como cero.
return observations.filter(({ statusCode, value }) =>
  statusCode === "OK" && typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)),
);
}
```

- **Línea 26:** explica por qué no basta con convertir cualquier valor usando `Number`.
- **Línea 27:** utiliza `filter` para crear una nueva lista con las observaciones que pasan la condición. `return` devuelve esa lista. La expresión `({ statusCode, value })` extrae las dos propiedades utilizadas por el filtro.
- **Línea 28:** exige cuatro condiciones, unidas por `&&`, que significa «y»:
  - `statusCode === "OK"`: el registro debe tener un estado aceptado.
  - `typeof value === "string"`: el valor debe ser texto; descarta, por ejemplo, `null`.
  - `value.trim() !== ""`: al quitar espacios de los extremos, debe quedar contenido.
  - `Number.isFinite(Number(value))`: el texto debe poder convertirse a un número finito; descarta resultados como `NaN` o `Infinity`.
- **Línea 29:** cierra la llamada a `filter`.
- **Línea 30:** cierra `getDollarSeries`.

Las condiciones se evalúan de izquierda a derecha. Si una falla, no se evalúan las siguientes; por eso no se ejecuta `trim()` sobre un valor que no sea texto.

| Estado | Valor | Resultado |
| --- | --- | --- |
| `OK` | `"992.66"` | Se conserva |
| `OK` | `"0"` | Se conserva: cero es un número válido |
| `OK` | `""` o `"   "` | Se descarta |
| `OK` | `null` | Se descarta |
| `OK` | `"abc"` o `"Infinity"` | Se descarta |
| `ND` | `"992.66"` | Se descarta por su estado |

Esto evita convertir ausencia de datos en cero: `Number("")` y `Number(null)` producen `0`. El filtro conserva los registros válidos completos, su orden y sus valores originales como texto. La conversión definitiva a número para dibujar ocurre en `dollar-chart.tsx`.

## Recorrido y lecturas relacionadas

```text
route.ts entrega el rango
          ↓
getDollarSeries arma la URL con el token del servidor
          ↓
Banco Central responde
          ↓
Se comprueba Codigo y se filtran observaciones
          ↓
route.ts recibe el arreglo y devuelve JSON al navegador
```

- [Explicación del endpoint](route-explicacion.md).
- [Explicación del gráfico](dollar-chart-explicacion.md).
- [Protección de código exclusivo del servidor en Next.js](https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning).
