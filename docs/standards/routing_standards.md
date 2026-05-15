# Estándares de Rutas — front-bethergold

> **EN:** All routes lazy-loaded via `loadComponent`, `authGuard` on private routes, layout shells for nested sections, multi-tenant `orgId` flows through the auth state.
> **IT:** Tutte le rotte lazy via `loadComponent`, `authGuard` su rotte private, layout shell per sezioni annidate, `orgId` multi-tenant dallo stato auth.

## 1. Lazy loading siempre

```ts
// ✅ Correcto
{
  path: 'products',
  loadComponent: () =>
    import('./pages/products/product-list/product-list.component')
      .then(m => m.ProductListComponent),
}

// ❌ Incorrecto (carga todo en bundle inicial)
{ path: 'products', component: ProductListComponent }
```

Para sub-rutas, usar `children` o `loadChildren` con un sub-`Routes`.

## 2. Guards

```ts
import { authGuard } from '@shared/guards/auth.guard';
import { permissionGuard } from '@shared/guards/permission.guard';

{
  path: 'admin',
  canActivate: [authGuard, permissionGuard('admin', 'access')],
  loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent),
}
```

- `authGuard` en TODA ruta privada.
- `permissionGuard(resource, action)` para chequeos finos.
- Guards son funciones (Angular 17+), no clases.

## 3. Estructura típica

```ts
export const routes: Routes = [
  // públicas
  { path: 'login', loadComponent: () => import('./pages/auth-pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/auth-pages/register/register.component').then(m => m.RegisterComponent) },

  // privadas con layout
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/layout/app-layout/app-layout.component').then(m => m.AppLayoutComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      {
        path: 'products',
        children: [
          { path: '', loadComponent: () => import('./pages/products/product-list/product-list.component').then(m => m.ProductListComponent) },
          { path: 'new', loadComponent: () => import('./pages/products/product-form/product-form.component').then(m => m.ProductFormComponent) },
          { path: ':id', loadComponent: () => import('./pages/products/product-detail/product-detail.component').then(m => m.ProductDetailComponent) },
        ],
      },
    ],
  },

  // wildcard
  { path: '**', redirectTo: 'dashboard' },
];
```

## 4. Layout shells

Las rutas privadas comparten un `AppLayoutComponent` que contiene sidebar + navbar + `<router-outlet>`. Anidar las páginas como `children` del layout.

## 5. Orden de rutas

```ts
// ✅ Estáticas antes que dinámicas
{ path: 'products/new', /* ... */ }
{ path: 'products/:id', /* ... */ }

// ❌ Incorrecto
{ path: 'products/:id', /* ... */ }
{ path: 'products/new', /* ... */ }  // ":id" capturaría "new"
```

## 6. Multi-tenant

El `orgId` NO va en la URL del frontend (ej. NO `/org/:orgId/products`). Está en el estado de auth:

```ts
const orgId = this.auth.currentOrgId(); // signal
```

El servicio lo agrega a la URL del API: `${apiUrl}/v1/organizations/${orgId}/products`.

Para cambiar de org, el `AuthService.switchOrg(newOrgId)` recarga el estado y opcionalmente refresca la ruta actual.

## 7. Parámetros de ruta

```ts
const id = this.route.snapshot.paramMap.get('id');

// O reactivo
this.route.paramMap.subscribe(p => this.load(p.get('id')!));
```

## 8. RouterLink en templates

```html
<a [routerLink]="['/products', product._id]" routerLinkActive="active">{{ product.name }}</a>
```

Para query params:
```html
<a [routerLink]="['/products']" [queryParams]="{ page: 2, search: 'oro' }">Página 2</a>
```

---

> **Automatización**: el patrón "ruta lazy + guard + layout shell" es candidato a skill `add-route-feature` por [`pattern-skill-creator`](../skills/pattern-skill-creator.md).
