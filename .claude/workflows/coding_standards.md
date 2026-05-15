---
description: Project Coding Standards and Patterns — front-bethergold
---

# Reglas de Sintaxis y Patrones del Proyecto Frontend

> **EN:** Mandatory rules when implementing new pages/components/services. Specialized guides live in `docs/standards/`.
> **IT:** Regole obbligatorie per implementare nuove pagine/componenti/servizi. Le guide dettagliate sono in `docs/standards/`.

## 📚 Guías Especializadas

1. [Estándares de Componentes](../../docs/standards/component_standards.md) — Standalone, smart vs dumb, inputs/outputs.
2. [Estándares de Servicios](../../docs/standards/service_standards.md) — HttpClient, Observables, multi-tenant.
3. [Manejo de Estado (Signals)](../../docs/standards/state_management_standards.md) — signal, computed, effect.
4. [Estándares de Rutas](../../docs/standards/routing_standards.md) — Lazy loading, guards, layout shells.

## 🚀 Checklist para Nueva Página (Feature)

1. [ ] **Component standalone** con `imports` explícitos.
2. [ ] **Servicio** en `shared/services/` con métodos CRUD tipados.
3. [ ] **Interface** del dominio en `shared/interfaces/`.
4. [ ] **Ruta lazy** con `loadComponent` y `canActivate: [authGuard]`.
5. [ ] **Estado** con Signals (`signal`, `computed`).
6. [ ] **Entrada en sidebar** si la página es navegable.
7. [ ] **Sin `any`** — todas las respuestas tipadas.
8. [ ] **Sin CSS custom** salvo casos justificados — usar Tailwind v4.

## Automatización / Automation / Automazione

- `docs/skills/create-page.md` — genera una página completa (component + service + ruta).
- `docs/skills/create-shared-component.md` — componente reutilizable.
- `docs/skills/add-service.md` — servicio API para un endpoint.
- `docs/skills/pattern-skill-creator.md` — meta-skill que detecta patrones repetidos.
- `.claude/skills/build-page-feature/SKILL.md` — receta detallada de feature multi-tenant.
