# Indicadores del Banco Central de Chile

Base del MVP definido en [STACK.md](STACK.md): Node.js 24, TypeScript, Next.js con App Router, React y Apache ECharts.

## Desarrollo local

1. Usar Node.js 24 (ver `.nvmrc`).
2. Instalar las dependencias con `npm ci`.
3. Copiar `.env.example` a `.env.local` si no existe y completar `BCCH_API_TOKEN`.
4. Ejecutar `npm run dev` y abrir <http://localhost:3000>.

En PowerShell, si la política de scripts bloquea `npm`, usar `npm.cmd` (por ejemplo, `npm.cmd run dev`).

## Comprobaciones

- `npm run lint`: revisar el código con ESLint.
- `npm run typecheck`: generar los tipos de rutas y comprobar TypeScript.
- `npm run build`: compilar para producción.
- `npm start`: servir la compilación de producción.

Las versiones exactas están en `package.json` y el árbol de dependencias en `package-lock.json`.

Se usa TypeScript 6 por compatibilidad con el analizador de ESLint. La auditoría del 11-11-2026 detectó siete avisos moderados relacionados con una dependencia transitiva de desarrollo (`minimatch`, a través de `typescript-eslint`). `npm audit fix` no los resolvió y la última versión estable del analizador seguía afectada. Reevaluar cuando se publique una corrección compatible.

## Estructura y alcance

- `src/app/`: página inicial, layout y estilos globales.
- Alias `@/*`: apunta a `src/*`.
- ECharts está instalado para los futuros gráficos con importaciones por módulos y componentes de cliente. Su inicialización, ajuste de tamaño y liberación se implementarán con el dashboard.
- `server-only` está disponible para proteger los futuros módulos de acceso a la API: importar `"server-only"` al inicio de esos módulos.

Las credenciales se mantienen en `.env.local`, excluido del control de versiones. No usar el prefijo `NEXT_PUBLIC_` ni enviar el token al navegador. La integración con el Banco Central, los dashboards y la exportación a Excel corresponden a historias posteriores. ExcelJS se incorporará al implementar la descarga, según `STACK.md`.

## Alojamiento previsto

El proyecto está preparado para el despliegue estándar de Next.js en Vercel, usando Node.js 24 y configurando `BCCH_API_TOKEN` como variable de entorno del servidor. El alojamiento elegido es Vercel Hobby; todavía no se ha desplegado.
