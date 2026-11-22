# Impedir la comparación de períodos idénticos

## Comportamiento

Al pulsar **Comparar**, rechazar la consulta si ambos períodos tienen exactamente la misma fecha inicial y final.

El siguiente ejemplo quedará bloqueado:

- Período 1: `01-06-2026` a `01-06-2026`.
- Período 2: `01-06-2026` a `01-06-2026`.

Se permitirá compartir algunas fechas, siempre que los rangos completos sean distintos.

## Implementación

- En `queryForm` de `src/app/date-range.tsx`, agregar la comprobación después de validar individualmente ambos rangos y antes de llamar a `queryComparison`.
- Si coinciden ambos extremos, mostrar: **“Los períodos 1 y 2 no pueden tener el mismo rango de fechas.”**
- Detener el envío sin realizar solicitudes ni activar la carga. Conservar las fechas ingresadas y cualquier gráfico anterior.
- Al corregir una fecha y consultar nuevamente, limpiar el aviso mediante el flujo existente.
- Mantener la consulta individual y el contrato de `GET /api/dollar`.
- Actualizar las explicaciones correspondientes en `documentacion/Dollar/` y registrar la regla en el plan de la Historia 4.

## Verificación

Agregar cobertura E2E para comprobar:

- [ ] Rechazo de rangos idénticos de un día y de varios días, sin solicitudes.
- [ ] Aceptación de rangos que compartan únicamente el inicio o el fin.
- [ ] Comparación exitosa después de corregir una fecha.
- [ ] Conservación de las consultas individuales de un día.

Ejecutar E2E, lint y TypeScript.
