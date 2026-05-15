---
description: Project architecture, structure and core patterns — front-bethergold
---

# Arquitectura del Proyecto — front-bethergold

> **EN:** Angular 20 standalone-components SPA with Signals, Tailwind CSS v4, lazy-loaded routes, multi-tenant API (`orgId`).
> **IT:** SPA Angular 20 con componenti standalone, Signals, Tailwind CSS v4, rotte lazy-loaded, API multi-tenant (`orgId`).

Angular 20 (standalone components, sin NgModules) + Tailwind CSS v4 + Signals + lazy loading.

## Estructura de carpetas

```
src/app/
├── pages/                    # Vistas rutables (smart components)
│   ├── products/
│   │   ├── product-list/
│   │   ├── product-detail/
│   │   └── product-form/
│   └── ...
├── shared/                   # Reutilizable
│   ├── components/           # Dumb components (botones, modales, cards, tables)
│   ├── services/             # API + estado global
│   ├── interfaces/           # Tipos TypeScript del dominio
│   ├── guards/               # authGuard, roleGuard
│   ├── interceptors/         # HTTP interceptors (auth, error, tenant)
│   ├── layout/               # Sidebar, navbar, layout shells
│   └── pipe/                 # Pipes
├── services/                 # Servicios cross-app (raros, preferir shared/services)
├── environments/             # environment.ts (dev) + environment.prod.ts
├── app.config.ts             # Providers (router, HTTP, etc.)
├── app.routes.ts             # Rutas raíz con loadComponent
└── app.component.ts          # Shell
```

## Convenciones obligatorias

### Componentes standalone
```ts
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  templateUrl: './product-list.component.html',
})
export class ProductListComponent {}
```
- **Siempre** `standalone: true`. NgModules solo si una librería legacy lo exige.
- `imports` explícito por componente.

### Signals para estado
```ts
products = signal<Product[]>([]);
loading  = signal(false);
total    = computed(() => this.products().length);
```
- **Preferir** `signal()` / `computed()` sobre `BehaviorSubject`.
- `effect()` solo para side effects (logs, DOM manual).
- Servicios pueden exponer signals públicas (`readonly products = this._products.asReadonly()`).

### `inject()` sobre constructor
```ts
export class ProductListComponent {
  private productService = inject(ProductService);
  private route          = inject(ActivatedRoute);
  private fb             = inject(FormBuilder);
}
```
Evitar constructor injection en componentes nuevos.

### Servicios
- `@Injectable({ providedIn: 'root' })`.
- Retornan `Observable<T>` desde `HttpClient`. **No** `.subscribe()` interno.
- Tipado fuerte — interfaces en `shared/interfaces/`, nunca `any`.

```ts
@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/v1/organizations`;

  getAll(orgId: string, params?: ListParams): Observable<ApiResponse<ProductListData>> {
    return this.http.get<ApiResponse<ProductListData>>(`${this.base}/${orgId}/products`, { params: params as any });
  }
}
```

### Rutas con lazy loading
```ts
{
  path: 'products',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./pages/products/product-list/product-list.component')
      .then(m => m.ProductListComponent),
}
```
**Nunca** `component: X` en `app.routes.ts` — siempre `loadComponent` (o `loadChildren` para sub-rutas).

### Multi-tenant
- El `orgId` viene del estado de auth (servicio global de sesión, o `inject(AuthService).currentOrg()`).
- Cada servicio API recibe `orgId` como primer parámetro.
- Un HTTP interceptor (`tenant.interceptor.ts`) puede inyectar headers o validar.

### Nomenclatura
- Archivos/carpetas: `kebab-case` (`product-list.component.ts`).
- Clases: `PascalCase` (`ProductListComponent`).
- Servicios: sufijo `Service` (`ProductService`).
- Interfaces: PascalCase singular SIN prefijo `I` (`Product`, no `IProduct`).
- Selectores: `app-<feature>` (`app-product-list`).

## Reglas no negociables

1. No credenciales hardcoded — ver `no-credentials-hardcode.md`.
2. Standalone components siempre.
3. Lazy loading siempre (`loadComponent`).
4. `authGuard` en toda ruta privada.
5. Signals para estado local; servicios pueden exponer signals readonly.
6. Tipado fuerte — `any` prohibido salvo en migraciones temporales.
7. Tailwind v4 — evitar CSS custom salvo casos específicos.
8. Servicios devuelven `Observable<ApiResponse<T>>`, no se suscriben internamente.

## Referencias

- Estándares: [`docs/standards/`](../../docs/standards/)
- Skills ejecutables: [`docs/skills/`](../../docs/skills/) y [`.claude/skills/`](../skills/)
- `FRONTEND_STANDARDS.md` (raíz)
