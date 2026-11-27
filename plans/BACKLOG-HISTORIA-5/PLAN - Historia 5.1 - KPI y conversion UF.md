# Historia 5.1 — KPI y conversión UF

## Story

Como visitante, quiero ver al iniciar el valor vigente de la UF con su fecha y, en un apartado secundario, consultar otra fecha y convertir montos de UF a pesos, para conocer su equivalencia.

## Acceptance criteria

- [x] Dado que ingreso al sitio, cuando se consulta la UF de hoy en Santiago, entonces veo una tarjeta KPI con su fecha encima del valor en pesos; mientras carga veo ese estado y, si falta el dato o falla la consulta, veo el aviso correspondiente sin sustituirlo por un valor anterior.
- [x] Dado el formulario secundario, inicialmente con hoy en Santiago, monto vacío y ambos botones deshabilitados, cuando ingreso un monto y salgo del campo, entonces se habilita únicamente «Consultar UF» para enteros positivos o «Convertir» para montos positivos con parte fraccionaria distinta de cero. Un monto como 2,0 se considera entero. Cero, negativos, vacíos y valores no finitos mantienen ambos botones deshabilitados; mientras edito el monto, ambos permanecen deshabilitados.
- [x] Dado un monto entero válido, cuando pulso «Consultar UF» para una fecha válida hasta hoy, entonces veo como resultado principal la equivalencia en pesos del monto ingresado, redondeada al peso más cercano, junto con el monto, la fecha y el valor de 1 UF utilizado, sin modificar el KPI. Se admiten enteros con ceros a la derecha: con una UF de $40.000,25, 100 UF equivalen a $4.000.025; 1000 UF a $40.000.250 y 10000 UF a $400.002.500.
- [x] Dado un monto fraccionario válido, cuando pulso «Convertir», entonces se obtiene la UF de la fecha seleccionada si hace falta o se reutiliza el valor ya consultado para esa misma fecha, sin otra petición. Veo la equivalencia en pesos redondeada al peso más cercano, junto con la fecha y el valor UF utilizados, con formato chileno. La conversión reemplaza el resultado de consulta.
- [x] Dada cualquiera de las dos acciones, si la fecha es inválida o futura, entonces veo un aviso sin realizar la petición. Durante una petición veo «Cargando…» y ambos botones deshabilitados; si no hay datos o falla la consulta, veo el aviso correspondiente y puedo reintentar.
- [x] Dado un resultado disponible, cuando cambio el monto, entonces se retira la conversión y se conserva el valor UF consultado; cuando cambio la fecha, se retiran ambos resultados. Las respuestas y errores de peticiones anteriores se ignoran si edité la fecha o el monto durante la espera.

## Plan

- Reutilizar la consulta de UF existente, manteniendo las credenciales en el servidor.
- Incorporar la tarjeta inicial con valor, fecha y estados de consulta.
- Añadir debajo un formulario común de fecha y monto vacío, con resultados independientes del KPI y activación exclusiva de acciones al salir del campo de monto.
- Obtener la UF al consultar o convertir y reutilizar el valor del formulario solo para la misma fecha; mantener independiente la consulta inicial del KPI.
- Calcular la equivalencia del monto completo tanto al consultar enteros como al convertir fraccionarios y presentar pesos con formato chileno, conservando los decimales del valor de 1 UF y mostrando únicamente el resultado de consulta o conversión correspondiente.
- Invalidar resultados al editar e ignorar respuestas y errores anteriores a una edición del formulario.
- Mantener las pruebas UF en `e2e/uf/` y adaptar las pruebas del dólar para distinguir ambos formularios y sus avisos.

## Verificación

- [x] Última suite E2E completa, anterior al ajuste de equivalencias de montos enteros: 62 pruebas aprobadas, incluidas 22 de UF y la regresión del dashboard del dólar.
- [x] Tras el ajuste de equivalencias de montos enteros: 23 pruebas UF aprobadas, incluidos 100, 1000 y 10000 UF.
- [x] Integración: 19 pruebas aprobadas.
- [x] Lint completo y comprobación de tipos aprobados.
- [ ] Revisión visual conjunta en escritorio y móvil: jerarquía del KPI, fecha encima del valor, formulario secundario y presentación de los resultados.
- [ ] Revisión desde un contexto nuevo antes de cerrar la historia.

## Out of scope

- Gráficos y comparación de períodos de UF.
- Fechas futuras, siguiendo la restricción actual de consulta.
- Conversión de pesos a UF.
- Exportación e incorporación de otros indicadores.
