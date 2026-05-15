---
name: create-shared-component
description: Crea un componente reutilizable en src/app/shared/components/ bajo la categoría correcta.
---

# Skill: create-shared-component

Estándar para crear componentes que serán usados en múltiples páginas o features.

## Cuándo usarlo

Cuando un elemento de UI necesita reutilizarse en más de un lugar: tablas genéricas, cards, modales, formularios base, badges, etc.

## Categorías disponibles

Coloca el componente en la categoría que corresponda dentro de `src/app/shared/components/`:

| Categoría     | Ejemplos                                      |
|---------------|-----------------------------------------------|
| `admin`       | Formularios de roles, permisos                |
| `cards`       | Cards de métricas, cards con íconos           |
| `charts`      | Gráficas AmCharts                             |
| `common`      | Loader, empty-state, error-message            |
| `form`        | Inputs personalizados, selects, date-pickers  |
| `header`      | Page headers, breadcrumbs                     |
| `invoice`     | Vistas de factura o nota de venta             |
| `tables`      | Tablas con paginación, filtros                |
| `ui`          | Modales, drawers, tooltips, badges            |

Si ninguna aplica, crea una nueva categoría con nombre en singular.

## Estructura de archivos

```
src/app/shared/components/{categoria}/{component-name}/
├── {component-name}.component.ts
├── {component-name}.component.html
└── {component-name}.component.css    ← solo si necesita estilos propios
```

## Pasos

1. **Crear la carpeta** bajo la categoría correcta.

2. **Crear el componente** como standalone con `@Input()` y `@Output()` explícitos:

```typescript
// {component-name}.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-{component-name}',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './{component-name}.component.html',
})
export class {ComponentName}Component {
  @Input() data: any;                              // tipado fuerte preferido
  @Output() action = new EventEmitter<any>();
}
```

3. **No inyectar servicios de negocio** en componentes shared — los datos llegan por `@Input()`.

4. **Exportar desde un barrel** si la categoría ya tiene `index.ts`:

```typescript
export * from './{component-name}/{component-name}.component';
```

## Checklist

- [ ] Ubicado en la categoría correcta bajo `shared/components/`
- [ ] Standalone con imports explícitos
- [ ] Sin lógica de negocio ni llamadas HTTP directas
- [ ] `@Input()` tipados (evitar `any` si es posible)
- [ ] `@Output()` con `EventEmitter` para comunicación hacia el padre
- [ ] Selector con prefijo `app-`
