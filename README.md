# FrontMotos

Aplicación web del sistema de gestión de un concesionario de motos. Proyecto final de Bases de Datos 1, Ingeniería de Sistemas, Universidad El Bosque.

Consume la API de [BackMotos](https://github.com/mqteoh/BackMotos). En producción este build se empaqueta dentro del WAR del back.

## Qué ofrece

| Área | Ruta | Contenido |
|---|---|---|
| Vitrina pública | `/`, `/motos/:placa`, `/accesorios`, `/sedes` | Catálogo con filtros, ficha de cada moto, accesorios y sedes |
| Acceso | `/ingresar`, `/registro` | Inicio de sesión y creación de cuenta de cliente |
| Cliente | `/cliente` | Reservas, agendar reparaciones en tres pasos, compras y perfil |
| Vendedor | `/vendedor` | Reservas por vencer, clientes, venta de motos y de accesorios |
| Técnico | `/tecnico` | Agenda del taller, trabajos asignados, historial por placa y cierre de reparaciones |
| Dueño | `/admin`, `/reportes` | Las 14 tablas del negocio y los reportes de gestión con gráficos y CSV; también entra a ventas y taller |

## Tecnologías

- Angular 22 con componentes standalone, signals, `httpResource` y detección de cambios sin zone.js
- Vitest para pruebas, ESLint con angular-eslint y Prettier
- Barlow y Roboto Mono (@fontsource) e íconos de Phosphor
- axe-core como dependencia de desarrollo para auditar accesibilidad

## Requisitos

- Node.js compatible con Angular 22 (se desarrolló con Node 26) y npm
- El back corriendo en `http://localhost:8080` para desarrollo

## Desarrollo

```bash
npm ci
```

```bash
npx ng serve
```

La aplicación queda en `http://localhost:4200` y llama a la API en `http://localhost:8080` (`src/environments/environment.development.ts`). El back permite ese origen por defecto.

## Comandos

| Comando | Uso |
|---|---|
| `npx ng test --watch=false` | Pruebas unitarias |
| `npx ng lint` | Revisión de código |
| `npx prettier --check "src/**/*.{ts,html,css}"` | Revisión de formato |
| `npx ng build` | Build de producción en `dist/Front/browser` |

El build de producción usa rutas relativas para la API (`src/environments/environment.ts`), porque se sirve desde el mismo servidor que el back. Para empaquetarlo, ver el README de BackMotos.

## Estructura

```
src/app
├── core       API por rol, modelos, errores, interceptores, sesión, guards y layouts
├── shared     Componentes de interfaz (tabla, formulario, diálogo, gráfico, placa, estados) y formatos
├── features   Pantallas por área: publico, acceso, cliente, vendedor, tecnico y admin
└── testing    Ayudas para las pruebas
src/styles     Tokens de diseño y estilos por área
```

## Diseño y accesibilidad

- La dirección visual está en `design.md` de la documentación del proyecto: tema oscuro y claro, acento verde y la placa amarilla como motivo.
- Toda vista con datos tiene estado de carga, vacío y error.
- Se puede usar solo con teclado; el foco pasa al contenido al cambiar de página y los resultados de búsqueda se anuncian a los lectores de pantalla.
- Se revisó con axe-core en todas las pantallas y en ambos temas, y sin desbordes de 320 a 1440 px.

## Red

El back responde lento por la latencia de la base remota. Las peticiones esperan hasta 45 s, las lecturas se reintentan ante fallas de red y, si una carga pasa de 8 s, se muestra un aviso.

## Integrantes

- Mateo Robles Rodriguez
- Gabriel Reyes Ariza
- Samuel Romero
