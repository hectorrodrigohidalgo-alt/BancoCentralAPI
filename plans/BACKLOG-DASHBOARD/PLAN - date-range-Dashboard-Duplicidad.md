# Plan — Duplicidad de DateRange / Dashboard

## Objetivo

Reducir exclusivamente dos duplicidades del dashboard: las consultas inicial y manual de `date-range.tsx`, y las reglas de validación de fechas utilizadas por el formulario y el endpoint.

Este documento define el trabajo pendiente; su creación no implementa el refactor.

## 0. Cerrar el avance actual antes del refactor

- [x] Revisar los cambios pendientes y separar el cierre de la historia actual de las futuras modificaciones de código por duplicidad.
- [x] Verificar el cierre registrado en `PLAN.md` y la prueba `e2e/selected-period-chart.spec.ts`, junto con las pruebas existentes, lint y TypeScript.
- [x] Revisar los cuatro documentos explicativos de `documentacion` y conservar la reorganización de planes realizada en el repositorio.
- [x] Preparar el cierre en un commit previo al refactor, revisando los archivos incluidos y excluyendo credenciales y archivos generados. Mensaje: `test: cerrar historia del dashboard y documentar su funcionamiento`.
- [x] Incluir este cierre en el commit autorizado por el usuario. Este plan no autoriza un push.

Verificación del cierre — 19-11-2026: 13 pruebas E2E y 7 de integración aprobadas; lint y TypeScript correctos. Las dos mejoras de duplicidad permanecen pendientes y no se modificó código de `src`.

## 1. Unificar las consultas de DateRange

- [ ] Extraer una función reutilizable para las consultas inicial y manual, recibiendo las fechas inicial y final.
- [ ] Centralizar la construcción de parámetros, `fetch`, comprobación de `response.ok`, lectura de JSON y actualización de observaciones, errores y carga.
- [ ] Invocar esa misma función desde el efecto inicial y desde el envío del formulario, después de validar las fechas.
- [ ] Conservar la consulta inicial del primer día del mes hasta hoy, los mensajes actuales y el tratamiento de respuestas `null` como una lista vacía.
- [ ] Mantener estable la dependencia del efecto inicial para evitar consultas adicionales causadas por el refactor.

## 2. Compartir las reglas de validación

- [ ] Extraer una función compartida en `src/lib/date-range-validation.ts`, sin dependencias exclusivas del navegador o del servidor.
- [ ] Recibir `startDate`, `endDate` y `today`; devolver el mensaje de error correspondiente o `null` cuando el rango sea válido.
- [ ] Reutilizar las reglas existentes: la fecha inicial no puede superar la final y ninguna fecha puede superar hoy. Conservar los mensajes y comprobar primero el orden del rango.
- [ ] Utilizar la función desde `date-range.tsx` y `src/app/api/dollar/route.ts`, manteniendo la validación en ambas capas.
- [ ] Conservar `getTodayInSantiago` como fuente de la fecha actual y `max={today}` en los campos del formulario.
- [ ] Mantener `setError` en el formulario y la respuesta HTTP 400 con `{ error: mensaje }` en el endpoint.

## Documentación obligatoria

- [ ] Agregar comentarios breves que expliquen el código implementado.
- [ ] Actualizar `documentacion/date-range-explicacion.md` en el mismo avance del refactor para reflejar todos los cambios realizados.
- [ ] Ajustar los fragmentos de código, números de línea, explicación de la función de consulta, validación compartida y recorrido de los datos.
- [ ] Mantener la explicación dirigida a un desarrollador junior y eliminar descripciones que ya no correspondan al código resultante.

## Verificación y criterios de finalización

- [ ] Comprobar con las pruebas existentes la consulta inicial y el cambio de período con actualización del gráfico.
- [ ] Verificar que los rangos invertidos y las fechas futuras siguen rechazándose; una consulta de un solo día continúa siendo válida.
- [ ] Comprobar los estados de carga, error y ausencia de datos, conservando los mensajes actuales.
- [ ] Ejecutar `npm run test:integration`, `npm run test:e2e`, `npm run lint` y `npm run typecheck`.
- [ ] Confirmar que ambas consultas utilizan una sola implementación y que el formulario y el endpoint comparten las reglas de validación.
- [ ] Confirmar que la explicación Markdown coincide con la versión final del código.

## Cierre del refactor

- [ ] Revisar el diff para confirmar que solo aborda las dos duplicidades acordadas y su documentación.
- [ ] Preparar un commit independiente del cierre de la historia, con las pruebas en verde. Mensaje propuesto: `refactor: unificar consultas y validación de fechas del dashboard`.
- [ ] Realizar ese commit cuando el usuario lo indique, sin incluir un push automático.

## Límites

- No agregar nuevas reglas de validación, cambios visuales, indicadores ni funcionalidades.
- No modificar el contrato público de `/api/dollar`, las observaciones ni el gráfico.
- No abordar concurrencia de consultas, actualización de la fecha al llegar la medianoche ni otras mejoras de escalabilidad.
- No ampliar el trabajo a una revisión general de lo implementado en `PLAN.md`.
