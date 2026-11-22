# Validar meses completos antes de comparar

## Regla acordada

Al pulsar **Comparar**, ambos períodos deben abarcar exactamente un mes calendario completo: desde el día 1 hasta el último día del mismo mes.

- Válido: `01-06-2026` a `30-06-2026`.
- Inválido: `01-06-2026` a `29-06-2026`.
- Inválido: `15-06-2026` a `14-07-2026`.
- Inválido: un rango que abarque varios meses.

La regla también se aplica al mes actual. Se mantienen los valores predeterminados acordados, pero el período 2 quedará inválido mientras el mes esté incompleto; el usuario deberá seleccionar un mes completo ya transcurrido.

## Implementación y mensajes

- Agregar una función de validación de mes completo en `src/lib/dollar-comparison.ts`, calculando el último día según el calendario, sin asumir 30 días.
- En `queryForm` de `src/app/date-range.tsx`, validar primero fechas requeridas, orden y fechas futuras; después comprobar el mes completo de cada período y finalmente la regla de períodos idénticos.
- Ante un error de comparación, retirar cualquier gráfico anterior, conservar los campos y detener el envío sin solicitudes ni carga.
- Identificar el período afectado con un aviso como: **“Período 2: selecciona un mes calendario completo, desde el día 1 hasta el último día del mes.”**
- Al corregir los rangos y consultar, limpiar el aviso mediante el flujo existente.
- Aplicar esta restricción únicamente a la comparación. La consulta individual conserva sus rangos libres, incluidos los de un día.
- Mantener el contrato del endpoint.

## Verificación

- [ ] Probar meses de 28, 29, 30 y 31 días, incluido febrero bisiesto.
- [ ] Rechazar meses parciales, rangos de un día, rangos entre meses y períodos de varios meses.
- [ ] Comprobar el rechazo del mes actual incompleto y la aceptación de un mes terminado.
- [ ] Verificar que un envío inválido retire un gráfico existente y no genere solicitudes.
- [ ] Actualizar las pruebas de comparación para utilizar meses completos históricos y conservar la cobertura de períodos idénticos.
- [ ] Ejecutar integración, E2E, lint y TypeScript.

## Documentación

Actualizar los planes de la Historia 4 y las explicaciones en `documentacion/Dollar/`, indicando que los valores predeterminados preparan el formulario y deben cumplir la validación antes de mostrar una comparación.

Este plan actualiza el comportamiento ante errores de comparación: se retira cualquier gráfico anterior, también cuando los rangos sean idénticos. Esta decisión reemplaza la conservación del gráfico indicada en el plan anterior de períodos idénticos.

Planes relacionados:

- [Historia 4: comparar el dólar](<PLAN - Historia 4 - Comparar Dolar.md>).
- [Períodos predeterminados](<PLAN - Historia 4 - Periodos predeterminados.md>).
- [Validar períodos idénticos](<PLAN - Historia 4 - Validar periodos identicos.md>).
