# Explicación de `dollar-comparison.test.mjs` para un desarrollador junior

Archivo explicado: [`tests/dollar-comparison.test.mjs`](../../tests/dollar-comparison.test.mjs).

Este archivo comprueba los cálculos del mes anterior y los puntos de comparación. Ejecuta las funciones directamente en Node, sin abrir un navegador ni llamar al Banco Central. Contiene cuatro pruebas; algunas recorren varias entradas para comprobar la misma regla.

## Herramientas y estructura

```js
import assert from "node:assert/strict";
import test from "node:test";
```

`test` define cada caso mediante un nombre y una función. `assert` compara el resultado real con el esperado. Si una comprobación falla, Node marca la prueba como fallida.

`assert.deepEqual` compara la estructura y los valores de objetos y arreglos. Sirve para verificar un rango completo o todos los puntos. `assert.equal` compara un valor concreto, como el texto de una fecha. La variante `strict` evita aceptar valores de distinto tipo como si fueran iguales.

Las funciones de producción se importan desde sus archivos `.ts`. El proyecto utiliza Node 24 y ejecuta estas pruebas con el script `test:integration`. Aunque el script las agrupa con las pruebas del servicio y el endpoint, los cuatro casos de este archivo prueban funciones de cálculo aisladas.

## Prueba 1: mes anterior completo

La primera prueba recorre una tabla de fechas. Cada fila contiene `[today, startDate, endDate]`. La fecha inicial se pasa a `getPreviousMonthRange`; las otras dos forman el objeto esperado.

Comprueba un mes de 31 días, el salto de enero a diciembre del año anterior, febrero bisiesto, febrero común y un mes de 30 días. Son casos que fallarían si se restaran 30 días a la fecha actual en lugar de calcular el mes calendario anterior.

```js
assert.deepEqual(getPreviousMonthRange(today), { startDate, endDate });
```

La desestructuración del `for...of` asigna los tres valores de cada fila. Una sola regla se verifica con varias entradas sin duplicar el cuerpo de la prueba.

## Prueba 2: alineación y distinta duración

Se preparan dos rangos de meses distintos. El primero empieza el 1 de noviembre, pero su primera observación es del día 2. Sus coordenadas esperadas son `1`, `5` y `8`. El segundo empieza el 1 de octubre y tiene coordenadas `0`, `1` y `4`.

La comparación completa de los puntos confirma a la vez:

- La referencia es el inicio del rango solicitado.
- Los días sin observaciones no se comprimen ni se rellenan.
- Cada serie termina con sus propios datos, aunque la otra sea más larga.
- La fecha original se conserva en `name`.
- Los precios mantienen su valor real y se convierten de texto a número.

No se verifica solamente la cantidad de puntos: también se comprueba cada coordenada y cada fecha. Esto permite detectar, por ejemplo, que se haya utilizado el índice del arreglo como posición horizontal.

## Prueba 3: límites del calendario

La siguiente tabla contiene `[startDate, endDate, observationDate, elapsed]`. Comprueba cambios de mes y año, el 29 de febrero, fechas alrededor de los cambios de hora de Santiago y un rango de un solo día.

Por ejemplo, desde `2024-02-28` hasta `01-03-2024` deben transcurrir dos días. Desde una fecha hasta ella misma deben transcurrir cero. Los casos alrededor de cambios de hora deben seguir produciendo días enteros.

La función recibe las fechas como texto y utiliza UTC para la resta. Los casos verifican las diferencias calendario esperadas; no cambian la configuración horaria del proceso de Node.

## Prueba 4: vacíos, orden y datos originales

Primero se entrega un arreglo vacío y se exige otro arreglo vacío. Así se comprueba que no aparezca un punto artificial en cero cuando faltan observaciones.

Después se entregan dos observaciones fuera de orden. Se espera que los puntos queden ordenados por fecha. Al final, `assert.equal` comprueba que la primera observación de entrada siga siendo la misma: ordenar el resultado no debe reordenar los datos originales.

## Cómo ejecutarlas

Desde la raíz del proyecto en PowerShell, para ejecutar solamente este archivo:

```powershell
node --conditions=react-server --test tests/dollar-comparison.test.mjs
```

Para ejecutar el conjunto completo de pruebas agrupadas como integración:

```powershell
npm.cmd run test:integration
```

Estas pruebas no verifican botones, SVG ni tooltips. Esos comportamientos se cubren en las [pruebas E2E](dollar-comparison-e2e-explicacion.md). Las funciones comprobadas se explican en [fechas](dates-explicacion.md) y [preparación de la comparación](dollar-comparison-explicacion.md).
