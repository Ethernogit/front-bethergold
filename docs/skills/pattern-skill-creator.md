---
name: pattern-skill-creator
description: Meta-skill que escanea el código Angular buscando patrones repetidos y crea nuevos skills automáticamente para estandarizarlos. ES/EN/IT.
---

# Skill: pattern-skill-creator

> **EN:** Meta-skill that scans the Angular codebase for repetitive implementation patterns and generates new skills to standardize them.
> **IT:** Meta-skill che analizza il codice Angular cercando pattern ripetuti e genera skill per standardizzarli.

Meta-skill que escanea el codebase Angular buscando patrones de implementación repetidos y propone (luego crea) nuevos skills para automatizarlos.

## Cuándo se invoca / When it triggers / Quando si attiva

- *"detecta patrones en el proyecto y crea skills"*
- *"qué patrones se pueden automatizar?"*
- *"scan the codebase for skill candidates"*
- *"crea skills a partir de los patrones que ves"*
- Después de una migración o refactor grande.

## Cómo funciona

1. **Scan** — lee archivos representativos de:
   - `src/app/pages/` (smart components)
   - `src/app/shared/components/` (dumb components)
   - `src/app/shared/services/` (servicios API)
   - `src/app/shared/interfaces/`
   - `src/app/shared/guards/` y `interceptors/`
   - `src/app/app.routes.ts`

2. **Score** — `repetición × complejidad × frecuencia` (≥ 10 para proponer).

3. **Propose** — tabla ranked, espera aprobación.

4. **Create** — escribe a `.claude/skills/<name>/SKILL.md` + copia en `docs/skills/<name>.md`.

## Rúbrica

| Eje | 1 | 3 | 5 |
|---|---|---|---|
| Repetición | 1–2 archivos | 5–10 archivos | 10+ archivos |
| Complejidad | Trivial | Moderada | Difícil de escribir desde cero |
| Frecuencia | Raramente | Ocasional | Cada sprint |

## Formato de salida

```
SKILL CANDIDATES DETECTED — front-bethergold
============================================
1. [page-with-list-pattern]   — rep:5 cplx:4 freq:4 = 13  ★★★
2. [service-crud-generator]   — rep:5 cplx:3 freq:4 = 12  ★★★
3. [signal-page-state]        — rep:4 cplx:3 freq:4 = 11  ★★
4. [http-interceptor-add]     — rep:3 cplx:3 freq:2 = 8   (descartado < 10)

¿Cuáles creo? (all / 1,2 / none)
```

## Candidatos esperados (a priori)

A partir de los estándares en [`docs/standards/`](../standards/):

- **`service-crud-generator`** — service `providedIn: 'root'` con 5 métodos CRUD tipados.
- **`page-with-list-pattern`** — smart component con `search FormControl + debounce + signals + paginación + Tailwind`.
- **`signal-page-state`** — patrón `signal/computed/effect` para una page.
- **`dumb-card-generator`** — componente dumb con `input.required()` + `output()`.
- **`add-route-feature`** — registra lazy route + guard en `app.routes.ts`.

## Integración con otros skills

- No duplica skills ya instalados (chequea `docs/skills/README.md`).
- Cada skill nuevo se registra automáticamente en `docs/skills/README.md`.
- Las plantillas siguen `docs/standards/`.

## Convención de archivos generados

```
.claude/skills/<name>/SKILL.md     ← receta ejecutable
docs/skills/<name>.md              ← copia legible
docs/skills/README.md              ← índice
```

## Checklist

- [ ] Score ≥ 10 documentado.
- [ ] Frontmatter `name` + `description` (ES/EN/IT si aplica).
- [ ] Triggers concretos en "Cuándo usarlo".
- [ ] Plantillas alineadas con `docs/standards/`.
- [ ] Standalone + Signals + Tailwind respetados.
- [ ] Entrada en `docs/skills/README.md`.
