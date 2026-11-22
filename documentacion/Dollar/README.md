# Historia 4: comparar el dólar entre dos períodos

Esta carpeta explica la implementación para un desarrollador junior. Incluye el formulario, el gráfico, los cálculos de fechas y las pruebas. Los ejemplos corresponden al código del proyecto.

## Guía de lectura

| Documento | Archivo explicado | Qué aprenderás |
| --- | --- | --- |
| [Formulario](date-range-explicacion.md) | `src/app/date-range.tsx` | Estado, validación, consultas, carga y resultados incompletos. |
| [Gráfico](dollar-chart-explicacion.md) | `src/app/dollar-chart.tsx` | Dos curvas, ejes, leyenda, tooltip y limpieza de ECharts. |
| [Fechas](dates-explicacion.md) | `src/lib/dates.ts` | Hoy en Santiago y mes calendario anterior. |
| [Preparación de la comparación](dollar-comparison-explicacion.md) | `src/lib/dollar-comparison.ts` | Tipos, etiquetas y alineación por días calendario. |
| [Pruebas de cálculos](dollar-comparison-test-explicacion.md) | `tests/dollar-comparison.test.mjs` | Comprobación de fechas y puntos sin abrir un navegador. |
| [Pruebas del flujo completo](dollar-comparison-e2e-explicacion.md) | `e2e/dollar-comparison.spec.ts` | Interacciones, peticiones simuladas, gráfico y errores. |

## Cómo se conectan las piezas

```text
dates.ts → fechas iniciales del formulario
                    ↓
date-range.tsx → valida ambos períodos
                    ↓
dollar-client.ts → una petición GET /api/dollar por período
                    ↓
Promise.allSettled → espera ambas respuestas
                    ↓
date-range.tsx → publica resultados y avisos por período
                    ↓
dollar-comparison.ts → convierte fechas en días transcurridos
                    ↓
dollar-chart.tsx → dibuja curvas con valores reales en CLP/USD
```

La opción **Activar comparación** prepara los campos del segundo período con el mes anterior completo. **Comparar** inicia las solicitudes. Al desactivar la opción se valida y consulta el primer rango actual en modo individual.

El inicio de cada rango representa el día 0. Cada observación conserva su fecha real y su precio. Los días sin cotización mantienen su distancia temporal; no se agregan cotizaciones intermedias ni valores en cero para completar una curva.

## El plan y la evidencia

El [plan de la Historia 4](<../../plans/BACKLOG-HISTORIA-4/PLAN - Historia 4 - Comparar Dolar.md>) contiene la historia de usuario, los criterios de aceptación y las decisiones acordadas. Se actualizaron sus casillas de verificación y se añadió la ubicación de la implementación y su evidencia. Ese Markdown documenta el trabajo; no se ejecuta como parte de la aplicación.

En la verificación de la implementación pasaron 12 pruebas de integración y 32 E2E del proyecto completo, además de lint y TypeScript. De esas pruebas, los archivos nuevos aportan 4 pruebas de cálculos y 17 E2E. Los servicios se simulan para que las pruebas no dependan de las credenciales ni de la disponibilidad del Banco Central.

Para ejecutar las comprobaciones desde la raíz del proyecto en PowerShell:

```powershell
npm.cmd run test:integration
npm.cmd run test:e2e -- --workers=2
npm.cmd run lint
npm.cmd run typecheck
```

El endpoint existente conserva su contrato. Si necesitas estudiar el acceso al proveedor, consulta las explicaciones de [la ruta API](../Dashboard/route-explicacion.md) y [el servicio del dólar](../Dashboard/dollar-explicacion.md).
