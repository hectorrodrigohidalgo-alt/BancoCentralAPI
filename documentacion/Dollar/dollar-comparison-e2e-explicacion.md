# Explicación de `dollar-comparison.spec.ts` para un desarrollador junior

Archivo explicado: [`e2e/dollar-comparison.spec.ts`](../../e2e/dollar-comparison.spec.ts).

Este archivo verifica la comparación desde un navegador con Playwright: abre el dashboard, completa fechas, pulsa botones y comprueba lo que ve el visitante. Genera 17 pruebas mediante casos individuales y tablas de escenarios.

## Datos controlados y peticiones simuladas

`firstObservations` y `secondObservations` contienen cotizaciones de noviembre y octubre con fechas y precios diferentes. Así se puede distinguir qué curva corresponde a cada respuesta.

```ts
await page.route("**/api/dollar?*", (route) => {
  // Cada prueba define aquí la respuesta que necesita.
});
```

`page.route` intercepta las solicitudes del navegador a la API. `route.fulfill` devuelve una respuesta simulada: datos, una lista vacía, `null` o un error HTTP. El patrón incluye los parámetros del rango.

Estas pruebas ejecutan la interfaz real, pero no atraviesan el endpoint ni contactan al Banco Central. Las pruebas del servicio y de la ruta API se conservan en `tests/dollar.test.mjs`.

## Preparar una visita y completar los períodos

`openDashboard` fija el reloj en `2026-11-11T15:00:00Z`, abre `/` y espera que **Consultar** esté habilitado. Esperar ese botón evita comenzar la interacción mientras la consulta inicial todavía está cargando.

`selectPeriods` activa la comparación y completa ambos rangos. `getByLabel` busca campos a través de su etiqueta visible. `fill` cambia una fecha y `check` marca la opción. `Page` se importa como tipo para comprobar el argumento de estas funciones auxiliares.

Las comprobaciones de interfaz utilizan `await expect(...)`. Playwright espera a que se cumpla la condición dentro de su plazo; no es necesario agregar pausas fijas para adivinar cuánto tardará el renderizado.

## Cinco pruebas de fechas automáticas

Una tabla genera cinco visitas con relojes distintos. Comprueban el mes anterior habitual, el cambio de año, febrero bisiesto, febrero común y un instante en que UTC ya está en noviembre pero Santiago sigue en octubre.

Se registra la cantidad de solicitudes antes de activar la comparación. Después de marcarla se revisan las fechas del segundo rango y se exige que la cantidad no cambie. Esto distingue **preparar el formulario** de **consultar**.

## Una prueba del gráfico y el tooltip

La prueba registra las URL y elige la respuesta según `startDate`. Después de pulsar **Comparar**, exige exactamente dos solicitudes con los rangos elegidos. `arrayContaining` permite que lleguen en cualquier orden.

La descripción ARIA del gráfico debe identificar ambos períodos, sus días transcurridos, fechas reales y valores. También se revisan la leyenda, los nombres de los ejes y los trazos SVG: azul para el primer período y marrón con guiones para el segundo.

Finalmente, `hover` mueve el cursor al comienzo del área de ejes. El tooltip debe mostrar ambas fechas reales y sus precios en CLP/USD, aunque correspondan a meses distintos. Las coordenadas del cursor se relacionan con el margen izquierdo configurado en el gráfico; un cambio de ese margen requeriría ajustar esta comprobación.

La alineación matemática se comprueba además directamente en las [pruebas de cálculos](dollar-comparison-test-explicacion.md).

## Una prueba de carga, bloqueo y regreso al modo individual

La prueba primero obtiene una comparación completa. Después activa `hold` para dejar pendiente la siguiente respuesta del segundo período.

```ts
const pending = new Promise<void>((resolve) => { release = resolve; });
```

La promesa no termina hasta llamar a `release()`. Así se mantiene una solicitud pendiente de manera controlada, sin depender de una conexión lenta.

Durante esa espera se comprueba que el mensaje identifique ambos rangos, desaparezca el gráfico anterior y queden deshabilitados el envío, el cambio de modo y la fecha inicial del primer período. Un envío programático mediante `form.requestSubmit()` tampoco debe crear más solicitudes.

Tras `release()`, el gráfico reaparece y termina la carga. Al desmarcar la comparación, desaparece el segundo rango y vuelve el gráfico individual. El bloque `finally` libera la promesa incluso si alguna comprobación falla, para no dejar una solicitud bloqueada.

## Una prueba de actualización y rangos de un día

Se realiza una comparación inicial y luego se cambian ambos períodos por rangos de un solo día. Las respuestas contienen precios diferentes. La descripción del gráfico debe mostrar los nuevos puntos en el día 0 y dejar de contener los precios anteriores.

Esto verifica que el resultado nuevo reemplace las dos curvas y que no se conserve una serie vieja al actualizar.

## Dos pruebas de validación

Se genera una prueba por período. Cada una recorre cinco combinaciones: inicio vacío, fin vacío, rango invertido y dos variantes de fechas futuras.

El aviso debe identificar el período afectado y explicar el problema. El número de solicitudes debe permanecer igual al registrado antes de los envíos inválidos. No basta con mostrar un error si de todos modos se consulta al servidor.

## Siete pruebas de comparación incompleta

Las combinaciones se construyen con estos resultados simulados:

| Nombre | Respuesta |
| --- | --- |
| `ok` | Cotizaciones del período. |
| `error` | HTTP 503. |
| `empty` | Lista vacía `[]`. |
| `null` | Cuerpo JSON `null`. |

Se prueban errores y ausencias en cada lado, errores en ambos, ambos vacíos y una combinación de fallo con `null`. Debe aparecer **Comparación incompleta.**, junto con el período afectado y su motivo.

Si un período contiene datos, su curva sigue visible con su precio real. Se comprueba que la descripción no incluya precios ausentes convertidos en `0 CLP/USD`. Si ninguno contiene datos, no aparece un gráfico vacío. Al terminar, **Comparar** vuelve a estar habilitado.

## Cómo ejecutar las pruebas

Desde la raíz del proyecto en PowerShell, para ejecutar solo este archivo:

```powershell
npm.cmd run test:e2e -- e2e/dollar-comparison.spec.ts --workers=2
```

Para ejecutar todas las E2E, incluidas las de consulta individual:

```powershell
npm.cmd run test:e2e -- --workers=2
```

La [configuración de Playwright](../../playwright.config.ts) usa Chromium y `http://localhost:3000`. Inicia el servidor de desarrollo si hace falta; fuera de CI puede reutilizar uno existente.

El comportamiento verificado se explica en los documentos del [formulario](date-range-explicacion.md) y del [gráfico](dollar-chart-explicacion.md).
