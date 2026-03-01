---
name: brand-identity
description: >
  Guía completa de identidad visual de Bether Gold. Usar SIEMPRE que se creen
  nuevos módulos, componentes, páginas o cualquier elemento de UI en el proyecto
  front-bethergold. Define la paleta de colores oficial, tipografía, uso de logos
  y patrones de construcción de componentes Angular con TailwindCSS v4.
---

# Bether Gold — Guía de Identidad Visual

## 1. Principio Central

> **Elegancia atemporal con funcionalidad moderna.**
> Bether Gold es una plataforma de joyería de oro. Cada componente que construyas
> debe transmitir **premium, confianza y calidez dorada**. Evita colores fríos o
> estéticas genéricas. Usa las variables de diseño definidas aquí en lugar de
> colores hardcodeados.

---

## 2. Paleta de Colores Oficial

### 2.1 Colores de Marca (Gold — el corazón de la identidad)

| Token                    | Valor HEX  | Uso                                        |
|--------------------------|------------|--------------------------------------------|
| `--color-gold-primary`   | `#C69214`  | Color base dorado — fondos, íconos, bordes |
| `--color-gold-bright`    | `#FAC600`  | Acento brillante, hovers, highlights       |
| `--color-gold-gradient`  | `linear-gradient(135deg, #C69214, #FAC600)` | Isotipo, botones primarios, badges |
| `--color-gold-deep`      | `#9A6F0A`  | Texto sobre dorado, estados active         |
| `--color-gold-pale`      | `#FBF0C9`  | Fondos suaves, chips, badges light         |
| `--color-gold-muted`     | `#E8C97A`  | Separadores, bordes decorativos            |

### 2.2 Neutros de Marca

| Token                     | Valor HEX  | Uso                                           |
|---------------------------|------------|-----------------------------------------------|
| `--color-brand-black`     | `#191817`  | Texto principal, logo positivo, encabezados   |
| `--color-brand-charcoal`  | `#46424A`  | Texto secundario, logo isomagotipo, subtítulos|
| `--color-brand-warm-gray` | `#6B6560`  | Texto terciario, placeholders                 |

### 2.3 Fondos (Light / Dark)

| Token                         | Valor HEX  | Uso                                     |
|-------------------------------|------------|-----------------------------------------|
| `--color-bg-light`            | `#FFFDF7`  | Fondo principal en modo claro           |
| `--color-bg-surface-light`    | `#FFF8E7`  | Cards y superficies en modo claro       |
| `--color-bg-dark`             | `#3a383d`  | Fondo principal en modo oscuro          |
| `--color-bg-surface-dark`     | `#232126`  | Cards y superficies en modo oscuro      |
| `--color-border-light`        | `#E8D9A0`  | Bordes en modo claro (cálido)           |
| `--color-border-dark`         | `#4A474D`  | Bordes en modo oscuro (carbón)          |

### 2.4 Estados del Sistema

Usar los tokens existentes de `styles.css` para estados funcionales. Solo ajustar
para que combinen con la paleta cálida:

| Estado   | Color principal                   |
|----------|-----------------------------------|
| Éxito    | `--color-success-500` `#12b76a`   |
| Error    | `--color-error-500` `#f04438`     |
| Warning  | `--color-warning-500` `#f79009`   |
| Info     | `--color-gold-primary` `#C69214`  |

---

## 3. Tipografía

### 3.1 Fuentes Oficiales

El proyecto usa la familia **Instrument Sans** para toda la interfaz gráfica según la Guía de Identidad.

| Rol                               | Fuente            | Pesos                       | Uso                                            |
|-----------------------------------|-------------------|-----------------------------|------------------------------------------------|
| **Títulos y Headings**            | `Instrument Sans` | 700 (Bold)                  | Títulos principales, nombre de marca           |
| **Subtítulos y Headers Secundar** | `Instrument Sans` | 600 (SemiBold)              | Subtítulos de sección, headers de cards        |
| **Destacados en cuerpo**          | `Instrument Sans` | 500 (Medium)                | Etiquetas, inputs, valores importantes         |
| **Cuerpo / Textos Generales**     | `Instrument Sans` | 400 (Regular)               | Cuerpo de texto general, descripciones, tablas |
| **Mono**                          | `monospace`       | 400                         | Códigos, precios con formato exacto            |

*Nota: Se pueden usar las variantes en Italic para resaltar acciones y títulos especiales.*

### 3.2 Escala Tipográfica (tokens existentes en styles.css)

