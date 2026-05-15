# Skills — front-bethergold

> **EN:** Executable standards for Angular development in this project. Each skill describes **what to create, where, and how**, with ready-to-use templates.
> **IT:** Standard eseguibili per lo sviluppo Angular. Ogni skill descrive **cosa creare, dove e come**, con template pronti all'uso.

Estándares ejecutables para desarrollo en este proyecto Angular. Cada skill describe **qué crear, dónde y cómo**, con plantillas listas para usar.

## Índice

| Skill | Descripción |
|---|---|
| [create-skill](./create-skill.md) | Crea un nuevo skill en esta carpeta |
| [create-page](./create-page.md) | Nueva página/feature en `src/app/pages/` con ruta y servicio |
| [create-shared-component](./create-shared-component.md) | Componente reutilizable en `src/app/shared/components/` |
| [add-service](./add-service.md) | Servicio para consumir un endpoint de la API |
| [pattern-skill-creator](./pattern-skill-creator.md) | **Meta-skill** que detecta patrones repetidos y crea nuevos skills automáticamente |

## Skills locales del proyecto (`.claude/skills/`)

| Skill | Descripción |
|---|---|
| [build-page-feature](../../.claude/skills/build-page-feature/SKILL.md) | Receta completa para feature multi-tenant (interface + service + smart + dumb + ruta + sidebar) |

## Standards de arquitectura

Las skills se apoyan en los estándares en [`docs/standards/`](../standards/):

| Standard | Relevante para |
|---|---|
| [component_standards.md](../standards/component_standards.md) | Standalone, smart vs dumb, `input()/output()` |
| [service_standards.md](../standards/service_standards.md) | HttpClient, Observables, multi-tenant |
| [state_management_standards.md](../standards/state_management_standards.md) | Signals (signal, computed, effect) |
| [routing_standards.md](../standards/routing_standards.md) | Lazy loading, guards, layout shells |

## Reglas y workflow

- [`.claude/rules/workflow.md`](../../.claude/rules/workflow.md) — flujo SDD (Spec-Driven Design)
- [`.claude/rules/architecture.md`](../../.claude/rules/architecture.md) — arquitectura del proyecto
- [`.claude/rules/no-credentials-hardcode.md`](../../.claude/rules/no-credentials-hardcode.md) — regla siempre activa

## Convenciones globales del proyecto

- **Framework:** Angular 20, componentes standalone (sin NgModules)
- **Estilos:** Tailwind CSS v4 — no escribir CSS custom salvo casos excepcionales
- **Estado:** Signals (`signal`, `computed`); evitar `BehaviorSubject` para nuevo estado
- **DI:** `inject()` sobre constructor injection
- **Lazy loading:** todas las rutas usan `loadComponent`
- **Guard:** todas las rutas privadas llevan `canActivate: [authGuard]`
- **Multi-tenant:** `orgId` desde `AuthService` (signal); nunca hardcoded
- **Naming:** carpetas/archivos en `kebab-case`, clases en `PascalCase`
- **Servicios:** `providedIn: 'root'`, retornan `Observable<ApiResponse<T>>`, sin `.subscribe()` interno
- **Tipado:** estricto — `any` prohibido
- **Idiomas en respuestas del agente:** ES → EN → IT

## Skills sugeridos (a generar con pattern-skill-creator)

- **`service-crud-generator`** — service CRUD tipado.
- **`page-with-list-pattern`** — smart component con búsqueda + paginación + signals.
- **`signal-page-state`** — boilerplate de signals + computed + load.
- **`dumb-card-generator`** — componente dumb con `input.required()` + `output()`.
- **`add-route-feature`** — registra lazy route + guard.

Para crearlos: pídele a Claude *"detecta patrones en este proyecto y crea skills para automatizarlos"*.

## Cómo crear un skill nuevo

Usa [`create-skill`](./create-skill.md) o el meta-skill [`pattern-skill-creator`](./pattern-skill-creator.md).
