import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { DiscountService } from '../../../shared/services/discount.service';
import { CategoryService } from '../../../shared/services/category.service';
import { SubcategoryService } from '../../../shared/services/subcategory.service';
import { PermissionService } from '../../../shared/services/auth/permission.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import { DiscountFormComponent } from '../discount-form/discount-form.component';
import { Category, ProductStatus, Subcategory } from '../../../shared/interfaces/product.interfaces';
import {
    CombineMode,
    Discount,
    DiscountEffectiveStatus,
    DiscountPayload,
    DiscountSettings
} from '../../../shared/interfaces/discount.interfaces';

// Cómo se explica cada forma en pantalla. El ejemplo es fijo (no se calcula aquí: el cálculo
// vive solo en el back): una pieza de $10,000 con toda la tienda al 10 % y Anillos al 15 %.
export const COMBINE_MODE_OPTIONS: { value: CombineMode; label: string; help: string }[] = [
    { value: 'chained', label: 'Encadenado', help: 'Cada descuento se aplica sobre lo que dejó el anterior. Ejemplo: $10,000 − 10 % − 15 % = $7,650 (23.5 %).' },
    { value: 'summed', label: 'Sumado', help: 'Los porcentajes se suman y se rebaja una vez. Ejemplo: 10 % + 15 % = 25 % → $7,500.' },
    { value: 'highest', label: 'El mayor', help: 'Solo cuenta el descuento más alto. Ejemplo: gana Anillos 15 % → $8,500.' },
    { value: 'most_specific', label: 'El más específico', help: 'Gana el del nivel más angosto: subcategoría, luego categoría, luego toda la tienda. Ejemplo: gana Anillos 15 % → $8,500.' }
];

const STATUS_LABELS: Record<DiscountEffectiveStatus, string> = {
    active: 'Vigente',
    scheduled: 'Programado',
    expired: 'Vencido',
    inactive: 'Apagado'
};

@Component({
    selector: 'app-discount-list',
    standalone: true,
    imports: [CommonModule, FormsModule, ModalComponent, DiscountFormComponent],
    templateUrl: './discount-list.component.html',
    styles: [`:host { display: flex; flex-direction: column; height: 100%; }`]
})
export class DiscountListComponent implements OnInit {
    private discountService = inject(DiscountService);
    private categoryService = inject(CategoryService);
    private subcategoryService = inject(SubcategoryService);
    private toastService = inject(ToastService);
    readonly permissionService = inject(PermissionService);

    readonly combineModes = COMBINE_MODE_OPTIONS;

    discounts = signal<Discount[]>([]);
    loading = signal(false);
    term = signal('');
    statusFilter = signal<'' | 'active' | 'inactive'>('');
    currentPage = signal(1);
    totalPages = signal(0);
    totalItems = signal(0);

    // Configuración de la organización y lo que se está editando en pantalla
    settings = signal<DiscountSettings | null>(null);
    capDraft = signal<number | null>(null);
    modeDraft = signal<CombineMode>('chained');
    savingSettings = signal(false);
    settingsChanged = computed(() => {
        const s = this.settings();
        return !!s && (Number(this.capDraft()) !== s.cap || this.modeDraft() !== s.combineMode);
    });
    modeHelp = computed(() => this.combineModes.find(m => m.value === this.modeDraft())?.help ?? '');

    categories = signal<Category[]>([]);
    subcategories = signal<Subcategory[]>([]);

    formOpen = signal(false);
    editing = signal<Discount | null>(null);
    saving = signal(false);
    toDelete = signal<Discount | null>(null);
    deleting = signal(false);
    togglingId = signal<string | null>(null);

    canUpdate = computed(() => this.permissionService.hasPermission('discounts:update'));

    ngOnInit(): void {
        this.loadSettings();
        this.loadDiscounts();
        this.categoryService.getCategories({ status: ProductStatus.ACTIVE }).subscribe({
            next: (res) => this.categories.set(res.data ?? []),
            error: () => this.toastService.error('No se pudieron cargar las categorías')
        });
        this.subcategoryService.getSubcategories({ status: ProductStatus.ACTIVE }).subscribe({
            next: (res) => this.subcategories.set(res.data ?? []),
            error: () => this.toastService.error('No se pudieron cargar las subcategorías')
        });
    }

    loadSettings() {
        this.discountService.getSettings().subscribe({
            next: (res) => this.applySettings(res.data.settings),
            error: (err) => this.toastService.error(this.apiMessage(err, 'No se pudo cargar la configuración'))
        });
    }

