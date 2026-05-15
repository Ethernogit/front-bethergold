---
description: Project Coding Standards (agent mirror) — front-bethergold
---

# Coding Standards (mirror para otros agentes)

Espejo de `.claude/workflows/coding_standards.md`. Manuales detallados en `docs/standards/`:

1. [`component_standards.md`](../../docs/standards/component_standards.md)
2. [`service_standards.md`](../../docs/standards/service_standards.md)
3. [`state_management_standards.md`](../../docs/standards/state_management_standards.md)
4. [`routing_standards.md`](../../docs/standards/routing_standards.md)

Resumen de reglas no-negociables:
- Componentes standalone, `inject()`, Signals.
- Lazy loading con `loadComponent` siempre. Ninguna ruta con `component:` directo.
- `authGuard` en toda ruta privada.
- Servicios `providedIn: 'root'` que devuelven `Observable<ApiResponse<T>>` sin `.subscribe()` interno.
- Tipado fuerte: `any` prohibido.
- Tailwind v4: evitar CSS custom.
- Multi-tenant: `orgId` desde `AuthService`, nunca hardcoded.
- No credenciales hardcoded (`rules/no-credentials-hardcode.md`).
