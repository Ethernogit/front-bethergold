---
name: create-skill
description: Crea un nuevo skill de desarrollo en docs/skills/ para estandarizar patrones del proyecto front-bethergold.
---

# Skill: create-skill

Crea un nuevo archivo de skill en `docs/skills/` siguiendo la estructura estándar del proyecto.

## Cuándo usarlo

Cuando necesites documentar un nuevo patrón, convención o proceso repetible que el equipo deba seguir al desarrollar en este proyecto.

## Pasos

1. **Identifica el nombre del skill** — usa kebab-case, descriptivo y en verbo (ej: `create-page`, `add-service`, `create-form`).

2. **Crea el archivo** en `docs/skills/{nombre-del-skill}.md`.

3. **Usa esta estructura obligatoria:**

```markdown
---
name: {nombre-del-skill}
description: {Una línea: qué hace este skill y cuándo aplicarlo.}
---

# Skill: {nombre-del-skill}

{Descripción breve del propósito.}

## Cuándo usarlo
{Contexto o disparadores que indican que este skill aplica.}

## Estructura de archivos
{Árbol de archivos que se crearán o modificarán.}

## Pasos
{Lista numerada, clara y ejecutable.}

## Plantillas
{Bloques de código con el scaffold base.}

## Checklist
{Lista de verificación antes de considerar el trabajo terminado.}
```

4. **Agrega el skill al índice** en `docs/skills/README.md`.

## Checklist

- [ ] Nombre en kebab-case y comienza con verbo
- [ ] Frontmatter con `name` y `description`
- [ ] Sección "Cuándo usarlo" clara
- [ ] Plantillas de código incluidas
- [ ] Entrada añadida en `docs/skills/README.md`
