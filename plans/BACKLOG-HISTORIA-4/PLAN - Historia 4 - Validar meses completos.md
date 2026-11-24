# Validar meses completos antes de comparar

## Regla acordada

Al pulsar **Comparar**, ambos períodos deben abarcar exactamente un mes calendario completo: desde el día 1 hasta el último día del mismo mes.

- Válido: `01-06-2026` a `30-06-2026`.
- Inválido: `01-06-2026` a `29-06-2026`.
- Inválido: `15-06-2026` a `14-07-2026`.
- Inválido: un rango que abarque varios meses.

La regla también se aplica al mes actual. Los valores predeterminados solo preparan el formulario: el período que contiene el mes actual queda inválido mientras esté incompleto; el usuario deberá seleccionar un mes completo ya transcurrido. Tras implementar los períodos predeterminados, ese rango corresponde al período 2.

## Implementación y mensajes

- Mantener la función de validación de mes completo en `src/lib/date-range-validation.ts`, calculando el último día según el calendario, sin asumir 30 días. Se trasladó desde `dollar-comparison.ts` en el refactor posterior a la segunda iteración.
- En `queryForm` de `src/app/date-range.tsx`, validar primero fechas requeridas, orden y fechas futuras; después comprobar el mes completo de cada período y finalmente la regla de períodos idénticos.
- Ante un error de comparación, retirar cualquier gráfico anterior, conservar los campos y detener el envío sin solicitudes ni carga.
- Identificar el período afectado con un aviso como: **“Período 2: selecciona un mes calendario completo, desde el día 1 hasta el último día del mes.”**
- Al corregir los rangos y consultar, limpiar el aviso mediante el flujo existente.
- Aplicar esta restricción únicamente a la comparación. La consulta individual conserva sus rangos libres, incluidos los de un día.
- Mantener el contrato del endpoint.

## Verificación

- [x] Probar meses de 28, 29, 30 y 31 días, incluido febrero bisiesto.
- [x] Rechazar meses parciales, rangos de un día, rangos entre meses y períodos de varios meses en la función de validación.
- [x] Comprobar el rechazo del mes actual incompleto y la aceptación de un mes terminado.
- [x] Verificar que un envío inválido retire un gráfico existente y no genere solicitudes.
- [x] Actualizar las pruebas de comparación para utilizar meses completos históricos y conservar la cobertura de períodos idénticos.
- [x] Ejecutar integración, E2E, lint y TypeScript.

## Primera iteración — 22-11-2026

Se agregó `validateFullMonthRange(startDate, endDate)` en `src/lib/dollar-comparison.ts`: devuelve `null` para un mes completo o el mensaje de validación. Calcula el último día en UTC y contempla años bisiestos. La prueba en `tests/dollar-comparison.test.mjs` cubre 16 casos; se comprobó su fallo antes de implementar la función y las 13 pruebas de integración pasan. Lint y TypeScript también pasan; E2E queda pendiente para la integración con el formulario.

Al cierre de esta primera iteración quedaban pendientes la conexión con `queryForm`, el retiro del gráfico ante errores, la adaptación de E2E y las explicaciones del flujo final.

## Segunda iteración — 22-11-2026

`queryForm` conecta la validación de mes completo solo en comparación, después de validar las fechas básicas de ambos períodos y antes de rechazar períodos idénticos. Cada envío de comparación retira el resultado anterior; los errores conservan las fechas y detienen el flujo antes de activar la carga o realizar solicitudes. Corregir los rangos y comparar limpia el aviso mediante `queryComparison`.

Las pruebas E2E utilizan meses históricos completos y comprueban errores en ambos períodos, prioridad de mensajes, rechazo del mes actual parcial, aceptación en su último día, retiro de gráficos individuales y de comparación, conservación de fechas y recuperación tras corregir. Se mantienen las pruebas de consulta individual de un día y el contrato del endpoint. La explicación está en `documentacion/Dollar/date-range-explicacion.md`.

Verificación: 13 pruebas de integración y 38 E2E aprobadas; lint y TypeScript sin errores. Antes de conectar la función se comprobó que fallaba la prueba del mes actual incompleto.

## Documentación

Refactor posterior: `validateFullMonthRange` y sus 16 casos se trasladaron a `src/lib/date-range-validation.ts` y `tests/date-range-validation.test.mjs`. El formulario importa ambos validadores desde el mismo módulo; la lógica y su aplicación exclusiva a comparación se conservan.

Actualizar los planes de la Historia 4 y las explicaciones en `documentacion/Dollar/`, indicando que los valores predeterminados preparan el formulario y deben cumplir la validación antes de mostrar una comparación.

Este plan actualiza el comportamiento ante errores de comparación: se retira cualquier gráfico anterior, también cuando los rangos sean idénticos. Esta decisión reemplaza la conservación del gráfico indicada en el plan anterior de períodos idénticos.

Planes relacionados:

- [Historia 4: comparar el dólar](<PLAN - Historia 4 - Comparar Dolar.md>).
- [Períodos predeterminados](<PLAN - Historia 4 - Periodos predeterminados.md>).
- [Validar períodos idénticos](<PLAN - Historia 4 - Validar periodos identicos.md>).
