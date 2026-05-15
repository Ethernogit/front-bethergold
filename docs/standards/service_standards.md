# Estándares de Servicios — front-bethergold

> **EN:** `providedIn: 'root'` services, typed `Observable<ApiResponse<T>>`, no internal `.subscribe()`, multi-tenant `orgId` first parameter.
> **IT:** Servizi `providedIn: 'root'`, `Observable<ApiResponse<T>>` tipato, niente `.subscribe()` interno, `orgId` come primo parametro.

## 1. Estructura base

```ts
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
}
```

## 2. Reglas

- `@Injectable({ providedIn: 'root' })` siempre.
- **Tipado fuerte** — definir `ApiResponse<T>` y los DTOs en `shared/interfaces/`.
- **Sin `.subscribe()` interno** — el servicio devuelve el `Observable`, el componente se suscribe.
- **Multi-tenant**: `orgId` es siempre el primer parámetro.
- **URL base**: `${environment.apiUrl}/v1/organizations` para endpoints organizacionales; `${environment.apiUrl}/v1` para globales.
- **Sin lógica de UI**: no manipular el DOM, no abrir modales, no navegar (eso es del componente).

## 3. Tipos estándar

```ts
// shared/interfaces/api.ts
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Pagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ListMeta {
  filters: Record<string, unknown>;
}
```

## 4. Manejo de errores

Dejar que el HTTP interceptor maneje errores globales (toast, redirect, etc). Si un servicio necesita transformar un error:

```ts
import { catchError, throwError } from 'rxjs';

getAll(orgId: string): Observable<ApiResponse<ProductListData>> {
  return this.http.get<ApiResponse<ProductListData>>(`${this.base}/${orgId}/products`).pipe(
    catchError((err) => {
      // log, transform, etc.
      return throwError(() => err);
    }),
  );
}
```

## 5. Estado compartido con Signals

Si el servicio mantiene estado (selección activa, filtros guardados), usar signals privadas con accesor readonly:

```ts
@Injectable({ providedIn: 'root' })
export class ProductStore {
  private _selected = signal<Product | null>(null);
  readonly selected = this._selected.asReadonly();

  select(p: Product) { this._selected.set(p); }
  clear() { this._selected.set(null); }
}
```

## 6. Cancelación / debounce

Para búsquedas con debounce, manejarlo en el componente con `debounceTime` + `switchMap`, no en el servicio.

## 7. HTTP Interceptors

- `auth.interceptor.ts` — inyecta `Authorization: Bearer <token>`.
- `error.interceptor.ts` — maneja 401 (logout), 403 (toast).
- `tenant.interceptor.ts` (opcional) — valida que `orgId` esté presente en URLs `/v1/organizations/...`.

Registrar en `app.config.ts`:
```ts
provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))
```

---

> **Automatización**: skill [`add-service`](../skills/add-service.md). Detección de patrones repetidos: [`pattern-skill-creator`](../skills/pattern-skill-creator.md).
