## Contexto

Sitio web para el público general que consulta y muestra datos de la API del Banco Central de Chile en dashboards interactivos. El MVP permite explorar dólar, UF, IPC, TPM e Imacec y comparar un mismo indicador entre períodos históricos.

El crecimiento previsto contempla incorporar más indicadores y descargar los datos en Excel. El entrenamiento de modelos y los pronósticos quedan descartados por decisión del usuario.

Decisión inicial: consultar la API sin MySQL/Drizzle, dependiendo de su disponibilidad y sin conservar versiones históricas propias. Se comprobó la descarga histórica de cinco series; las variantes de IPC tienen verificaciones pendientes. Cobertura, stack elegido, motivos y limitaciones: [STACK.md](STACK.md).

Decisión aprobada: usar credenciales administradas por el sitio y mantenidas privadas en el servidor, sin exigir credenciales del Banco Central a los visitantes. El MVP es personal y sin fines comerciales; el alojamiento elegido es Vercel Hobby.

## Backlog

1. Como responsable del producto, quiero definir el stack del MVP para permitir incorporar más indicadores.
2. Como responsable del producto, quiero evaluar si el stack del MVP permite exportar datos a Excel, para conocer sus limitaciones y los cambios que requeriría.
3. Como visitante, quiero consultar la evolución histórica del dólar en un dashboard interactivo para explorar sus valores durante un período. Requiere: #1 y #2.
4. Como visitante, quiero comparar el dólar entre dos períodos históricos para entender cómo cambió su comportamiento. Requiere: #3.
5. Como visitante, quiero explorar y comparar entre períodos la UF, el IPC, la TPM y el Imacec para analizar el comportamiento histórico de cada indicador. Requiere: #4.
