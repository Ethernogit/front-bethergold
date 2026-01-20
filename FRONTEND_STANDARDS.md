# Estándares de Código Frontend - BetherGold

Este documento define los estándares de arquitectura y desarrollo para el proyecto frontend. El objetivo es mantener una estructura modular, escalable y mantenible.

## 1. Arquitectura General

El proyecto sigue una arquitectura orientada a **Páginas y Servicios** sobre Angular moderno (Standalone Components).

*   **Pages (`src/app/pages/`)**: Vistas principales de la aplicación. Son los componentes "inteligentes" que orquestan la lógica de la vista.
*   **Shared (`src/app/shared/`)**: Lógica y UI reutilizable.
    *   **Services (`src/app/shared/services/`)**: Manejo de lógica de negocio, llamadas API y estado global.
    *   **Components (`src/app/shared/components/`)**: Componentes de UI "tontos" (presentacionales) reutilizables.
    *   **Interfaces (`src/app/shared/interfaces/`)**: Definiciones de tipos TypeScript.

## 2. Componentes

### Standalone Components
Todos los componentes deben ser `standalone: true`. No se deben usar `NgModules` a menos que sea estrictamente necesario por una librería externa legacy.

```typescript
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UserCardComponent],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent {}
```

### Modularity
*   **Principio de Responsabilidad Única**: Un componente debe hacer una sola cosa.
*   **Split**: Evita componentes gigantes ("God Objects"). Si un archivo `.ts` supera las 300-400 líneas, considera refactorizar sub-secciones en componentes más pequeños.
*   **Smart vs Dumb**:
    *   *Smart (Pages)*: Inyectan servicios, manejan señales de estado.
    *   *Dumb (Components)*: Reciben datos vía `input()` y emiten eventos vía `output()`.

## 3. Manejo de Estado (Signals)

Se debe priorizar el uso de **Angular Signals** sobre `BehaviorSubject` para el manejo de estado reactivo en componentes.

*   Usar `signal()` para valores mutables.
*   Usar `computed()` para valores derivados.
*   Usar `effect()` con precaución, solo para efectos secundarios (logging, sincronización manual DOM).

```typescript
// Preferido
count = signal(0);
doubleCount = computed(() => this.count() * 2);

// Evitar (para nuevo estado local)
count$ = new BehaviorSubject(0);
```

## 4. Inyección de Dependencias

Utilizar la función `inject()` en lugar de la inyección por constructor para mantener el código más limpio y permitir herencia de componentes sin super-calls complejos.

```typescript
// Preferido
export class UserComponent {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
}

// Evitar en componentes nuevos
constructor(private userService: UserService, private fb: FormBuilder) {}
```

## 5. Estructura de Directorios Detallada

```
src/app/
├── pages/                  # Vistas Rutables
│   ├── products/
│   │   ├── product-list/   # Componente de lista
│   │   └── product-form/   # Componente de edición/creación
│   └── users/
├── shared/                 # Reutilizable
│   ├── components/         # Botones, Modales, Cards, Tables
│   ├── services/           # Lógica API y Estado Global
│   ├── interfaces/         # Modelos de dominio (User, Product)
│   ├── guards/             # Route Guards
│   └── interceptors/       # HTTP Interceptors
└── app.routes.ts           # Definición de rutas
```

## 6. Convenciones de Nombres

*   **Archivos**: `kebab-case` (`user-profile.component.ts`).
*   **Clases**: `PascalCase` (`UserProfileComponent`).
*   **Variables/Métodos**: `camelCase` (`loadUsers()`).
*   **Servicios**: Sufijo `Service` (`ProductService`).
*   **Interfaces**: PascalCase, singular, sin prefijo `I` (`Product`, no `IProduct`).

## 7. Reglas Generales

*   **Tipado Fuerte**: Evitar `any` a toda costa. Definir interfaces para todas las respuestas de API.
*   **Servicios Ligeros**: Los servicios deben manejar la comunicación con el backend y la lógica de negocio pura. No deben manipular el DOM ni contener lógica de UI específica.
*   **DRY (Don't Repeat Yourself)**: Si copias y pegas código, extráelo a una función de utilidad o un componente compartido.
