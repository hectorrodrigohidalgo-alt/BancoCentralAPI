# Impedir la comparación de períodos idénticos

## Comportamiento

Al pulsar **Comparar**, rechazar la consulta si ambos períodos tienen exactamente la misma fecha inicial y final.

El siguiente ejemplo quedará bloqueado:

- Período 1: `01-06-2026` a `30-06-2026`.
- Período 2: `01-06-2026` a `30-06-2026`.

La [validación de meses completos](<PLAN - Historia 4 - Validar meses completos.md>) reemplaza la aceptación de rangos arbitrarios: dos meses completos que compartan el inicio o el fin son idénticos. Los rangos de un día se rechazan primero por no abarcar un mes completo.

## Implementación

- En `queryForm` de `src/app/date-range.tsx`, comprobar la igualdad después de validar las fechas básicas y el mes completo de ambos períodos, antes de llamar a `queryComparison`.
- Si coinciden ambos extremos, mostrar: **“Los períodos 1 y 2 no pueden tener el mismo rango de fechas.”**
- Detener el envío sin realizar solicitudes ni activar la carga. Conservar las fechas ingresadas y retirar cualquier gráfico anterior, según la regla posterior de meses completos.
- Al corregir una fecha y consultar nuevamente, limpiar el aviso mediante el flujo existente.
- Mantener la consulta individual y el contrato de `GET /api/dollar`.
- Actualizar las explicaciones correspondientes en `documentacion/Dollar/` y registrar la regla en el plan de la Historia 4.

## Verificación

Agregar cobertura E2E para comprobar:

- [x] Rechazo de meses completos idénticos sin solicitudes, conservando las fechas y retirando el gráfico.
- [x] Prioridad del aviso de mes completo frente al de igualdad para rangos idénticos de un día.
- [x] Comparación exitosa después de corregir el mes seleccionado.
- [x] Conservación de las consultas individuales de un día.

Ejecutar E2E, lint y TypeScript.
