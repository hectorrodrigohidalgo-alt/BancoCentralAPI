# Validación del formulario del dólar

`src/app/date-range.tsx` administra la consulta individual y la comparación. Cada activación prepara el período 1 con el mes anterior completo y el período 2 con el mes actual hasta hoy en Santiago, sin consultar. Las fechas del primer período se controlan mediante estado; el segundo se vuelve a montar con sus valores predeterminados. Así, reactivar reemplaza las selecciones anteriores de ambos rangos.

La consulta inicial sigue usando el mes actual hasta hoy. Al desactivar la comparación se consulta el primer rango seleccionado y se conservan sus fechas. Mientras el mes actual esté incompleto, pulsar Comparar con los valores predeterminados muestra el aviso del período 2.

## Qué ocurre al pulsar Comparar

`queryForm` obtiene las fechas con `FormData` y retira el resultado anterior mediante `setResult(null)`. Así, cualquier error evita mostrar un gráfico asociado a otras fechas y conserva los campos para corregirlos.

Las comprobaciones se hacen en este orden:

1. Fechas requeridas, inicio anterior o igual al fin y ausencia de fechas futuras para ambos períodos. La referencia de hoy usa `America/Santiago`.
2. Un mes calendario completo por período: del día 1 al último día del mismo mes.
3. Períodos distintos: no pueden coincidir sus fechas inicial y final.

Si falla una comprobación, se muestra un aviso y la función termina antes de llamar a `queryComparison`. No hay solicitudes ni se activa la carga. Los errores de fechas y mes completo identifican el período afectado; el de igualdad menciona ambos períodos.

## Cómo se reconoce un mes completo

`validateFullMonthRange`, en `src/lib/date-range-validation.ts`, calcula el último día como el día 0 del mes siguiente en UTC. Esto permite reconocer febrero de 28 o 29 días y meses de 30 o 31 días sin depender del huso horario del navegador. Devuelve `null` cuando el rango cumple la regla o el mensaje que debe mostrar el formulario. Comparte módulo con `validateDateRange` para reunir las validaciones de fechas reutilizables.

Los valores predeterminados solo preparan el formulario. Por ejemplo, del 1 al 11 de noviembre no es un mes completo y se rechaza. Del 1 al 30 de noviembre es válido cuando hoy ya es 30 de noviembre; antes se rechaza por contener fechas futuras.

## Corrección y consulta individual

Después de corregir las fechas y volver a comparar, `queryComparison` limpia el aviso, activa la carga y consulta ambos períodos. Una validación fallida no cambia las fechas elegidas.

La consulta individual utiliza las validaciones básicas y conserva sus rangos libres, incluidos los de un día. `GET /api/dollar` mantiene su contrato; la restricción de mes completo se aplica al envío del formulario en modo comparación.

Las pruebas del validador están en `tests/date-range-validation.test.mjs`; la preparación de datos del gráfico se prueba en `tests/dollar-comparison.test.mjs`. Las de interfaz, en `e2e/dollar-comparison.spec.ts`, comprueban solicitudes, avisos, gráficos, recuperación y fechas con respuestas simuladas, sin depender del Banco Central.