    loadDiscounts() {
        this.loading.set(true);
        this.discountService.getDiscounts({
            term: this.term().trim() || undefined,
            status: this.statusFilter() || undefined,
            page: this.currentPage(),
            limit: 20
        })
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res) => {
                    this.discounts.set(res.data.discounts);
                    this.totalPages.set(res.data.pagination.totalPages);
                    this.totalItems.set(res.data.pagination.totalItems);
                },
                error: (err) => this.toastService.error(this.apiMessage(err, 'Error al cargar los descuentos'))
            });
    }

    onSearch() {
        this.currentPage.set(1);
        this.loadDiscounts();
    }

    onPageChange(page: number) {
        this.currentPage.set(page);
        this.loadDiscounts();
    }

    saveSettings() {
        const cap = Number(this.capDraft());
        if (isNaN(cap) || cap < 0 || cap > 100) {
            this.toastService.error('El tope debe ser un porcentaje entre 0 y 100');
            return;
        }
        this.savingSettings.set(true);
        this.discountService.updateSettings({ cap, combineMode: this.modeDraft() })
            .pipe(finalize(() => this.savingSettings.set(false)))
            .subscribe({
                next: (res) => {
                    this.applySettings(res.data.settings);
                    this.toastService.success('Configuración guardada');
                },
                error: (err) => this.toastService.error(this.apiMessage(err, 'No se pudo guardar la configuración'))
            });
    }

    resetSettings() {
        const s = this.settings();
        if (s) this.applySettings(s);
    }

    openNew() {
        this.editing.set(null);
        this.formOpen.set(true);
    }

    openEdit(discount: Discount) {
        this.editing.set(discount);
        this.formOpen.set(true);
    }

    onSave(payload: DiscountPayload) {
        const editing = this.editing();
        const request = editing
            ? this.discountService.updateDiscount(editing._id, payload)
            : this.discountService.createDiscount(payload);

        this.saving.set(true);
        request.pipe(finalize(() => this.saving.set(false))).subscribe({
            next: () => {
                this.toastService.success(editing ? 'Descuento actualizado' : 'Descuento creado');
                this.formOpen.set(false);
                this.loadDiscounts();
            },
            error: (err) => this.toastService.error(this.apiMessage(err, 'No se pudo guardar el descuento'), 5000)
        });
    }

    toggle(discount: Discount) {
        this.togglingId.set(discount._id);
        this.discountService.setStatus(discount._id, !discount.isActive)
            .pipe(finalize(() => this.togglingId.set(null)))
            .subscribe({
                next: (res) => {
                    const updated = res.data.discount;
                    this.discounts.update(list => list.map(d => (d._id === updated._id ? updated : d)));
                    this.toastService.success(updated.isActive ? 'Descuento prendido' : 'Descuento apagado');
                },
                error: (err) => this.toastService.error(this.apiMessage(err, 'No se pudo cambiar el descuento'))
            });
    }

    confirmDelete() {
        const discount = this.toDelete();
        if (!discount) return;
        this.deleting.set(true);
        this.discountService.deleteDiscount(discount._id)
            .pipe(finalize(() => this.deleting.set(false)))
            .subscribe({
                next: () => {
                    this.toastService.success('Descuento borrado');
                    this.toDelete.set(null);
                    this.loadDiscounts();
                },
                error: (err) => this.toastService.error(this.apiMessage(err, 'No se pudo borrar el descuento'))
            });
    }

    scopeLabel(d: Discount): string {
        if (d.scope === 'category') return d.categoryId?.name ?? 'Categoría';
        if (d.scope === 'subcategory') {
            const parent = d.subcategoryId?.categoryId?.name;
            const name = d.subcategoryId?.name ?? 'Subcategoría';
            return parent ? `${parent} › ${name}` : name;
        }
        return 'Toda la tienda';
    }

    statusLabel(status: DiscountEffectiveStatus): string {
        return STATUS_LABELS[status] ?? status;
    }

    scopeKind(d: Discount): string {
        return d.scope === 'category' ? 'Categoría' : d.scope === 'subcategory' ? 'Subcategoría' : 'Tienda';
    }

    private applySettings(settings: DiscountSettings) {
        this.settings.set(settings);
        this.capDraft.set(settings.cap);
        this.modeDraft.set(settings.combineMode);
    }

    // El back manda { error: { message, details } }; los de validación traen el detalle por campo
    private apiMessage(err: HttpErrorResponse, fallback: string): string {
        const body = err?.error;
        return body?.error?.details?.[0]?.msg || body?.error?.message || body?.message || fallback;
    }
}
