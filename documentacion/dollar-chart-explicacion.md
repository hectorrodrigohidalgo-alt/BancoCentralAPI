# Explicación de `dollar-chart.tsx` para un desarrollador junior

Archivo explicado: [`src/app/dollar-chart.tsx`](../src/app/dollar-chart.tsx).

Este componente recibe observaciones del dólar y las representa mediante un gráfico de líneas con ECharts. Configura los ejes, el tooltip, la accesibilidad y la adaptación al tamaño disponible.

No consulta la API ni decide qué fechas pedir: recibe los datos desde `DateRange`.

La explicación sigue la versión actual. Las líneas vacías separan bloques y los números pueden cambiar si se modifica el archivo.

## Líneas 1 a 6: importar las herramientas

```tsx
import { useEffect, useRef } from "react";
import { LineChart } from "echarts/charts";
import { AriaComponent, GridComponent, TooltipComponent } from "echarts/components";
import { init, use as registerCharts } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import type { DollarObservation } from "../lib/dollar";
```

- **Línea 1:** importa `useEffect`, que sincroniza el componente con ECharts, y `useRef`, que guarda una referencia al elemento HTML donde se dibujará.
- **Línea 2:** importa el módulo para gráficos de líneas.
- **Línea 3:** importa los módulos de descripción accesible (`AriaComponent`), área de ejes cartesianos (`GridComponent`) y cuadro emergente al señalar datos (`TooltipComponent`).
- **Línea 4:** importa `init`, que crea una instancia de ECharts, y renombra `use` como `registerCharts`. Es una función de ECharts para registrar módulos, no un hook de React.
- **Línea 5:** importa el dibujado mediante SVG, una representación vectorial que el navegador puede mostrar.
- **Línea 6:** importa únicamente el tipo de las observaciones. No incorpora la función de consulta ni el token del servidor.

El componente pertenece al árbol cliente iniciado por `DateRange`, por lo que no necesita repetir `"use client"` en este archivo para este uso.

## Líneas 8 y 9: registrar los módulos

```tsx
// Registramos los módulos necesarios para la línea, los ejes, la accesibilidad, el tooltip y SVG.
registerCharts([LineChart, AriaComponent, GridComponent, TooltipComponent, SVGRenderer]);
```

- **Línea 8:** comenta el registro.
- **Línea 9:** habilita los módulos que usará el gráfico. Importar un módulo lo hace disponible para este archivo; registrarlo permite que el núcleo de ECharts lo utilice. Esta forma de importación permite incluir los módulos necesarios en lugar de cargar toda la biblioteca.

Este registro está fuera de la función del componente, de modo que no forma parte de cada renderizado de React.

## Línea 11: recibir los datos como prop

```tsx
export default function DollarChart({ observations }: { observations: DollarObservation[] }) {
```

- **Línea 11:** declara y exporta el componente. Recibe un objeto de props y extrae `observations` mediante desestructuración. La parte `: { observations: DollarObservation[] }` exige que esa prop sea un arreglo de observaciones.

El padre lo utiliza así:

```tsx
<DollarChart observations={observations} />
```

Una **prop** es una entrada que un componente recibe de otro. Aquí el gráfico lee los datos recibidos; no utiliza `setObservations` ni modifica el estado del padre.

## Líneas 12 y 13: guardar el contenedor HTML

```tsx
// ECharts necesita el elemento HTML donde dibujará el gráfico.
const container = useRef<HTMLDivElement>(null);
```

- **Línea 12:** explica por qué necesitamos una referencia al HTML.
- **Línea 13:** crea la referencia `container`. `HTMLDivElement` indica que apuntará a un `<div>` y `null` es el valor inicial, porque el elemento todavía no fue asociado a la referencia. Cuando React crea el elemento, lo guarda en `container.current`.

A diferencia de un estado creado con `useState`, cambiar `ref.current` no provoca por sí mismo un renderizado. La referencia se utiliza para acceder al elemento real del navegador, conocido como nodo del DOM.

## Líneas 14 a 17: crear la instancia del gráfico

```tsx
useEffect(() => {
  // El efecto crea una instancia al montar el componente y cada vez que cambian los datos.
  const chart = init(container.current!, undefined, { renderer: "svg" });
  chart.setOption({
```

- **Línea 14:** abre el efecto. Es el lugar donde conectamos React con ECharts, que administra su propio dibujado.
- **Línea 15:** comenta cuándo se crea la instancia.
- **Línea 16:** crea el gráfico dentro de `container.current`. El `!` indica a TypeScript que asumimos que la referencia ya existe; no comprueba su valor durante la ejecución. `undefined` deja el argumento del tema sin especificar y `{ renderer: "svg" }` elige SVG. La variable `chart` guarda la instancia con la que podremos configurar, redimensionar y liberar el gráfico.
- **Línea 17:** comienza `setOption`, el método que recibe la configuración del gráfico.

El efecto se ejecuta después de que React haya conectado la referencia al elemento del contenedor.

## Líneas 18 y 19: descripción accesible

```tsx
// ECharts genera una descripción de las observaciones para lectores de pantalla.
aria: { enabled: true },
```

- **Línea 18:** comenta el propósito de accesibilidad.
- **Línea 19:** habilita la generación de una descripción accesible del gráfico mediante el módulo ARIA registrado anteriormente. Ayuda a que lectores de pantalla comuniquen información del gráfico.

## Líneas 20 y 21: la nube o tooltip

```tsx
// En la plantilla, {b} es la fecha del eje X y {c} es el valor de la observación.
tooltip: { trigger: "axis", formatter: '<span role="tooltip">{b}: {c} CLP/USD</span>' },
```

