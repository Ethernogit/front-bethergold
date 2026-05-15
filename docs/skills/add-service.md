---
name: add-service
description: Crea o extiende un servicio Angular en shared/services/ para consumir un endpoint de la API.
---

# Skill: add-service

Estándar para agregar servicios que conectan el frontend con la API de back-bethergold.

## Cuándo usarlo

Cuando un componente o página necesita consumir datos de la API y no existe un servicio para esa entidad, o cuando necesitas agregar nuevos métodos a uno existente.

## Ubicación

```
src/app/shared/services/
└── {entity}.service.ts
```

Servicios de autenticación y RBCA van en sus subcarpetas:
```
src/app/shared/services/auth/
src/app/shared/services/rbca/
```

## Plantilla base

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class {Entity}Service {
  private readonly base = `${environment.apiUrl}/v1/organizations`;

  constructor(private http: HttpClient) {}

  getAll(orgId: string, params?: Record<string, string>): Observable<any[]> {
    const httpParams = params ? new HttpParams({ fromObject: params }) : undefined;
    return this.http.get<any[]>(`${this.base}/${orgId}/{entities}`, { params: httpParams });
  }

  getById(orgId: string, id: string): Observable<any> {
    return this.http.get<any>(`${this.base}/${orgId}/{entities}/${id}`);
  }

  create(orgId: string, payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/${orgId}/{entities}`, payload);
  }

  update(orgId: string, id: string, payload: Partial<any>): Observable<any> {
    return this.http.patch<any>(`${this.base}/${orgId}/{entities}/${id}`, payload);
  }

  delete(orgId: string, id: string): Observable<any> {
    return this.http.delete<any>(`${this.base}/${orgId}/{entities}/${id}`);
  }
}
```

## Convenciones

- **Un servicio por entidad de negocio** — no mezclar productos con categorías en el mismo servicio.
- **`providedIn: 'root'`** siempre — no declarar en módulos.
- **Tipado fuerte**: crear interfaces en el mismo archivo o en `src/app/shared/models/` si se reusan.
- **Sin manejo de errores en el servicio** — el componente o un interceptor lo maneja.
- **Prefijo de URL consistente**: `environment.apiUrl/v1/organizations/{orgId}/{entidad}`.

## Checklist

- [ ] `Injectable({ providedIn: 'root' })`
- [ ] URL construida desde `environment.apiUrl`
- [ ] Métodos retornan `Observable<T>` (no Promises)
- [ ] Sin `.subscribe()` dentro del servicio
- [ ] Interfaces de tipos definidas si la entidad es compleja
