# Plan — Duplicidad de DateRange / Dashboard

## Objetivo

Reducir exclusivamente dos duplicidades del dashboard: las consultas inicial y manual de `date-range.tsx`, y las reglas de validación de fechas utilizadas por el formulario y el endpoint.

Refactor implementado y verificado el 19-11-2026. Cierre en commit autorizado por el usuario el 20-11-2026, sin push automático.

## 0. Cerrar el avance actual antes del refactor

- [x] Revisar los cambios pendientes y separar el cierre de la historia actual de las futuras modificaciones de código por duplicidad.
- [x] Verificar el cierre registrado en `PLAN.md` y la prueba `e2e/selected-period-chart.spec.ts`, junto con las pruebas existentes, lint y TypeScript.
- [x] Revisar los cuatro documentos explicativos de `documentacion` y conservar la reorganización de planes realizada en el repositorio.
- [x] Preparar el cierre en un commit previo al refactor, revisando los archivos incluidos y excluyendo credenciales y archivos generados. Mensaje: `test: cerrar historia del dashboard y documentar su funcionamiento`.
- [x] Incluir este cierre en el commit autorizado por el usuario. Este plan no autoriza un push.

Verificación del cierre — 19-11-2026: 13 pruebas E2E y 7 de integración aprobadas; lint y TypeScript correctos. Las dos mejoras de duplicidad permanecen pendientes y no se modificó código de `src`.

## 1. Unificar las consultas de DateRange

- [x] Extraer una función reutilizable para las consultas inicial y manual, recibiendo las fechas inicial y final.
- [x] Centralizar la construcción de parámetros, `fetch`, comprobación de `response.ok`, lectura de JSON y actualización de observaciones, errores y carga.
- [x] Invocar esa misma función desde el efecto inicial y desde el envío del formulario, después de validar las fechas.
- [x] Conservar la consulta inicial del primer día del mes hasta hoy, los mensajes actuales y el tratamiento de respuestas `null` como una lista vacía.
- [x] Mantener estable la dependencia del efecto inicial para evitar consultas adicionales causadas por el refactor.

## 2. Compartir las reglas de validación

- [x] Extraer una función compartida en `src/lib/date-range-validation.ts`, sin dependencias exclusivas del navegador o del servidor.
- [x] Recibir `startDate`, `endDate` y `today`; devolver el mensaje de error correspondiente o `null` cuando el rango sea válido.
- [x] Reutilizar las reglas existentes: la fecha inicial no puede superar la final y ninguna fecha puede superar hoy. Conservar los mensajes y comprobar primero el orden del rango.
- [x] Utilizar la función desde `date-range.tsx` y `src/app/api/dollar/route.ts`, manteniendo la validación en ambas capas.
- [x] Conservar `getTodayInSantiago` como fuente de la fecha actual y `max={today}` en los campos del formulario.
- [x] Mantener `setError` en el formulario y la respuesta HTTP 400 con `{ error: mensaje }` en el endpoint.

## Documentación obligatoria

- [x] Agregar comentarios breves que expliquen el código implementado.
- [x] Actualizar `documentacion/date-range-explicacion.md` en el mismo avance del refactor para reflejar todos los cambios realizados.
- [x] Ajustar los fragmentos de código, números de línea, explicación de la función de consulta, validación compartida y recorrido de los datos.
- [x] Mantener la explicación dirigida a un desarrollador junior y eliminar descripciones que ya no correspondan al código resultante.

## Verificación y criterios de finalización

- [x] Comprobar con las pruebas existentes la consulta inicial y el cambio de período con actualización del gráfico.
- [x] Verificar que los rangos invertidos y las fechas futuras siguen rechazándose; una consulta de un solo día continúa siendo válida.
- [x] Comprobar los estados de carga, error y ausencia de datos, conservando los mensajes actuales.
- [x] Ejecutar `npm run test:integration`, `npm run test:e2e`, `npm run lint` y `npm run typecheck`.
- [x] Confirmar que ambas consultas utilizan una sola implementación y que el formulario y el endpoint comparten las reglas de validación.
- [x] Confirmar que la explicación Markdown coincide con la versión final del código.

Verificación del refactor — 19-11-2026: 7 pruebas de integración y 15 E2E aprobadas; lint y TypeScript correctos. Se verificaron respuestas vacías y `null`, limpieza de errores, fechas futuras sin validación nativa y prioridad del rango invertido en ambas capas. Los 12 fragmentos de código de la explicación coinciden con los archivos finales. Diff revisado; cambios listos para el commit propuesto, todavía sin realizar.

## Cierre del refactor

- [x] Revisar el diff para confirmar que solo aborda las dos duplicidades acordadas y su documentación.
- [x] Preparar un commit independiente del cierre de la historia, con las pruebas en verde. Mensaje propuesto: `refactor: unificar consultas y validación de fechas del dashboard`.
- [x] Realizar ese commit cuando el usuario lo indique, sin incluir un push automático. Autorizado el 20-11-2026.

Verificación previa al commit — 20-11-2026: 7 pruebas de integración y 15 E2E aprobadas; lint y TypeScript correctos. El cierre incluye también los planes de la historia 4 y del refactor previo, y el traslado de `PLAN.md` a `plans/BACKLOG-DASHBOARD/PLAN-Dashboard.md` sin cambios de contenido. El nuevo refactor previo y la comparación permanecen pendientes de implementación.

## Límites

- No agregar nuevas reglas de validación, cambios visuales, indicadores ni funcionalidades.
- No modificar el contrato público de `/api/dollar`, las observaciones ni el gráfico.
- No abordar concurrencia de consultas, actualización de la fecha al llegar la medianoche ni otras mejoras de escalabilidad.
- No ampliar el trabajo a una revisión general de lo implementado en `PLAN.md`.
