---
name: build-page-feature
description: Construir una feature de página completa en Angular 20 (component + service + interface + ruta + sidebar) siguiendo las convenciones standalone/Signals/Tailwind de front-bethergold. Multi-tenant (orgId) y lazy loading obligatorios.
---

# Build Page Feature — front-bethergold

> **EN:** Recipe to add a new page feature (list/detail/form) using Angular 20 standalone components, Signals, Tailwind v4, lazy routes, and the multi-tenant API (`orgId`). Six layers: interface → service → smart component → dumb components → route → sidebar.
> **IT:** Ricetta per aggiungere una nuova feature pagina con componenti standalone, Signals, Tailwind v4, rotte lazy e API multi-tenant. Sei livelli: interface → service → smart component → dumb components → route → sidebar.

Se invoca cuando el usuario pide *"crea la página de X"*, *"añade un módulo para Y"*, *"falta la vista de Z"*.

Toda feature pasa por las 6 capas: **interface → service → smart component (page) → dumb components → route → sidebar**.

---

## 1. Interface del dominio

Ubicación: `src/app/shared/interfaces/<feature>.interface.ts` (o `<feature>.ts`).

```ts
export interface Product {
  _id: string;
  organization: string;
  name: string;
  sku: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  isActive?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedData<T, K extends string> {
  pagination: { totalItems: number; totalPages: number; currentPage: number; pageSize: number; hasNext: boolean; hasPrevious: boolean };
  meta: { filters: Record<string, unknown> };
}

export type ProductListData = PaginatedData<Product, 'products'> & { products: Product[] };
```

---

## 2. Servicio

Ubicación: `src/app/shared/services/<feature>.service.ts`.

```ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import type {
  Product, ProductListParams, ProductListData, ApiResponse,
} from '@shared/interfaces/product.interface';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/v1/organizations`;

  getAll(orgId: string, params: ProductListParams = {}): Observable<ApiResponse<ProductListData>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') httpParams = httpParams.set(k, String(v));
    });
    return this.http.get<ApiResponse<ProductListData>>(`${this.base}/${orgId}/products`, { params: httpParams });
  }

  getById(orgId: string, id: string): Observable<ApiResponse<{ product: Product }>> {
    return this.http.get<ApiResponse<{ product: Product }>>(`${this.base}/${orgId}/products/${id}`);
  }

  create(orgId: string, payload: Partial<Product>): Observable<ApiResponse<{ product: Product }>> {
    return this.http.post<ApiResponse<{ product: Product }>>(`${this.base}/${orgId}/products`, payload);
  }

  update(orgId: string, id: string, payload: Partial<Product>): Observable<ApiResponse<{ product: Product }>> {
    return this.http.patch<ApiResponse<{ product: Product }>>(`${this.base}/${orgId}/products/${id}`, payload);
  }

  delete(orgId: string, id: string): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.base}/${orgId}/products/${id}`);
  }
}
```

**Reglas**:
- `providedIn: 'root'`.
- Sin `.subscribe()` interno — devuelve `Observable`.
- Tipado fuerte siempre — `ApiResponse<T>` envoltura estándar.

---

## 3. Smart component (Page)

Ubicación: `src/app/pages/<feature>/<feature>-list/<feature>-list.component.ts`.

```ts
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { ProductService } from '@shared/services/product.service';
import { AuthService } from '@shared/services/auth.service';
import type { Product } from '@shared/interfaces/product.interface';
import { ProductCardComponent } from '@shared/components/product-card/product-card.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, ProductCardComponent],
  templateUrl: './product-list.component.html',
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private auth = inject(AuthService);

  products = signal<Product[]>([]);
  loading  = signal(false);
  totalPages = signal(1);
  currentPage = signal(1);
  search = new FormControl('');

  totalItems = computed(() => this.products().length);

  ngOnInit(): void {
    this.load();
    this.search.valueChanges.pipe(debounceTime(300)).subscribe(() => this.load());
  }

  load(): void {
    const orgId = this.auth.currentOrgId();
    if (!orgId) return;
    this.loading.set(true);
    this.productService.getAll(orgId, {
      page: this.currentPage(),
      search: this.search.value ?? undefined,
    }).subscribe({
      next: (res) => {
        this.products.set(res.data.products);
        this.totalPages.set(res.data.pagination.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goToPage(page: number): void { this.currentPage.set(page); this.load(); }
}
```

