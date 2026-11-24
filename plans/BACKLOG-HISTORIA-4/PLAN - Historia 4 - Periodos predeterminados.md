# Períodos predeterminados al activar la comparación

## Comportamiento acordado

Cada vez que se active **Activar comparación**, preparar:

- **Período 1:** mes calendario anterior completo.
- **Período 2:** primer día del mes actual hasta hoy en Santiago.

Por ejemplo, al 22 de noviembre de 2026:

| Período | Inicio | Fin |
| --- | --- | --- |
| 1 | 01-10-2026 | 31-10-2026 |
| 2 | 01-11-2026 | 22-11-2026 |

Activar la opción solo prepara el formulario. Las solicitudes comienzan al pulsar **Comparar**.

Ambos rangos deben cumplir la [validación de meses completos](<PLAN - Historia 4 - Validar meses completos.md>) antes de consultar. El mes actual hasta hoy será inválido mientras no sea su último día: se muestra el aviso del período 2 y se retira cualquier gráfico anterior, sin solicitudes.

## Implementación

- En `src/app/date-range.tsx`, controlar las fechas del primer período mediante estado para poder cambiarlas al activar la comparación.
- Inicializar el segundo período con el mes actual hasta hoy.
- En cada activación, restablecer ambos rangos a estos valores predeterminados, reemplazando selecciones anteriores.
- Conservar la consulta inicial individual del mes actual. Al desactivar la comparación, mantener el comportamiento existente: consultar el primer rango seleccionado.
- Incorporar la validación ya acordada que impide consultar rangos exactamente iguales y muestra el aviso correspondiente, según el [plan de validación de períodos idénticos](<PLAN - Historia 4 - Validar periodos identicos.md>).
- Mantener el endpoint y el cálculo de días transcurridos.

## Verificación

- [x] Comprobar los valores iniciales y que activar la opción no genere solicitudes.
- [x] Cubrir enero, febrero bisiesto y diferencias entre la fecha UTC y Santiago.
- [x] Verificar la reactivación después de editar ambos rangos.
- [x] Conservar las pruebas de comparación, rangos idénticos y consulta individual.
- [x] Ejecutar E2E, lint y TypeScript.

## Primera iteración — 23-11-2026

El primer período usa fechas controladas mediante estado y se restablece al mes anterior en cada activación. El segundo se monta con el mes actual hasta hoy en Santiago. Activar no consulta; desactivar consulta el primer rango editado. Se conserva la consulta individual inicial y las validaciones existentes.

Se ampliaron las pruebas de valores iniciales para ambos períodos, enero, febrero bisiesto y cambio de fecha entre UTC y Santiago. Una nueva prueba verifica la reactivación después de editar ambos rangos y la consulta al salir. El rechazo del mes actual incompleto identifica ahora el período 2.

Verificación: 39 pruebas E2E aprobadas; lint y TypeScript sin errores.

## Documentación

Actualizar el [plan de la Historia 4](<PLAN - Historia 4 - Comparar Dolar.md>) y las explicaciones en `documentacion/Dollar/` para reflejar el nuevo orden: período anterior primero y período actual segundo.