```css
/* Usar estas clases Tailwind */
text-title-2xl   /* 72px / 90px — solo para hero landing */
text-title-xl    /* 60px / 72px — secciones principales */
text-title-lg    /* 48px / 60px — encabezados de módulo */
text-title-md    /* 36px / 44px — encabezados de sección */
text-title-sm    /* 30px / 38px — subtítulos importantes */
text-theme-xl    /* 20px / 30px — encabezados de card */
/* body: text-base (16px) */
text-theme-sm    /* 14px / 20px — texto secundario, labels */
text-theme-xs    /* 12px / 18px — captions, metadata */
```

### 3.3 Jerarquía en Componentes

```html
<!-- Encabezado de módulo/página -->
<h1 class="font-instrument text-title-md font-semibold text-brand-black dark:text-white">
  Nombre del módulo
</h1>

<!-- Subtítulo de sección dentro de módulo -->
<h2 class="font-instrument text-title-sm font-medium text-brand-charcoal dark:text-gray-300">
  Sección
</h2>

<!-- Encabezado de card -->
<h3 class="font-instrument text-theme-xl font-semibold text-brand-black dark:text-white">
  Card title
</h3>

<!-- Cuerpo de texto -->
<p class="font-instrument text-base font-normal text-brand-charcoal dark:text-gray-400">
  Descripción...
</p>

<!-- Label / Metadata -->
<span class="font-instrument text-theme-sm font-medium text-brand-warm-gray dark:text-gray-500">
  Label
</span>
```

---

## 4. Logos y Assets

### 4.1 Estructura de Assets

Todos los logos están en:
```
front-bethergold/src/assets/Entregables/Identidad/
  ├── Imágenes SVG/           ← Preferir SVG siempre
  └── Imágenes PNG/           ← Usar cuando SVG no sea posible
```

### 4.2 Cuándo Usar Cada Variante

| Archivo                          | Fondo de uso                               |
|----------------------------------|--------------------------------------------|
| `BG_Isomagotipo Principal.svg`   | Fondo blanco / claro — versión full color  |
| `BG_Negativo Principal.svg`      | Fondo oscuro o de color — logo en blanco   |
| `BG_Calado Principal 1.svg`      | Fondo dorado — logo en `#C69214`           |
| `BG_Isotipo.svg`                 | Ícono solo (isotipo) — sidebar, favicon, badges |
| `BG_Isomagotipo Secundario.svg`  | Versión secundaria con variante de layout  |

### 4.3 Zona de Respeto

No colocar elementos a menos de **1/4 del alto del logo** en cualquier dirección.
El logo nunca debe aparecer deformado, rotado ni con filtros CSS `hue-rotate`.

### 4.4 Uso en Angular (HTML Templates)

```html
<!-- Sidebar (modo claro) -->
<img
  src="assets/Entregables/Identidad/Imágenes  SVG/BG_Isomagotipo Principal.svg"
  alt="Bether Gold"
  class="h-10 w-auto"
/>

<!-- Sidebar (modo oscuro) -->
<img
  src="assets/Entregables/Identidad/Imágenes  SVG/BG_Negativo Principal.svg"
  alt="Bether Gold"
  class="h-10 w-auto"
/>

<!-- Isotipo pequeño (ícono de módulo) -->
<img
  src="assets/Entregables/Identidad/Imágenes  SVG/BG_Isotipo.svg"
  alt="BG"
  class="size-8"
/>
```

---

## 5. Patrones Gráficos y Decorativos

Los elementos gráficos y patrones están en:
```
front-bethergold/src/assets/Entregables/Elementos graficos/
  ├── E1.png a E9.png
  └── Patrones Bether Gold... .jpg
```

**Reglas de Uso (según Guía de Marca):**
- Con la intención de reforzar la presencia de la marca, los elementos gráficos se ejecutan con variaciones del **isotipo**.
- Aplicar tratamiento de **degradados diluidos**.
- Jugar con las opacidades al fondo, a manera de patrones aleatorios (entre **20% al 40%**), o incluso más bajos en fondos principales.

Usar como:
- Fondos de sección hero/landing (`background-image`)
- Elementos decorativos en modales de bienvenida
- Cabeceras de reportes o cortes de caja impresos

```css
/* Ejemplo de uso como fondo sutil */
.hero-section {
  background-image: url('/assets/Entregables/Elementos graficos/Patrones Bether Gold_1920x 1080.jpg');
  background-size: cover;
  background-position: center;
  opacity: 0.08; /* Siempre aplicar sobre overlay semi-transparente */
}
```

---

## 6. Componentes Angular — Patrones de Construcción

### 6.1 Card de Módulo (patrón base)