Template (`product-list.component.html`) con Tailwind v4:

```html
<div class="p-6 space-y-4">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold">Productos</h1>
    <a routerLink="/products/new" class="btn btn-primary">+ Nuevo</a>
  </header>

  <input [formControl]="search" placeholder="Buscar..."
         class="w-full md:w-80 rounded-lg border-gray-300 dark:bg-gray-800" />

  @if (loading()) {
    <p class="text-gray-500">Cargando…</p>
  } @else {
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      @for (p of products(); track p._id) {
        <app-product-card [product]="p" />
      } @empty {
        <p class="col-span-full text-gray-500">Sin productos.</p>
      }
    </div>
  }
</div>
```

---

## 4. Dumb components

Ubicación: `src/app/shared/components/<name>/<name>.component.ts`.

```ts
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Product } from '@shared/interfaces/product.interface';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
})
export class ProductCardComponent {
  product = input.required<Product>();
  edit = output<string>();
}
```

- Reciben datos con `input()` (signal input).
- Emiten eventos con `output()`.
- No inyectan servicios — UI pura.

---

## 5. Ruta lazy

Ubicación: `src/app/app.routes.ts`.

```ts
import { authGuard } from '@shared/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'products',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/products/product-list/product-list.component')
            .then(m => m.ProductListComponent),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./pages/products/product-form/product-form.component')
            .then(m => m.ProductFormComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/products/product-detail/product-detail.component')
            .then(m => m.ProductDetailComponent),
      },
    ],
  },
];
```

**Nunca** `component:` directo — siempre `loadComponent`.

---

## 6. Sidebar

Si la página es navegable, agregar entrada en `src/app/shared/layout/app-sidebar/app-sidebar.component.html` (o donde viva tu sidebar).

```html
<a routerLink="/products" routerLinkActive="active" class="sidebar-item">
  <i-package class="h-5 w-5"></i-package>
  <span>Productos</span>
</a>
```

---

## 7. Multi-tenant — REGLA CRÍTICA

- El `orgId` proviene SIEMPRE del estado de auth (`AuthService.currentOrgId()` u equivalente).
- Cada llamada al servicio API lo recibe como primer parámetro.
- Un HTTP interceptor puede inyectar `Authorization` headers, pero el `orgId` viaja en la URL.

**Anti-pattern**: hardcodear `orgId` o leerlo de `localStorage` directamente desde el componente. Eso pertenece al `AuthService`.

---

## 8. Checklist

- [ ] Interface tipada en `shared/interfaces/`.
- [ ] Service `providedIn: 'root'` con 5 métodos CRUD tipados.
- [ ] Smart component standalone con Signals + `inject()`.
- [ ] Dumb components con `input()` / `output()`.
- [ ] Ruta con `loadComponent` y `canActivate: [authGuard]`.
- [ ] Entrada en sidebar si aplica.
- [ ] Estilos con Tailwind v4 — sin CSS custom innecesario.
- [ ] Sin `any` — todo tipado.
- [ ] `orgId` desde AuthService, nunca hardcoded.
- [ ] Probado: lista vacía, lista con datos, búsqueda, paginación, detail no encontrado.

---

## Referencias

- `FRONTEND_STANDARDS.md` — convenciones generales.
- `docs/standards/component_standards.md` — detalle smart/dumb.
- `docs/standards/service_standards.md` — HttpClient y Observables.
- `docs/standards/state_management_standards.md` — Signals.
- `docs/standards/routing_standards.md` — lazy + guards.
- `docs/skills/create-page.md` — receta rápida.
