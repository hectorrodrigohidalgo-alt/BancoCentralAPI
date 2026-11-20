<!-- Documento temporal de la historia actual. Eliminar al pasar a la siguiente historia. -->

## Historia

Como visitante, quiero consultar la evolución histórica del dólar en un dashboard interactivo para explorar sus valores durante un período.

## Criterios de aceptación

- [x] Dado que abro el dashboard, cuando finalice la consulta, entonces veré un gráfico del dólar observado desde el primer día del mes actual hasta hoy, expresado en pesos chilenos por dólar.
- [x] Dado el dashboard, cuando elija fechas inicial y final válidas y consulte, entonces veré el período solicitado y podré conocer la fecha y el valor de cada observación al pasar sobre el gráfico.
- [x] Dada una consulta, cuando esté cargando, el rango sea inválido, no existan datos o falle el servicio, entonces veré el estado correspondiente; las fechas sin valor válido no se mostrarán como cero.

## Plan

- Consultar la serie del dólar desde el servidor, manteniendo privado el token.
- Mostrar inicialmente el mes calendario actual, desde el día 1 hasta hoy.
- Permitir seleccionar fechas y validar el rango antes de consultar.
- Representar las observaciones con Apache ECharts y mostrar fecha y valor al pasar sobre ellas.
- Verificar el período inicial, los cambios de fechas y los estados de consulta.

## Fuera de alcance

- Comparación entre períodos.
- Zoom y desplazamiento del gráfico.
- Otros indicadores, exportación a Excel y despliegue.

## Verificación final — 17-11-2026

- 13 pruebas E2E y 7 de integración aprobadas; lint y TypeScript correctos.
- Compilación de producción completada con `npm run build`.
- Verificación en navegador de la compilación de producción con datos reales: período inicial del 01-11-2026 al 17-11-2026, cambio al rango 02-11-2026 a 10-11-2026, unidad CLP/USD y tooltip con fecha y valor.
- Los estados de carga, rango inválido, ausencia de datos y error del servicio, y la exclusión de valores inválidos, están cubiertos por las pruebas automatizadas.
