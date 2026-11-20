# Revisión previa: reducir duplicidad al implementar la historia 4

## Resultado de la revisión

El código actual permite reutilizar buena parte del dashboard. Recomiendo un refactor pequeño antes de implementar la comparación y completar las otras adaptaciones dentro de la historia.

El principal riesgo está en `queryDollar`, en [`date-range.tsx`](../../src/app/date-range.tsx): mezcla la petición con las actualizaciones de observaciones, error y carga.

**Llamarla dos veces en paralelo produciría conflictos:** ambas llamadas escribirían sobre las mismas observaciones, la primera que termine desactivaría la carga y los errores capturados internamente impedirían distinguir con claridad qué consulta falló.

La validación compartida y la consulta al Banco Central desde el servidor ya son reutilizables.

## Refactor previo recomendado

- Extraer la petición del navegador a `src/lib/dollar-client.ts`, con una función que reciba ambas fechas y devuelva `Promise<DollarObservation[]>`.
- Esa función concentrará parámetros, `fetch`, comprobación HTTP, lectura JSON y conversión de `null` a `[]`. Rechazará la promesa cuando falle la consulta y no actualizará estados de React.
- Mantener en el componente la gestión de carga, error y observaciones. La consulta inicial y la manual utilizarán esa misma función, conservando sus mensajes y comportamiento actual.
- Mantener estable la dependencia del efecto inicial para evitar nuevas consultas provocadas por renderizados.

Este paso prepara la reutilización sin introducir todavía la comparación.

## Adaptaciones dentro de la historia 4

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

La revisión fue estática: todavía no se modificaron archivos de código ni se ejecutaron pruebas en este paso.
