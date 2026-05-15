# Estándares de Componentes — front-bethergold

> **EN:** Standalone components, smart vs dumb separation, `inject()`, signal-based inputs/outputs.
> **IT:** Componenti standalone, separazione smart vs dumb, `inject()`, input/output basati su signal.

## 1. Standalone obligatorio

```ts
@Component({
  selector: 'app-feature',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ChildComponent],
  templateUrl: './feature.component.html',
})
export class FeatureComponent {}
```

- `standalone: true` siempre.
- `imports` explícito — sin NgModules.
- Selector con prefijo `app-`.

## 2. Smart vs Dumb

### Smart (Page)
- Vive en `src/app/pages/<feature>/`.
- Inyecta servicios, maneja estado, llama al backend.
- Orquesta dumb components.

### Dumb (Shared)
- Vive en `src/app/shared/components/`.
- Recibe datos con `input()`, emite eventos con `output()`.
- **Nunca** inyecta servicios de negocio.
- UI pura, reutilizable.

```ts
// Dumb
@Component({ /* ... */ })
export class ProductCardComponent {
  product = input.required<Product>();
  selected = input(false);
  edit = output<string>();
  delete = output<string>();
}
```

## 3. `inject()` sobre constructor

```ts
// ✅ Preferido
export class FeatureComponent {
  private productService = inject(ProductService);
  private fb = inject(FormBuilder);
}

// ❌ Evitar (constructor injection)
constructor(private productService: ProductService, private fb: FormBuilder) {}
```

`inject()` permite herencia limpia y reduce ruido en el constructor.

## 4. División por tamaño

Si un `.ts` supera **300–400 líneas**, refactorizar en sub-componentes. Reglas heurísticas:
- Lista + filtros + paginación → ¿extraer una toolbar?
- Form con muchos campos → ¿secciones en sub-componentes?
- Render condicional grande → ¿componentes separados?

## 5. Templates

- Tailwind v4 para estilos. Evitar CSS custom.
- Usar control flow `@if/@for/@empty/@switch` (Angular 17+), no `*ngIf/*ngFor`.
- `track` obligatorio en `@for`.

```html
@if (loading()) {
  <p>Cargando…</p>
} @else {
  <ul>
    @for (item of items(); track item._id) {
      <li>{{ item.name }}</li>
    } @empty {
      <li>Sin resultados.</li>
    }
  </ul>
}
```

## 6. Nomenclatura

| Tipo | Convención | Ejemplo |
|---|---|---|
| Archivo | kebab-case | `product-list.component.ts` |
| Clase | PascalCase | `ProductListComponent` |
| Selector | `app-<feature>` | `app-product-list` |
| Inputs | camelCase | `product`, `selected` |
| Outputs | camelCase verbo | `edit`, `delete` |

---

> **Automatización**: skills [`create-page`](../skills/create-page.md), [`create-shared-component`](../skills/create-shared-component.md). Detección automática: [`pattern-skill-creator`](../skills/pattern-skill-creator.md).
