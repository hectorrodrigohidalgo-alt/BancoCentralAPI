# Evaluación de nuevos usos de los datos

Alcance vigente: exportación a Excel. El usuario descartó el entrenamiento de modelos y los pronósticos; la evaluación de ese uso se conserva debajo como antecedente descartado, sin decisiones pendientes.

## 1. Descargas en Excel

Estado: evaluación documental aprobada por el usuario. No se implementó ni se probó una descarga.

### Viabilidad y trabajo adicional

El stack aprobado permite exportar archivos Excel (.xlsx) sin cambiar React/Next.js ni añadir MySQL, Drizzle o almacenamiento de archivos.

El trabajo de una historia posterior sería:

1. Definir qué indicador, variante y período se descargan, y obtener las observaciones de ese rango mediante el servidor, manteniendo privado el token.
2. Preparar datos tabulares a partir de las observaciones, sin depender de imágenes ni de la reducción de puntos que pueda usar el gráfico.
3. Incorporar una biblioteca XLSX y una acción de descarga, con estados de preparación y error.
4. Comprobar que el archivo abre en Excel, conserva fechas y números y representa correctamente los datos faltantes. Medir tamaño, tiempo y memoria con los rangos previstos.

Como contenido propuesto, incluir fecha, valor, estado de la observación y metadatos de serie, unidad, frecuencia, variante, fuente y fecha de consulta. Un dato faltante no debe convertirse en cero. El contenido definitivo se acordará al refinar la historia de descarga.

### Opciones evaluadas

| Opción | Ventaja | Limitación |
|---|---|---|
| XLSX en el navegador con ExcelJS | Reutiliza TypeScript y datos recibidos; no necesita almacenar el archivo ni generarlo en el servidor. | Añade una dependencia al cliente y consume memoria del dispositivo; el escritor por streaming no está disponible en el navegador. |
| XLSX en el servidor con ExcelJS | Centraliza la generación y dispone de escritor por streaming en Node.js. | Consume recursos del servidor y exige revisar duración, memoria y tamaño de respuesta del alojamiento. |
| CSV | Generación sencilla y Excel puede importarlo. | No es un libro XLSX; depende de opciones de importación para separadores, fechas y decimales y no ofrece varias hojas o formatos de celda. |

Recomendación aprobada: generar XLSX en el navegador con ExcelJS, cargándolo cuando se solicite exportar. Las consultas al Banco Central seguirían pasando por Next.js. Para exportaciones que excedan la capacidad medida del navegador, habría que reevaluar la generación en servidor o dividir la descarga.

### Costos y límites

ExcelJS tiene licencia MIT, sin pago de licencia por usar la biblioteca. No requiere contratar un servicio adicional para esta opción; se mantienen los consumos de consultas y transferencia del alojamiento. No se midieron todavía el peso de la dependencia, el archivo final ni el rendimiento con el histórico completo.

Vercel documenta un límite de 4,5 MB para el cuerpo de solicitud o respuesta de una función. Generar el XLSX en el navegador evita enviar ese archivo desde una función, pero no elimina los límites de las respuestas que transportan los datos. La estrategia para grandes volúmenes deberá verificarse en su historia de implementación.

