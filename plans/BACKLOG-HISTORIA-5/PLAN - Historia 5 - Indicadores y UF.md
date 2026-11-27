# Historia 5 — Indicadores y primera propuesta para UF

Estado de la historia 5.1 (UF): cerrado por cambio de enfoque.

Fecha de cierre: 27-11-2026.

## Cierre de la historia UF

La visualización y comparación de UF por períodos no resultó útil para el objetivo buscado por el usuario. Se cierra esta historia y se descartan sus verificaciones restantes.

El cierre inicial conservó la implementación de UF en el dashboard, incluida la consulta del servidor, y los cambios locales de comparación y renombrado del gráfico. IPC, TPM e Imacec permanecen como propuestas independientes.

### Decisión posterior: retirar UF del dashboard (27-11-2026)

A petición del usuario, se retiran la selección, consulta y comparación de UF de la interfaz. Se elimina el selector de indicadores y el dashboard queda dedicado a consultar y comparar dólar.

Se conservan `/api/uf`, la consulta al Banco Central, sus pruebas de integración y la estructura compartida (`IndicatorChart`, `indicator-client` y las rutas por indicador). El componente del gráfico mantiene su nombre general.

Las pruebas E2E de selección y visualización UF se sustituyen por una prueba que verifica que el dashboard ofrece dólar y no envía consultas UF. Las expectativas de las pruebas del dólar se mantienen.

La historia UF permanece cerrada. El siguiente resumen describe la implementación verificada antes de retirarla del dashboard.

### Implementado y verificado antes del retiro

- Consulta de la serie UF desde el servidor, con credenciales protegidas, filtrado de observaciones inválidas y manejo de respuestas vacías y fallos del proveedor.
- Selección de UF y consulta histórica individual con gráfico en CLP/UF, fechas y valores en el tooltip.
- Estados de carga, fechas inválidas, ausencia de datos y error en la consulta individual, con recuperación al volver a consultar.
- Comparación inicial de dos meses UF, con curvas identificadas por período, alineadas por días transcurridos y con fechas reales en el tooltip.
- Rutas centralizadas, cliente compartido de indicadores y gráfico renombrado a `IndicatorChart`; comprobaciones de regresión del dólar.

### Verificaciones restantes descartadas

Las siguientes pruebas de comparación UF, aprobadas en la lista de trabajo, se descartan por este cierre:

1. Actualizar ambas curvas al consultar otros meses.
2. Rechazar períodos inválidos, incompletos, futuros o idénticos.
3. Identificar los períodos durante la carga.
4. Identificar el período sin datos o fallido y señalar la comparación incompleta.
5. Omitir el gráfico cuando ambos períodos carecen de datos.

Los criterios originales se conservan como referencia; su validación quedó parcial al cerrar la historia. Las secciones siguientes documentan la propuesta original.

## División propuesta

La quinta historia reúne cuatro indicadores. Se propone dividirla: UF y TPM pueden partir del flujo diario existente; IPC e Imacec requieren definir la comparación de datos mensuales. Además, [STACK.md](../../STACK.md) contempla tres variantes del IPC, dos pendientes de verificar.

- **5.1:** Como visitante, quiero explorar la evolución histórica de la UF y compararla entre períodos para analizar su comportamiento.
- **5.2:** Como visitante, quiero explorar la evolución histórica del IPC y compararla entre períodos, eligiendo índice, variación mensual o variación en 12 meses, para analizar los precios.
- **5.3:** Como visitante, quiero explorar la evolución histórica de la TPM y compararla entre períodos para analizar sus cambios.
- **5.4:** Como visitante, quiero explorar la evolución histórica del Imacec y compararla entre períodos para analizar la actividad económica.

Para comenzar con 5.1, se propone conservar las reglas actuales de comparación del dólar.

## Story

Como visitante, quiero explorar la evolución histórica de la UF y compararla entre períodos para analizar su comportamiento.

## Acceptance criteria

Criterios originales conservados como referencia histórica, con validación parcial al cierre.

- [ ] Dado el dashboard, cuando seleccione UF y consulte un rango histórico válido, entonces veré su evolución expresada en pesos por UF y podré conocer la fecha y el valor de cada observación.
- [ ] Dada la UF seleccionada, cuando compare dos meses calendario completos, históricos y distintos, entonces veré dos curvas identificadas por período, alineadas por días transcurridos, con sus fechas reales y valores; al consultar otros meses, las curvas se actualizarán.
- [ ] Dada una consulta de UF, cuando esté cargando, las fechas sean inválidas, falten datos o falle el servicio, entonces veré el estado correspondiente y, en comparación, el período afectado; los valores ausentes no se mostrarán como cero y una comparación con datos de un solo período se identificará como incompleta.

## Plan

- Incorporar la selección entre dólar y UF.
- Extender la consulta al Banco Central para obtener la serie seleccionada, conservando las credenciales en el servidor.
- Adaptar títulos, unidades y detalles del gráfico al indicador consultado.
- Reutilizar las reglas de fechas y comparación existentes para la UF.
- Verificar consulta, comparación y estados de UF, y comprobar que el dólar conserve su comportamiento.

## Out of scope

- Incorporar IPC, TPM e Imacec.
- Comparar indicadores diferentes entre sí.
- Exportación a Excel y nuevas métricas.

## Suggestions (your call)

- Compartir la consulta, el formulario y el gráfico entre dólar y UF: actualmente están ligados al dólar y ambos indicadores necesitan el mismo flujo diario.
