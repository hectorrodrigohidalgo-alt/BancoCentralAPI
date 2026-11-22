# Historia 4 — Comparar el dólar entre dos períodos

## Historia y criterios de aceptación

Como visitante, quiero comparar el dólar entre dos períodos históricos para entender cómo cambió su comportamiento.

- [x] Dado el dashboard, cuando active la comparación, seleccione dos rangos válidos y consulte, entonces veré dos líneas superpuestas, identificadas por período, alineadas por días transcurridos y expresadas en CLP/USD; al pasar sobre ellas podré conocer sus fechas reales y valores.
- [x] Dada una comparación, cuando cambie uno o ambos períodos y consulte nuevamente, entonces veré las curvas correspondientes a la nueva selección.
- [x] Dada una consulta, cuando exista carga, un rango inválido, ausencia de datos o error del servicio, entonces veré el estado correspondiente y el período afectado, sin presentar valores ausentes como cero.

## Decisiones acordadas y comportamiento

- El dashboard conserva su consulta inicial del primer día del mes hasta hoy en Santiago.
- Una opción **Activar comparación** muestra el segundo rango. Sus fechas iniciales corresponden al primer y último día del mes calendario anterior.
- Activar la opción prepara el formulario; la comparación se consulta al pulsar **Comparar**. Al desactivarla, vuelve la consulta individual existente.
- El eje horizontal representa días calendario desde el inicio de cada rango: día 0, día 1, etc. El eje vertical conserva los precios reales en CLP/USD.
- Los períodos pueden tener distinta duración. Cada curva termina con sus propias observaciones; los fines de semana y feriados mantienen su distancia temporal. Se unen las observaciones disponibles sin generar cotizaciones intermedias.
- Las curvas se distinguen por color y estilo de línea. La leyenda identifica los períodos y el detalle muestra período, fecha real y valor.

## Plan de implementación

1. Ampliar el formulario con la activación de comparación y las fechas del segundo período. Aplicar las reglas compartidas a ambos rangos y exigir sus fechas antes de comparar.
2. Reutilizar el acceso existente al servidor para consultar ambos rangos. Mantener **`GET /api/dollar` sin cambios**, realizando una solicitud por período y asociando cada resultado con el rango solicitado.
3. Preparar las observaciones para el gráfico como pares de días transcurridos y valores, conservando sus fechas originales. Calcular diferencias entre fechas calendario con una referencia UTC para evitar desplazamientos por cambios de hora.
4. Mostrar las dos series y gestionar sus estados. Al iniciar otra comparación, retirar los resultados anteriores; publicar los nuevos cuando ambas solicitudes terminen. Si una falla o queda vacía, mostrar los datos disponibles con un aviso explícito de comparación incompleta. Bloquear nuevos envíos y el cambio de modo durante la consulta.
5. Verificar los criterios, conservar las pruebas de consulta individual y actualizar las explicaciones del formulario y del gráfico para desarrolladores junior.

## Verificación y límites

- [x] Probar alineación con fechas iniciales distintas, días sin observaciones, cambio de mes/año, períodos de distinta duración y rangos de un día.
- [x] Comprobar fechas automáticas del mes anterior, incluyendo enero y febrero de año bisiesto.
- [x] Verificar identificación de curvas, valores reales, detalles al pasar sobre ellas y actualización de ambos rangos.
- [x] Cubrir rangos invertidos, fechas futuras, carga, respuestas vacías o `null`, fallo de uno o ambos períodos y regreso a consulta individual.
- [x] Ejecutar integración, E2E, lint y TypeScript.

Quedan fuera otros indicadores, normalización a base 100, nuevas métricas, exportación y despliegue. No se agregan dependencias ni almacenamiento.

## Implementación y evidencia

- Formulario y estados: `src/app/date-range.tsx`.
- Curvas, leyenda y detalle: `src/app/dollar-chart.tsx`.
- Mes anterior: `src/lib/dates.ts`; alineación UTC: `src/lib/dollar-comparison.ts`.
- `npm run test:integration`: 12 pruebas; `npm run test:e2e -- --workers=2`: 32 pruebas, incluyendo las de consulta individual.
- `npm run lint` y `npm run typecheck` sin errores.
- Las pruebas usan respuestas simuladas del servicio; no requieren credenciales ni disponibilidad del Banco Central.
- Explicaciones actualizadas en `documentacion/Dashboard/date-range-explicacion.md` y `documentacion/Dashboard/dollar-chart-explicacion.md`.