```html
<div class="rounded-2xl border border-[#E8D9A0] bg-white p-6 shadow-theme-sm
            dark:border-[#4A474D] dark:bg-[#232126]">
  <!-- Header de card -->
  <div class="mb-4 flex items-center justify-between">
    <h3 class="font-instrument text-theme-xl font-semibold text-[#191817] dark:text-[#E8C97A]">
      Título
    </h3>
    <span class="rounded-full bg-[#FBF0C9] px-3 py-1 text-theme-xs font-medium
                 text-[#9A6F0A] dark:bg-[#3D3420] dark:text-[#E8C97A]">
      Badge
    </span>
  </div>
  <!-- Contenido -->
  <div class="text-[#46424A] dark:text-gray-400">
    Contenido del card
  </div>
</div>
```

### 6.2 Botón Primario (Gold)

```html
<!-- Botón primario — usar para acciones principales de módulo -->
<button class="flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#C69214] to-[#FAC600]
               px-5 py-2.5 font-instrument text-sm font-semibold text-[#191817] dark:text-white
               shadow-theme-sm transition-all
               hover:from-[#9A6F0A] hover:to-[#C69214] hover:shadow-theme-md
               active:scale-[0.98]
               disabled:cursor-not-allowed disabled:opacity-50">
  <svg class="size-4"><!-- ícono --></svg>
  Acción Principal
</button>

<!-- Botón secundario (blanco / dark surface) -->
<button class="flex items-center gap-2 rounded-xl border border-[#E8D9A0] bg-white
               px-5 py-2.5 font-instrument text-sm font-semibold text-[#191817] shadow-theme-sm
               transition-all hover:bg-[#FBF0C9]
               dark:border-[#4A474D] dark:bg-[#3a383d] dark:text-white dark:hover:bg-white/5">
  Acción Secundaria
</button>

<!-- Botón terciario (outline gold) -->
<button class="flex items-center gap-2 rounded-xl border border-[#C69214] bg-transparent
               px-5 py-2.5 font-instrument text-sm font-semibold text-[#C69214]
               transition-all hover:bg-[#FBF0C9]
               dark:hover:bg-[#3D3420]">
  Acción Terciaria
</button>

<!-- Botón ghost / texto -->
<button class="flex items-center gap-2 rounded-xl px-5 py-2.5 font-instrument text-sm
               font-medium text-[#46424A] transition-all hover:bg-gray-100
               dark:text-gray-400 dark:hover:bg-white/5">
  Acción Texto
</button>
```

### 6.3 Input / Campo de Formulario

```html
<div class="flex flex-col gap-1.5">
  <label class="font-instrument text-theme-sm font-medium text-[#46424A] dark:text-gray-300">
    Etiqueta del campo
  </label>
  <input
    type="text"
    placeholder="Placeholder..."
    class="w-full rounded-xl border border-[#E8D9A0] bg-white px-4 py-2.5
           font-instrument text-base text-[#191817] placeholder-[#6B6560]
           outline-none transition-all
           focus:border-[#C69214] focus:ring-2 focus:ring-[#C69214]/20
           dark:border-[#4A474D] dark:bg-[#3a383d] dark:text-white
           dark:placeholder-gray-600 dark:focus:border-[#FAC600]"
  />
  <!-- Mensaje de error -->
  <span class="text-theme-xs text-error-500">Mensaje de error</span>
</div>
```

### 6.4 Tabla de Datos

```html
<div class="overflow-hidden rounded-2xl border border-[#E8D9A0] dark:border-[#4A474D]">
  <table class="w-full">
    <thead class="bg-[#FBF0C9] dark:bg-[#232126]">
      <tr>
        <th class="px-4 py-3 text-left font-instrument text-theme-xs font-semibold
                   uppercase tracking-wider text-[#9A6F0A] dark:text-[#E8C97A]">
          Columna
        </th>
      </tr>
    </thead>
    <tbody class="divide-y divide-[#E8D9A0] bg-white dark:divide-[#3D3420] dark:bg-[#3a383d]">
      <tr class="transition-colors hover:bg-[#FBF0C9]/40 dark:hover:bg-[#252017]">
        <td class="px-4 py-3 font-instrument text-theme-sm text-[#46424A] dark:text-gray-300">
          Valor
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### 6.5 Badge / Status Chip

```html
<!-- Estado: Activo / Éxito -->
<span class="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-0.5
             text-theme-xs font-medium text-success-700
             dark:bg-success-500/15 dark:text-success-400">
  <span class="size-1.5 rounded-full bg-success-500"></span>
  Activo
</span>

