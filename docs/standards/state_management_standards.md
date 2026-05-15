# Estándares de Manejo de Estado (Signals) — front-bethergold

> **EN:** Signals are the default for component state. `signal()` for mutable, `computed()` for derived, `effect()` only for side-effects. Prefer over `BehaviorSubject`.
> **IT:** I Signal sono lo standard. `signal()` per mutabili, `computed()` per derivati, `effect()` solo per side-effect. Preferiti rispetto a `BehaviorSubject`.

## 1. Cuándo usar cada uno

| API | Uso |
|---|---|
| `signal(value)` | Valor mutable en componente o servicio. |
| `computed(() => ...)` | Valor derivado de otras signals. Memoizado automáticamente. |
| `effect(() => ...)` | Side effects (log, sincronización DOM manual). **Usar con cuidado.** |
| `signal.asReadonly()` | Exponer una signal de servicio sin permitir mutación externa. |
| `BehaviorSubject` | Solo para integración con APIs que requieren Observable (ej. interceptors). |

## 2. Patrón estándar en componente

```ts
export class ProductListComponent {
  // estado
  products = signal<Product[]>([]);
  loading  = signal(false);
  page     = signal(1);

  // derivados
  totalItems = computed(() => this.products().length);
  isEmpty    = computed(() => this.products().length === 0 && !this.loading());

  // side effect (raro)
  constructor() {
    effect(() => {
      console.log('[ProductList] page changed →', this.page());
    });
  }

  load() {
    this.loading.set(true);
    this.productService.getAll(this.orgId, { page: this.page() }).subscribe({
      next: (res) => { this.products.set(res.data.products); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
```

## 3. Mutación de signals

- `signal.set(value)` — reemplazar.
- `signal.update(fn)` — basado en valor previo.
- **No** mutar el valor directamente (`signal().push(...)` no dispara cambio).

```ts
this.products.update((curr) => [...curr, newProduct]); // ✅
this.products().push(newProduct);                       // ❌ no dispara
```

## 4. Estado compartido entre componentes

Crear un servicio-store:

```ts
@Injectable({ providedIn: 'root' })
export class ProductStore {
  private _all = signal<Product[]>([]);
  readonly all = this._all.asReadonly();

  setAll(list: Product[]) { this._all.set(list); }
  add(p: Product)        { this._all.update(curr => [...curr, p]); }
  remove(id: string)     { this._all.update(curr => curr.filter(p => p._id !== id)); }
}
```

Los componentes consumen `store.all()` directamente — reactivo automático.

## 5. Cuándo NO usar signals

- **Streams de eventos** (clicks, búsquedas con debounce): seguir con RxJS (`fromEvent`, `Subject`, `debounceTime`).
- **HTTP responses**: el `Observable<T>` del `HttpClient` se consume en el componente, que luego mete el resultado en una signal.

```ts
this.search.valueChanges
  .pipe(debounceTime(300))
  .subscribe(value => this.search.set(value || ''));
```

## 6. Input signals (Angular 17+)

```ts
// Componente dumb con input signal
product = input.required<Product>();
disabled = input(false);

// Uso interno reactivo
isExpensive = computed(() => this.product().price > 1000);
```

## 7. Anti-patterns

- ❌ `this.products()` dentro de un `effect()` para escribir `this.other.set(...)` (loop infinito potencial).
- ❌ Usar `BehaviorSubject` para estado local nuevo.
- ❌ Mutar el valor interno de una signal sin `set`/`update`.
- ❌ Computed con efectos secundarios (debe ser puro).

---

> **Automatización**: el pattern de "load + estado en signals" es candidato a un skill `signal-page-state` generado por [`pattern-skill-creator`](../skills/pattern-skill-creator.md).
