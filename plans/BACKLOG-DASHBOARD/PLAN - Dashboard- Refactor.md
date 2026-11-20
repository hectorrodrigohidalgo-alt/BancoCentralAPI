# Revisión previa: reducir duplicidad al implementar la historia 4

## Resultado de la revisión

El refactor previo se implementó el 20-11-2026 en `feat/comparar-dolar`. Las adaptaciones de comparación descritas más abajo corresponden al siguiente avance de la historia 4.

En la revisión inicial, `queryDollar`, en [`date-range.tsx`](../../src/app/date-range.tsx), mezclaba la petición con las actualizaciones de observaciones, error y carga. La petición ahora está separada en [`dollar-client.ts`](../../src/lib/dollar-client.ts).

**`queryDollar` sigue gestionando una consulta individual:** llamarla dos veces en paralelo escribiría sobre los mismos estados. La función `fetchDollarObservations` extraída sí devuelve resultados independientes y propaga los errores; la historia 4 coordinará ambas peticiones y sus estados.

La validación compartida y la consulta al Banco Central desde el servidor ya son reutilizables.

## Refactor previo implementado

- [x] Extraer la petición del navegador a `src/lib/dollar-client.ts`, con una función que reciba ambas fechas y devuelva `Promise<DollarObservation[]>`.
- [x] Concentrar parámetros, `fetch`, comprobación HTTP, lectura JSON y conversión de `null` a `[]`. Rechazar la promesa cuando falle la consulta sin actualizar estados de React.
- [x] Mantener en el componente la gestión de carga, error y observaciones. La consulta inicial y la manual utilizan esa misma función, conservando sus mensajes y comportamiento actual.
- [x] Mantener estable la dependencia del efecto inicial para evitar nuevas consultas provocadas por renderizados.

Este paso prepara la reutilización sin introducir todavía la comparación.

## Adaptaciones dentro de la historia 4 — pendientes

- **Consultas:** utilizar la función anterior para uno o dos rangos. En comparación, esperar ambos resultados con `Promise.allSettled` y publicar juntos sus estados, conservando la identificación y las fechas solicitadas de cada período.
- **Formulario:** reutilizar un bloque de campos de período para los dos rangos. Aplicar `validateDateRange` a cada uno; comprobar los campos obligatorios antes de consultar. Conservar también la validación del endpoint.
- **Gráfico:** ampliar [`DollarChart`](../../src/app/dollar-chart.tsx) para recibir las series identificadas y el modo de visualización. Compartir inicialización, accesibilidad, ajuste de tamaño y liberación de recursos; cambiar únicamente ejes, series, leyenda y detalle según el modo.
- **Fechas:** centralizar el cálculo del mes anterior y la conversión de fechas calendario a días UTC en funciones pequeñas. Utilizar una sola preparación de puntos para ambas curvas, conservando las fechas originales.
- **Estados:** conservar un resultado por período, incluyendo rango, observaciones y error. El gráfico recibirá los datos de las consultas realizadas, evitando etiquetar resultados anteriores con fechas editadas después.

## Verificación

- Antes del refactor, ejecutar las pruebas existentes como referencia.
- Después, comprobar consulta inicial, consulta manual, carga, error, respuestas vacías y `null`, manteniendo los mensajes actuales.
- Durante la historia, verificar respuestas en distinto orden, fallo de un período y carga activa hasta que terminen ambas consultas.
- Conservar las pruebas del dashboard individual y agregar las verificaciones de comparación previstas.
- Ejecutar integración, E2E, lint y TypeScript; actualizar la documentación del código modificado.

## Límites

Mantener el contrato de `/api/dollar`, las credenciales privadas y el filtrado de observaciones existente. No agregar dependencias, una infraestructura genérica de consultas ni componentes para indicadores futuros.

## Verificación del refactor previo — 20-11-2026

- Referencia antes del cambio: 7 pruebas de integración y 15 E2E aprobadas.
- Resultado después del cambio: 8 pruebas de integración y 15 E2E aprobadas; lint y TypeScript correctos.
- Nueva prueba: una petición permanece pendiente mientras otra falla y otra devuelve `null`; cada llamada conserva su resultado y el fallo se propaga al llamador.
- Explicación de `date-range.tsx` actualizada con la función extraída, los fragmentos, las líneas y el recorrido de los datos.
- La comparación, las adaptaciones del formulario y del gráfico y los estados por período permanecen pendientes. Cierre del refactor previo en commit autorizado por el usuario el 20-11-2026; push pendiente.
