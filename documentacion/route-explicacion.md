# Explicación de `route.ts` para un desarrollador junior

Archivo explicado: [`src/app/api/dollar/route.ts`](../src/app/api/dollar/route.ts).

Este archivo es la puerta de entrada del servidor para consultar el dólar. Recibe las fechas del navegador, valida el rango, pide los datos y devuelve una respuesta JSON.

La explicación corresponde al código actual. Las líneas vacías separan bloques y los números pueden cambiar si se modifica el archivo. El refactor de duplicidad planificado todavía no forma parte de esta versión.

## Cómo se relaciona el archivo con la URL

Next.js utiliza las carpetas para definir las rutas:

```text
src/app/api/dollar/route.ts → /api/dollar
```

Cuando `date-range.tsx` ejecuta `fetch('/api/dollar?...')`, la solicitud llega a este archivo. No es todavía una consulta directa al Banco Central.

## Líneas 1 y 2: importaciones

```ts
import { getDollarSeries } from "../../../lib/dollar.ts";
import { getTodayInSantiago } from "../../../lib/dates.ts";
```

- **Línea 1:** importa la función que consulta al Banco Central. Cada `../` sube un nivel de carpetas hasta llegar a `src/lib`.
- **Línea 2:** importa la función que determina la fecha actual en Santiago. Evita que el límite de hoy dependa de la zona horaria configurada en el servidor.

## Líneas 4 a 7: recibir la solicitud y leer las fechas

```ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate")!;
  const endDate = searchParams.get("endDate")!;
```

- **Línea 4:** exporta el manejador de solicitudes HTTP `GET`. Next.js reconoce ese nombre. `async` permite utilizar `await`; `request: Request` indica el tipo del objeto que contiene la solicitud.
- **Línea 5:** convierte la URL recibida en un objeto `URL` y extrae `searchParams` mediante desestructuración. Esa propiedad permite consultar los parámetros que aparecen después de `?`.
- **Línea 6:** obtiene el parámetro `startDate`, que representa la fecha inicial.
- **Línea 7:** obtiene el parámetro `endDate`, que representa la fecha final.

Ejemplo de solicitud:

```text
/api/dollar?startDate=2026-11-01&endDate=2026-11-18
```

En ese caso, `startDate` contiene `"2026-11-01"` y `endDate` contiene `"2026-11-18"`.

El `!` al final de `get(...)` es una afirmación de TypeScript: le indica al compilador que asumimos que el parámetro existe. **No comprueba ni corrige el valor durante la ejecución.** Esta versión no implementa una validación completa de parámetros ausentes o fechas mal formadas.

## Líneas 8 a 13: rechazar un rango invertido

```ts
if (startDate > endDate) {
  return Response.json(
    { error: "La fecha inicial no puede ser posterior a la fecha final" },
    { status: 400 },
  );
}
```

- **Línea 8:** comprueba si la fecha inicial supera la final. Para fechas válidas con formato `YYYY-MM-DD`, el orden de los textos coincide con el orden cronológico.
- **Línea 9:** comienza la respuesta JSON y utiliza `return` para terminar el manejador. No se consulta al Banco Central.
- **Línea 10:** define el cuerpo de la respuesta: un objeto con una propiedad `error` y un mensaje.
- **Línea 11:** establece HTTP 400, que indica que la solicitud no cumple las condiciones esperadas.
- **Línea 12:** cierra la creación de la respuesta.
- **Línea 13:** cierra el bloque condicional.

Una fecha inicial igual a la final no se rechaza: permite consultar un solo día.

## Líneas 14 a 20: rechazar fechas futuras

```ts
const today = getTodayInSantiago();
if (startDate > today || endDate > today) {
  return Response.json(
    { error: "Las fechas no pueden ser posteriores a hoy" },
    { status: 400 },
  );
}
```

- **Línea 14:** obtiene hoy con el mismo formato de las fechas recibidas.
- **Línea 15:** comprueba si cualquiera de las dos fechas supera hoy. `||` significa «o»: basta con que una condición sea verdadera.
- **Línea 16:** inicia una respuesta y termina el manejador con `return`.
- **Línea 17:** establece el mensaje para las fechas futuras.
- **Línea 18:** utiliza nuevamente HTTP 400.
- **Línea 19:** cierra la respuesta.
- **Línea 20:** cierra la condición.

Aunque el formulario también limita las fechas, el servidor debe validarlas: alguien puede llamar al endpoint sin utilizar la interfaz.

## Líneas 21 a 24: consultar y devolver los datos

```ts
// Convertimos el fallo del proveedor en HTTP 502 sin exponer credenciales ni detalles internos.
try {
  const observations = await getDollarSeries(startDate, endDate);
  return Response.json(observations);
```

- **Línea 21:** comenta el propósito del manejo de errores.
- **Línea 22:** abre `try`, el bloque cuyas fallas se manejarán en `catch`.
- **Línea 23:** llama a `getDollarSeries` con el rango validado. `await` espera el resultado de esa operación dentro de esta función; no bloquea todo el servidor. El resultado queda en `observations`.
- **Línea 24:** devuelve las observaciones como JSON. Al no indicar otro estado, la respuesta utiliza HTTP 200. Si no hay observaciones válidas, devuelve `[]`.

## Líneas 25 a 31: responder ante fallas

```ts
} catch {
  return Response.json(
    { error: "No fue posible consultar el dólar. Intenta nuevamente." },
    { status: 502 },
  );
}
}
```

- **Línea 25:** captura errores lanzados dentro de `try`, como una falla de red o un error del proveedor detectado por `getDollarSeries`. No declara una variable para el error porque no se utiliza su contenido.
- **Línea 26:** comienza la respuesta de error.
- **Línea 27:** devuelve un mensaje genérico al navegador.
- **Línea 28:** establece HTTP 502. En esta aplicación se utiliza para representar una falla al obtener o procesar la respuesta del servicio externo.
- **Línea 29:** cierra la respuesta.
- **Línea 30:** cierra `catch`.
- **Línea 31:** cierra la función `GET`.

El navegador no recibe el token ni los detalles internos de la falla. Su `fetch` detecta el estado no exitoso mediante `response.ok` y muestra el aviso.

## Respuestas y recorrido

| Situación | Estado HTTP | Cuerpo |
| --- | --- | --- |
| Rango válido y consulta exitosa | 200 | Arreglo de observaciones, posiblemente vacío |
| Inicio posterior al final | 400 | Objeto con `error` |
| Alguna fecha posterior a hoy | 400 | Objeto con `error` |
| Error durante la consulta o procesamiento externo | 502 | Objeto con `error` |

```text
date-range.tsx envía las fechas
              ↓
route.ts valida el rango
              ↓
getDollarSeries consulta y filtra
              ↓
route.ts devuelve JSON
              ↓
date-range.tsx actualiza la interfaz
```

## Lecturas relacionadas

- [Explicación de DateRange](date-range-explicacion.md).
- [Explicación de la consulta al Banco Central](dollar-explicacion.md).
- [Route Handlers de Next.js](https://nextjs.org/docs/app/getting-started/route-handlers).