- **Línea 20:** explica los marcadores de la plantilla.
- **Línea 21:** configura el cuadro que aparece al señalar una posición del gráfico. `trigger: "axis"` activa el tooltip según la posición sobre los ejes. `formatter` define el contenido: `{b}` representa la categoría, que aquí es la fecha, y `{c}` representa el valor. `CLP/USD` indica pesos chilenos por dólar. El `span` tiene `role="tooltip"` para identificar el cuadro emergente.

Un ejemplo del contenido mostrado es:

```text
02-11-2026: 992.66 CLP/USD
```

Los marcadores `{b}` y `{c}` pertenecen a ECharts. No son variables de React ni interpolaciones `${...}` de JavaScript.

## Líneas 22 a 26: ejes y datos de la línea

```tsx
// Las fechas forman las categorías; los valores se convierten de texto a número.
xAxis: { type: "category", data: observations.map((item) => item.indexDateString) },
yAxis: { type: "value", name: "CLP/USD" },
series: [{ name: "Dólar observado (CLP/USD)", type: "line", data: observations.map((item) => Number(item.value)) }],
});
```

- **Línea 22:** comenta la transformación de datos.
- **Línea 23:** configura el eje horizontal. `type: "category"` trata cada fecha como una categoría. `map` recorre las observaciones y crea un arreglo nuevo con sus fechas, conservando el orden.
- **Línea 24:** configura el eje vertical como numérico y muestra el nombre de la unidad `CLP/USD`.
- **Línea 25:** define una serie de datos. Una serie es el conjunto de valores que se dibujará: tiene un nombre, utiliza el tipo `"line"` y contiene los valores convertidos a número mediante `Number(item.value)`.
- **Línea 26:** cierra la configuración y la llamada a `setOption`.

Por ejemplo, dos observaciones producen estos arreglos:

```text
Fechas:  ["02-11-2026", "03-11-2026"]
Valores: [992.66, 990.25]
```

ECharts empareja los elementos por posición: la primera fecha corresponde al primer valor. Como el eje es de categorías, las fechas se muestran como etiquetas; este componente no calcula distancias de tiempo entre ellas ni agrega días sin datos.

Los valores inválidos ya fueron filtrados en `dollar.ts`. Este componente los transforma para el gráfico, pero no repite ese filtro.

## Líneas 27 a 29: adaptarse al tamaño disponible

```tsx
// Ajustamos el gráfico cuando cambia el tamaño de su contenedor.
const observer = new ResizeObserver(() => chart.resize());
observer.observe(container.current!);
```

- **Línea 27:** explica el ajuste de tamaño.
- **Línea 28:** crea un `ResizeObserver`, una herramienta del navegador que avisa cuando cambia el tamaño de un elemento. Al recibir el aviso, llama a `chart.resize()` para ajustar el gráfico.
- **Línea 29:** inicia la observación del contenedor. El `!` vuelve a expresar que asumimos que el elemento existe.

Se observa el contenedor, por lo que el gráfico puede adaptarse a cambios de espacio aunque no provengan directamente de redimensionar la ventana.

## Líneas 30 a 35: limpiar al actualizar o desmontar

```tsx
return () => {
  // Antes de recrearlo o desmontarlo, liberamos el observador y la instancia anterior.
  observer.disconnect();
  chart.dispose();
};
}, [observations]);
```

- **Línea 30:** devuelve una función de limpieza desde el efecto. No es el JSX del componente: React guarda esta función para ejecutarla cuando corresponda.
- **Línea 31:** comenta qué recursos se liberarán.
- **Línea 32:** deja de observar cambios de tamaño.
- **Línea 33:** destruye la instancia anterior de ECharts y libera sus recursos. Evita mantener instancias sobre un contenedor que se reutiliza o desaparece.
- **Línea 34:** cierra la función de limpieza.
- **Línea 35:** cierra el efecto y declara `observations` como dependencia. Cuando recibe un arreglo diferente, React limpia el efecto anterior y ejecuta uno nuevo con esos datos. También limpia al desmontar el componente.

Esta versión recrea el gráfico cuando cambia la referencia del arreglo; no actualiza una instancia permanente. React compara la dependencia por su identidad, no elemento por elemento. En desarrollo con Strict Mode puede ocurrir un ciclo adicional de creación y limpieza.

## Líneas 36 y 37: devolver el elemento visible

```tsx
return <div ref={container} style={{ height: 360 }} />;
}
```

- **Línea 36:** devuelve el `<div>` donde dibujará ECharts. `ref={container}` conecta ese elemento con la referencia. `style={{ height: 360 }}` asigna una altura de 360 píxeles; las primeras llaves abren una expresión JSX y las segundas crean el objeto de estilos. El ancho depende del espacio disponible en la página.
- **Línea 37:** cierra el componente.

React crea el contenedor y ECharts dibuja el gráfico dentro de él. La altura explícita permite que ECharts disponga de espacio para dibujar.

## Recorrido y lecturas relacionadas

```text
DateRange actualiza observations
              ↓
DollarChart recibe la prop
              ↓
El efecto crea y configura ECharts
              ↓
Se dibujan fechas y valores
              ↓
El tooltip muestra el punto señalado

Si cambian los datos o se desmonta el componente:
se desconecta el observador y se destruye la instancia anterior
```

- [Explicación de DateRange](date-range-explicacion.md).
- [Explicación del origen y filtrado de las observaciones](dollar-explicacion.md).
- [useRef de React](https://react.dev/reference/react/useRef).
- [useEffect y limpieza de efectos](https://react.dev/reference/react/useEffect).
- [Inicialización y métodos de ECharts](https://echarts.apache.org/en/api.html#echarts.init).
- [Plantillas del tooltip de ECharts](https://echarts.apache.org/en/option.html#tooltip.formatter).
