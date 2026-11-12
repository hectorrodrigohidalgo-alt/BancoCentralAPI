# Stack del MVP

## Decisiones aprobadas

- TypeScript y Node.js: aprovechar la experiencia existente y compartir lenguaje entre interfaz y servidor.
- React y Next.js: construir dashboards y endpoints en un solo proyecto y despliegue. Requieren aprender React y las convenciones de Next.js.
- Apache ECharts: gráficos interactivos para evolución histórica y comparación entre períodos. Sustituye a Recharts por preferencia del usuario.
- IPC: selector entre índice, variación mensual y variación en 12 meses; cada opción tendrá su propia cobertura y unidad.
- Priorizar herramientas gratuitas y costo mínimo; explorar el histórico disponible en la API.
- Comenzar sin MySQL/Drizzle, consultando la API desde Next.js.
- Token administrado por el sitio, exclusivamente en el servidor; los visitantes no aportan credenciales.
- Alojamiento elegido para el MVP: Vercel Hobby, para un proyecto personal sin fines comerciales, con costo cero dentro de los recursos incluidos.
- Exportación futura a Excel: ExcelJS para generar XLSX en el navegador, incorporándolo al implementar la descarga. Trabajo adicional, alternativas, costos y límites: [USOS-DATOS.md](USOS-DATOS.md).

## Alternativas y límites

- Se eligió Next.js frente a React con una API Node.js separada para reducir aplicaciones y despliegues que mantener. Una API separada permitiría evolucionar sus consumidores de forma independiente, a costa de más operación.
- Integración propuesta de ECharts: componente de React en el navegador, con importaciones por módulos y gestión de creación, cambio de tamaño y liberación del gráfico.
- La facilidad para añadir indicadores depende de reutilizar la consulta y el dashboard, además de elegir las tecnologías.
- Prescindir de MySQL/Drizzle reduce operación y costo, pero depende de la disponibilidad del Banco Central y no conserva versiones históricas propias. El histórico accesible no garantiza su disponibilidad futura.
- Vercel Hobby tiene límites de consumo; al agotarlos puede suspender recursos hasta su renovación. Si cambia el uso a comercial o crece el consumo, habrá que reevaluar el alojamiento. No se ha desplegado el sitio.
- Añadir uno requerirá identificar la serie, verificar cobertura/unidad/frecuencia, registrarla en el catálogo del sitio y comprobar sus valores y comparación. Tratamientos especiales pueden requerir código adicional.

## Cobertura comprobada el 11-11-2026

Consultas puntuales de lectura; no se implementó la integración del sitio. GetSeries respondió con éxito al solicitar el histórico completo de estas series:

| Indicador | Serie | Primera observación válida | Última observación válida |
|---|---|---|---|
| Dólar diario | F073.TCO.PRE.Z.D | 09-08-1982 | 11-11-2026 |
| UF diaria | F073.UFF.PRE.Z.D | 01-08-1977 | 09-12-2026 |
| TPM diaria | F022.TPM.TIN.D001.NO.Z.D | 07-02-1997 | 11-11-2026 |
| Imacec mensual, índice empalmado original | F032.IMC.IND.Z.Z.EP18.Z.Z.0.M | 01-01-1996 | 01-09-2026 |
| IPC mensual, índice empalmado base 2023 | F074.IPC.IND.Z.EP23.C.M | 01-12-2009 | 01-10-2026 |

- Dólar y TPM contienen fechas sin valor válido; no deben interpretarse como cero. No se auditó la continuidad ni la exactitud de todos los valores históricos.
- El catálogo anuncia IPC histórico mensual (F074.IPC.VAR.Z.Z.C.M) desde marzo de 1928 y variación en 12 meses (F074.IPC.IND.Z.EP09.C.M) desde marzo de 1928, ambas hasta octubre de 2026. Sus observaciones aún no se descargaron; los códigos no bastan para identificar su significado.
- Las tres opciones del IPC no comparten necesariamente fecha inicial. La selección definitiva de series deberá respetar la mayor cobertura disponible y las definiciones oficiales.

## Alcance y verificaciones posteriores

- El entrenamiento de modelos y los pronósticos fueron descartados por el usuario. La implementación de los dashboards y de las descargas corresponde a historias posteriores.

## Base instalada el 11-11-2026

- Node.js 24, Next.js 16.4.6 con App Router, React 19.3.1, TypeScript 6.0.3 y Apache ECharts 6.1.0.
- TypeScript estricto, ESLint y comandos de desarrollo, comprobación de tipos y compilación. TypeScript se mantiene en la versión 6 por compatibilidad con el analizador de ESLint.
- Versiones exactas en `package.json` y dependencias resueltas en `package-lock.json`; reinstalación con `npm ci`.
- Credenciales locales excluidas del control de versiones; `.env.example` documenta la variable del servidor sin incluir su valor.
- Página inicial mínima; integración con la API, gráficos, exportación y despliegue pendientes. Instrucciones locales en [README.md](README.md).

## Referencias

- [API BDE](https://si3.bcentral.cl/estadisticas/Principal1/Web_Services/documentacion.html)
- [Next.js: backend para la interfaz](https://nextjs.org/docs/app/guides/backend-for-frontend)
- [ECharts: ciclo de vida y tamaño](https://echarts.apache.org/handbook/en/concepts/chart-size/)
- [Vercel Hobby](https://vercel.com/docs/plans/hobby)
