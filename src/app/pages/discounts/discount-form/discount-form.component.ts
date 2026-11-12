import { Component, computed, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import { Category, Subcategory } from '../../../shared/interfaces/product.interfaces';
import { Discount, DiscountPayload, DiscountScope } from '../../../shared/interfaces/discount.interfaces';

// La vigencia se maneja por días de México: el back guarda el inicio a las 00:00 y el fin a
// las 23:59:59 de la Ciudad de México. Para editar, se convierte de regreso a ese día.
const MEXICO_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' });
const toMexicoDay = (iso?: string | null): string => (iso ? MEXICO_DAY.format(new Date(iso)) : '');

interface SubcategoryOption {
    id: string;
    label: string;
}

/**
 * Alta y edición de un descuento. No llama a la API: emite lo capturado y la página guarda.
 */
@Component({
    selector: 'app-discount-form',
    standalone: true,
    imports: [CommonModule, FormsModule, ModalComponent],
    templateUrl: './discount-form.component.html'
})
export class DiscountFormComponent {
    isOpen = input(false);
    discount = input<Discount | null>(null); // null = nuevo
    categories = input<Category[]>([]);
    subcategories = input<Subcategory[]>([]);
    cap = input(30);
    saving = input(false);

    save = output<DiscountPayload>();
    close = output<void>();

    name = signal('');
    percent = signal<number | null>(null);
    scope = signal<DiscountScope>('all');
    categoryId = signal('');
    subcategoryId = signal('');
    startsAt = signal('');
    endsAt = signal('');
    submitted = signal(false);

    isEdit = computed(() => !!this.discount());

    // Mory repite nombres de subcategoría en varias categorías: se muestran con su categoría
    subcategoryOptions = computed<SubcategoryOption[]>(() => {
        const categoryNames = new Map(this.categories().map(c => [String(c._id ?? c.id), c.name]));
        return this.subcategories()
            .map(s => {
                const parent = s.categoryId;
                const parentName = typeof parent === 'object' && parent ? parent.name : categoryNames.get(String(parent));
                return { id: String(s._id ?? s.id), label: parentName ? `${parentName} › ${s.name}` : s.name };
            })
            .sort((a, b) => a.label.localeCompare(b.label, 'es'));
    });

    errors = computed(() => {
        const e: Record<string, string> = {};
        const percent = this.percent();
        if (!this.name().trim()) e['name'] = 'Ponle un nombre, por ejemplo "Buen Fin anillos"';
        if (percent === null || isNaN(percent) || percent <= 0) e['percent'] = 'El porcentaje debe ser mayor que 0';
        else if (percent > this.cap()) e['percent'] = `No puede pasar del tope de la organización (${this.cap()} %)`;
        if (this.scope() === 'category' && !this.categoryId()) e['categoryId'] = 'Elige la categoría';
        if (this.scope() === 'subcategory' && !this.subcategoryId()) e['subcategoryId'] = 'Elige la subcategoría';
        if (this.startsAt() && this.endsAt() && this.endsAt() < this.startsAt()) {
            e['endsAt'] = 'El último día no puede ser antes del primero';
        }
        return e;
    });

    constructor() {
        // Cada vez que se abre, se llena con el descuento a editar o se limpia
        effect(() => {
            if (!this.isOpen()) return;
            const d = this.discount();
            this.name.set(d?.name ?? '');
            this.percent.set(d?.percent ?? null);
            this.scope.set(d?.scope ?? 'all');
            this.categoryId.set(d?.categoryId?._id ?? '');
            this.subcategoryId.set(d?.subcategoryId?._id ?? '');
            this.startsAt.set(toMexicoDay(d?.startsAt));
            this.endsAt.set(toMexicoDay(d?.endsAt));
            this.submitted.set(false);
        });
    }

    onSubmit() {
        this.submitted.set(true);
        if (Object.keys(this.errors()).length > 0) return;

        const scope = this.scope();
        this.save.emit({
            name: this.name().trim(),
            percent: Number(this.percent()),
            scope,
            ...(scope === 'category' ? { categoryId: this.categoryId() } : {}),
            ...(scope === 'subcategory' ? { subcategoryId: this.subcategoryId() } : {}),
            // Vacío = sin límite; null le dice al back que borre la fecha al editar
            startsAt: this.startsAt() || null,
            endsAt: this.endsAt() || null
        });
    }
}
