---
description: Spec-Driven Design (SDD) workflow — ES/EN/IT
---

# Flujo de trabajo — Spec-Driven Design (SDD)

> **EN summary:** Apply 4-phase SDD (Investigate → Spec → Plan → Implement) to every non-trivial task. Skip only for skill invocations, scheduled tasks, or trivial renames (after confirmation).
> **IT summary:** Applica SDD a 4 fasi (Indagine → Specifica → Piano → Implementazione) a ogni compito non banale. Salta solo per skill, task ricorrenti o rename triviali (previa conferma).

Para CUALQUIER tarea en este proyecto (sin importar tamaño) aplica SDD con 4 fases:

**Fase 1 — Investigación / Investigation / Indagine**: prompt vago ("refactorizar X", "añadir Y") → explorar primero (agente Explore o lecturas dirigidas) y devolver resumen factual del estado actual ANTES de proponer nada.

**Fase 2 — Spec / Specification / Specifica**: prompt cargado de contexto → criticarlo primero. Identificar huecos, ambigüedades, supuestos no declarados, casos borde faltantes. Usar AskUserQuestion para resolver ambigüedades puntuales. Iterar hasta tener: objetivo, contratos entrada/salida, casos borde, qué NO hace, criterios de aceptación.

**Fase 3 — Plan / Plan / Piano**: entrar en plan mode (EnterPlanMode). Presentar archivos a crear/modificar, contratos, orden de cambios, riesgos. NO escribir código aunque el plan parezca obvio. Esperar aprobación vía ExitPlanMode.

**Fase 4 — Implementar / Implement / Implementare**: tareas pequeñas, avisar de desviaciones. Si a mitad se descubre algo que invalida la spec → parar y volver a Fase 2.

## Excepciones (NO aplicar SDD) / Exceptions / Eccezioni

- **Skills**: si el prompt invoca o claramente corresponde a una skill (`/review`, `/security-review`, `/simplify`, `/init`, `/schedule`, `/loop`, `skill-creator`, `update-config`, `fewer-permission-prompts`, etc.) → invocar la skill directamente vía el tool `Skill`. La skill ya define su propio flujo.
- **Tareas recurrentes / programadas**: prompts tipo "cada X minutos…", "programa…", "checkea cada…" → usar skills `loop` o `schedule` directamente, no SDD.
- **Fixes triviales o renombres**: pueden saltar a implementación directa, pero CONFIRMAR con el usuario antes de saltar fases.

## Reglas operativas / Operational rules / Regole operative

- No adivinar el modo: prompt vago → investigar; prompt cargado → criticar.
- Si el usuario quiere saltar fases lo dirá explícitamente ("directo a código", "sin plan", "skip planning").
- En Fase 3 NO escribir código aunque el plan parezca obvio — esperar OK explícito.
- **Respuestas al usuario**: el agente debe responder en los tres idiomas (Español → English → Italiano) cuando el usuario interactúe.

## Clasificación del primer turno / First-turn classification / Classificazione del primo turno

1. ¿Es una skill o tarea recurrente? → invocar skill directamente, NO SDD.
2. ¿Es fix trivial / renombre? → confirmar con usuario y saltar a implementación.
3. ¿Prompt vago? → Fase 1 (investigar).
4. ¿Prompt cargado de contexto? → Fase 2 (criticar spec).

Nunca saltar a Edit/Write sin Plan aprobado, salvo las excepciones anteriores.
