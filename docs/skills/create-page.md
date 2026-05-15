---
name: create-page
description: Crea una nueva página (feature) en src/app/pages/ con su componente, ruta y servicio asociado.
---

# Skill: create-page

Estándar para crear un nuevo módulo de página en el proyecto Angular.

## Cuándo usarlo

Cuando necesites agregar una nueva sección navegable a la aplicación (ej: una nueva entidad de negocio, un nuevo reporte, un nuevo flujo de gestión).

## Estructura de archivos

```
src/app/pages/{feature}/
├── {feature}.component.ts
├── {feature}.component.html
└── {feature}.component.css          ← solo si tiene estilos propios

src/app/shared/services/
└── {feature}.service.ts

src/app/app.routes.ts                 ← agregar la ruta
```

Si la página tiene sub-vistas:

```
src/app/pages/{feature}/
├── {feature-list}/
│   ├── {feature}-list.component.ts
│   ├── {feature}-list.component.html
│   └── {feature}-list.component.css
├── {feature-detail}/
│   ├── {feature}-detail.component.ts
│   └── {feature}-detail.component.html
└── new-{feature}/
    ├── new-{feature}.component.ts
    └── new-{feature}.component.html
```

## Pasos

1. **Crear la carpeta** `src/app/pages/{feature}/`.

2. **Crear el componente principal** como standalone:

```typescript
// {feature}.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-{feature}',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './{feature}.component.html',
})
export class {Feature}Component {}
```

3. **Crear el servicio** en `src/app/shared/services/{feature}.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class {Feature}Service {
  private readonly base = `${environment.apiUrl}/{feature}s`;

  constructor(private http: HttpClient) {}

  getAll(orgId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/${orgId}`);
  }

  getById(orgId: string, id: string): Observable<any> {
    return this.http.get<any>(`${this.base}/${orgId}/${id}`);
  }

  create(orgId: string, payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/${orgId}`, payload);
  }

  update(orgId: string, id: string, payload: any): Observable<any> {
    return this.http.patch<any>(`${this.base}/${orgId}/${id}`, payload);
  }

  delete(orgId: string, id: string): Observable<any> {
    return this.http.delete<any>(`${this.base}/${orgId}/${id}`);
  }
}
```

4. **Registrar la ruta** en `src/app/app.routes.ts`:

```typescript
{
  path: '{feature}s',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./pages/{feature}/{feature}.component').then(
      (m) => m.{Feature}Component
    ),
},
```

5. **Agregar al sidebar** en `app-sidebar.component.html` si aplica.

## Checklist

- [ ] Componente standalone con `imports` explícitos
- [ ] Servicio con los 5 métodos CRUD base
- [ ] Ruta con lazy loading (`loadComponent`)
- [ ] Guard `canActivate: [authGuard]` en la ruta
- [ ] Entrada en sidebar si es navegable
- [ ] Nombrar en kebab-case las carpetas y archivos
