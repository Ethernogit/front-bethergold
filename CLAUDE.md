# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

Frontend web de **BetherGold**, sistema POS multi-tenant para joyerías. **Angular 20** (standalone components, sin NgModules) + **Tailwind CSS 4** sobre la plantilla TailAdmin. Es una **PWA** (service worker activo). Consume el backend `../back-bethergold`.

## Ecosistema de proyectos

| Proyecto | Ruta | Stack |
|----------|------|-------|
| Frontend (este) | `../front-bethergold` | Angular 20 · Tailwind 4 · PWA |
| Backend API | `../back-bethergold` | Node.js · Express · MongoDB |
| Desktop | `../desktop-bethergold` | JavaFX 22 · Java 21 |

Los tres son repos git separados en GitHub (`github.com/Ethernogit/*`).

## Comandos

```bash
npm start                              # ng serve (dev, http://localhost:4200)
npm run build                          # build de producción
npm run watch                          # build dev en watch
npm test                               # Karma + Jasmine (todos)
ng test --include='**/mi.spec.ts'      # un solo archivo de test
ng generate component pages/x          # scaffolding Angular CLI
```

## Configuración de entorno

`src/environments/environment.ts` (dev) y `environment.prod.ts` — la clave es `apiUrl`, la base del backend. Ajustar según la máquina/entorno.

## Arquitectura

Bootstrap sin módulos: `main.ts` → `app.config.ts` (`ApplicationConfig`) → `app.routes.ts`.

`app.config.ts` registra los providers globales: router, `provideHttpClient(withInterceptorsFromDi())`, el `AuthInterceptor` (HTTP_INTERCEPTORS multi), y el service worker (`provideServiceWorker`, activo solo fuera de dev).

### Estructura

```
src/app/
├── pages/       # componentes de página enrutados (una carpeta por dominio:
│                #   products, sales, clients, providers, inventory, reportes,
│                #   permissions, roles, users, sucursal, dashboard, auth-pages…)
├── shared/
│   ├── services/       # ← lógica de datos: un servicio por dominio (product,
│   │                   #   note, client, inventory, cash-cut, provider, sucursal,
│   │                   #   category, pricing-rule, reports…) + auth/ y rbca/
│   ├── components/      # componentes reutilizables (auth, tables, invoice, ui,
│   │                   #   toast, header, admin/permissions, admin/roles…)
│   ├── guards/         # auth.guard.ts, permission.guard.ts
│   ├── interceptors/   # auth.interceptor.ts
│   ├── layout/         # app-layout (shell con sidebar/header)
│   ├── interfaces/     # tipos/modelos TS
│   └── pipe/
└── services/    # support.service.ts (nivel app)
```

**La lógica de acceso a datos vive en `shared/services/`**, no en `app/services/`. Cada dominio del backend tiene su servicio espejo aquí (p. ej. `product.service.ts` ↔ endpoints `/products`).

### Auth y sesión

- `shared/interceptors/auth.interceptor.ts`: inyecta `Authorization: Bearer <token>` en cada request. Ante un **401** hace **refresh de token automático** (con `BehaviorSubject` para colar requests concurrentes durante el refresh) salvo en `/auth/login` y `/auth/logout`. El token lo administra `shared/services/auth/login.service.ts`.
- `shared/guards/auth.guard.ts`: protege rutas autenticadas.
- `shared/guards/permission.guard.ts`: RBAC por permiso; refleja el RBAC del backend.
- Selector de organización/sucursal en `shared/components/auth/organization-selector` (multi-tenant: el usuario elige contexto tras login).

### Routing

Definido en `app.routes.ts`. Rutas públicas bajo `auth/` (sign-in, sign-up) y landing; el resto cuelga del `AppLayoutComponent` protegido por guards. Cada ruta define `title`.

## UI y librerías clave

- **Tailwind 4** (`@tailwindcss/postcss`) — sin config JS clásica, vía PostCSS.
- Gráficas: **ApexCharts** (`ng-apexcharts`) y **amCharts 5** (incluye geodata para mapas).
- Calendario: **FullCalendar**. Drag & drop: `ngx-drag-drop`. Fechas: `flatpickr`. Carruseles: `swiper`. OTP: `ng-otp-input`. Tour guiado: `driver.js` (ver `tour.service.ts`).
- **PDF**: `pdfmake` + `html2pdf.js` (impresión de notas/etiquetas — ver `label-printing.service.ts`).
- Tema claro/oscuro vía `theme.service.ts`; toasts con `toast.service.ts`.

## Branding

| Token | Valor | Uso |
|-------|-------|-----|
| Gold primary | `#C69214` | Acento, botones |
| Gold bright | `#FAC600` | Highlights |
| Gold deep | `#9A6F0A` | Hover |
| Gold pale | `#FBF0C9` | Fondos suaves |
| Brand black | `#191817` | Texto |
| Fuentes | Outfit (títulos) · Inter (cuerpo) | |

## Contexto de negocio no obvio

- **Notas legacy "Mory"**: hay notas migradas del sistema anterior con un pendiente de pago falso; el módulo de notas es **solo consulta** y la resolución la hace el empleado manualmente. No automatizar "arreglos".
- **Inventario**: el conteo es durable en el backend (`InventoryCount`) con versionado de exportaciones PDF/XLSX por categoría; el front consume esos flujos vía `inventory.service.ts` y `reports.service.ts`.

## Origen de la plantilla

Basado en TailAdmin (`name: "ng-tailadmin"` en `package.json`); las carpetas `pages/ui-elements`, `charts`, `tables`, `forms`, `blank` son demos de la plantilla, no funcionalidad de negocio.