<!-- Estado: Pendiente / Gold -->
<span class="inline-flex items-center gap-1.5 rounded-full bg-[#FBF0C9] px-2.5 py-0.5
             text-theme-xs font-medium text-[#9A6F0A]
             dark:bg-[#3D3420] dark:text-[#E8C97A]">
  <span class="size-1.5 rounded-full bg-[#C69214]"></span>
  Pendiente
</span>

<!-- Estado: Inactivo / Error -->
<span class="inline-flex items-center gap-1.5 rounded-full bg-error-50 px-2.5 py-0.5
             text-theme-xs font-medium text-error-700
             dark:bg-error-500/15 dark:text-error-400">
  <span class="size-1.5 rounded-full bg-error-500"></span>
  Inactivo
</span>
```

### 6.6 Encabezado de Página / Módulo

```html
<div class="mb-6 flex items-center justify-between">
  <div>
    <h1 class="font-instrument text-title-sm font-semibold text-[#191817] dark:text-white">
      Nombre del Módulo
    </h1>
    <p class="mt-1 font-instrument text-theme-sm text-[#6B6560] dark:text-gray-500">
      Descripción breve del módulo o breadcrumb
    </p>
  </div>
  <!-- Acción principal del módulo -->
  <button class="flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#C69214] to-[#FAC600]
                 px-5 py-2.5 font-instrument text-sm font-semibold text-[#191817] shadow-theme-sm
                 transition-all hover:shadow-theme-md active:scale-[0.98]">
    + Nuevo elemento
  </button>
</div>
```

---

## 7. Variables CSS — Agregar a `styles.css`

Cuando se actualice el `@theme` de `styles.css`, incluir estas variables:

```css
@theme {
  /* ... variables existentes ... */

  /* === BETHER GOLD BRAND COLORS === */
  --color-gold-primary: #C69214;
  --color-gold-bright:  #FAC600;
  --color-gold-deep:    #9A6F0A;
  --color-gold-pale:    #FBF0C9;
  --color-gold-muted:   #E8C97A;

  --color-brand-black:     #191817;
  --color-brand-charcoal:  #46424A;
  --color-brand-warm-gray: #6B6560;

  /* Light mode backgrounds */
  --color-bg-brand-light:         #FFFDF7;
  --color-bg-brand-surface-light: #FFF8E7;
  --color-border-brand-light:     #E8D9A0;

  /* Dark mode backgrounds */
  --color-bg-brand-dark:          #232126;
  --color-bg-brand-surface-dark:  #3a383d;
  --color-border-brand-dark:      #4A474D;
}
```

> ⚠️ **Importante**: Hasta que estas variables estén agregadas en `styles.css`,
> usar los valores HEX directamente entre corchetes en las clases Tailwind:
> `text-[#C69214]`, `bg-[#FBF0C9]`, `border-[#E8D9A0]`

---

## 8. Do's and Don'ts

### ✅ Hacer

- Usar el gradiente dorado `from-[#C69214] to-[#FAC600]` en botones primarios
- Mantener fondos cálidos (`#FFFDF7` claro, `#3a383d` oscuro) — nunca fondos fríos puros
- Usar `font-instrument` para títulos y texto funcional
- Aplicar `rounded-xl` (12px) o `rounded-2xl` (16px) en cards y botones — nunca ángulos rectos
- Incluir soporte dark mode en CADA componente creado
- Usar el isotipo SVG para indicadores, loaders o vacíos de estado

### ❌ No hacer

- Usar `--color-primary: #1152d4` (azul base del template) en elementos de marca
- Aplicar `rounded-none` o `rounded-sm` en componentes principales
- Usar fondos completamente blancos sin tono cálido en modo claro
- Hardcodear colores fuera de este sistema (ej: `text-yellow-500` en vez de `text-[#C69214]`)
- Reutilizar logos de versión incorrecta sobre el fondo equivocado (ver sección 4.2)
- Usar `color: gold` o `color: goldenrod` del sistema — solo los HEX definidos aquí

---

## 9. Checklist al Crear un Nuevo Módulo

Antes de considerar un componente/módulo terminado, verificar:

- [ ] ¿Usa la paleta dorada para acción primaria?
- [ ] ¿Tiene soporte dark mode completo?
- [ ] ¿Los bordes y fondos son cálidos (no fríos / azulados)?
- [ ] ¿La tipografía usa Instrument Sans para títulos y cuerpo de texto?
- [ ] ¿Los bordes-radius son `xl` o `2xl`?
- [ ] ¿El logo / isotipo aparece en la versión correcta según el fondo?
- [ ] ¿Los estados (éxito, error, pendiente) usan los tokens de color correctos?
- [ ] ¿Los inputs tienen `focus:border-[#C69214]` y ring dorado?