Fuentes consultadas el 11-11-2026: [ExcelJS: licencia, XLSX, TypeScript y soporte de navegador](https://github.com/exceljs/exceljs#readme), [límites de Vercel Functions](https://vercel.com/docs/functions/limitations).

## Antecedente descartado: datos para entrenamientos

Estado: evaluación descartada por decisión del usuario; no requiere aprobación ni implementación.

### Disponibilidad y preparación

- La descarga histórica de cinco series ya fue comprobada; sus códigos y coberturas están en [STACK.md](STACK.md). Dólar, UF y TPM tienen frecuencia diaria; las series seleccionadas de IPC e Imacec son mensuales. Las dos variantes de variación del IPC siguen pendientes de descargar y verificar.
- GetSeries entrega fechas, valores y estados de observación; SearchSeries permite consultar metadatos, frecuencia y extremos de cobertura. Esa información permite preparar conjuntos de datos, pero no demuestra que sean suficientes para obtener pronósticos útiles.
- Hay fechas sin valor válido en dólar y TPM: deben distinguirse de cero. Elegir cómo tratarlas y cómo combinar frecuencias corresponde a la historia de entrenamiento; no se deben rellenar automáticamente sin una regla explícita.
- Antes de entrenar habrá que definir qué significa variación y su horizonte: diferencia absoluta, porcentaje o, por ejemplo para TPM, puntos porcentuales. También habrá que respetar unidades, cambios de base y variantes originales o desestacionalizadas. Esta evaluación no elige una variable objetivo ni un algoritmo.

### Revisiones y disponibilidad en el tiempo

El Banco Central confirma que el Imacec se publica con rezago y se revisa con las cuentas nacionales trimestrales y anuales. Por eso, el mes al que corresponde un valor no equivale a la fecha en que pudo conocerse.

La documentación REST consultada ofrece GetSeries por serie y rango, pero no documenta un parámetro para recuperar la versión conocida en una fecha pasada. updatedAt es un metadato de actualización de serie, no un historial de publicación y revisión de cada observación. No se verificó si otros archivos oficiales permiten reconstruir versiones antiguas.

Consecuencia: volver a consultar el mismo rango puede cambiar los datos de un entrenamiento. Evaluar pronósticos históricos con cifras revisadas o publicadas después de la fecha simulada puede introducir información que entonces no estaba disponible. La separación entre entrenamiento y evaluación deberá respetar el tiempo y la disponibilidad efectiva de los datos.

### Repetir un experimento y simular el pasado

| Necesidad | Qué habría que conservar | Límite |
|---|---|---|
| Repetir un entrenamiento con los mismos datos | Una copia sin sobrescritura de los datos originales y preparados, códigos y metadatos de series, fecha de extracción, transformaciones y división temporal; además, código, entorno, parámetros y semillas cuando corresponda. | Consultar nuevamente la API no sustituye esa copia; conservar datos no garantiza por sí solo una ejecución idéntica. |
| Simular qué se habría podido pronosticar en una fecha pasada | Valores y fechas de disponibilidad de las versiones conocidas entonces. | Una copia tomada hoy no reconstruye automáticamente lo conocido años atrás; faltaría verificar archivos oficiales o recopilar versiones desde que se empiece a conservarlas. |

Conclusión de la evaluación descartada: repetir experimentos habría requerido conservar sus conjuntos de datos, y simular pronósticos pasados habría requerido conocer la información disponible en cada fecha. Estas necesidades ya no forman parte de la propuesta vigente.

Fuentes consultadas el 11-11-2026: [API BDE: consultas y metadatos](https://si3.bcentral.cl/estadisticas/Principal1/Web_Services/documentacion.html), [Banco Central: publicación y revisión del Imacec](https://www.bcentral.cl/es/web/banco-central/areas/estadisticas/imacec). Las consecuencias para preparación y repetición de experimentos son inferencias de esta evaluación a partir de esas características.

## Recomendación final para exportar a Excel

- Mantener ahora TypeScript, Node.js, React, Next.js, Apache ECharts y Vercel Hobby, con el token privado en el servidor y sin MySQL/Drizzle. La exportación no exige cambiar estas decisiones.
- Incorporar ExcelJS y la descarga XLSX en una historia de implementación posterior; generar el archivo en el navegador con los datos del indicador, variante y período elegidos. La biblioteca se cargaría al solicitar la exportación.
- No añadir almacenamiento de archivos, otro backend ni infraestructura para modelos. La descarga se generaría bajo demanda, sin conservar copias en el sitio.
- Costo adicional de licencia de ExcelJS: cero. No se propone contratar servicios adicionales; siguen aplicando los consumos y límites del alojamiento y la disponibilidad de la API.
- Antes de publicar la descarga, comprobar apertura en Excel, fechas, números, datos faltantes y correspondencia con el rango solicitado, y medir peso, tiempo y memoria con rangos históricos representativos. El volumen admitido se fijará con esas mediciones.

Esta recomendación consolida la evaluación de Excel aprobada y el descarte de los modelos. La historia de evaluación queda documentada; la implementación de la descarga continúa fuera de su alcance.
