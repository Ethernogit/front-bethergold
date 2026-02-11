import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { InventoryService } from '../../../shared/services/inventory.service';
import { Product } from '../../../shared/services/product.service';
import { ToastService } from '../../../shared/services/toast.service';
import { finalize } from 'rxjs';
import { CategoryService } from '../../../shared/services/category.service';
import { SubcategoryService } from '../../../shared/services/subcategory.service';
import { FilterSidebarComponent, FilterConfig } from '../../../shared/components/ui/filter-sidebar/filter-sidebar.component';
import { ProductStatus } from '../../../shared/interfaces/product.interfaces';

import { InventorySummaryModalComponent } from '../inventory-summary-modal/inventory-summary-modal.component';
import { TourService } from '../../../shared/services/tour.service';

@Component({
    selector: 'app-inventory-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        FilterSidebarComponent,
        InventorySummaryModalComponent
    ],
    templateUrl: './inventory-list.component.html'
})
export class InventoryListComponent implements OnInit {
    private inventoryService = inject(InventoryService);
    private toastService = inject(ToastService);
    private categoryService = inject(CategoryService);
    private subcategoryService = inject(SubcategoryService);
    private tourService = inject(TourService);
    private fb = inject(FormBuilder);

    startTour() {
        this.tourService.startInventoryTour();
    }

    // Signals
    products = signal<Product[]>([]);
    loading = signal(false);

    // Filter Sidebar State
    showFilters = signal(false);
    filterConfig = signal<FilterConfig[]>([]);
    activeFilters = signal<any>({});
    private lastSelectedCategoryId: string = '';

    // Pagination
    currentPage = signal(1);
    itemsPerPage = signal(10);
    totalItems = signal(0);
    totalPages = signal(0);

    searchForm: FormGroup;

    constructor() {
        this.searchForm = this.fb.group({
            search: ['']
        });
    }

    ngOnInit() {
        this.loadInventory();
        this.initFilterConfig();
    }

    initFilterConfig() {
        const baseConfig: FilterConfig[] = [
            {
                key: 'category',
                label: 'Categoría',
                type: 'select',
                options: [],
                placeholder: 'Seleccione Categoría'
            },
            {
                key: 'subcategory',
                label: 'Subcategoría',
                type: 'select',
                options: [],
                placeholder: 'Seleccione Subcategoría'
            },
            {
                key: 'status',
                label: 'Estado',
                type: 'select',
                options: [
                    { value: 'all', label: 'Todos' },
                    { value: 'available', label: 'Disponible' },
                    { value: 'apartado', label: 'Apartado' },
                    { value: 'reviewed', label: 'Revisado' },
                    { value: 'missing', label: 'No Revisado' }
                ],
                placeholder: 'Seleccione Estado'
            }
        ];
        this.filterConfig.set(baseConfig);

        // Load Categories
        this.categoryService.getCategories({ status: ProductStatus.ACTIVE }).subscribe({
            next: (res: any) => {
                const categories = res.data || res || [];
                const categoryOptions = categories.map((c: any) => ({ value: c._id, label: c.name }));
                this.updateFilterConfig('category', categoryOptions);
            }
        });
    }

    updateFilterConfig(key: string, options: any[]) {
        this.filterConfig.update(current => {
            return current.map(c => {
                if (c.key === key) {
                    return { ...c, options };
                }
                return c;
            });
        });
    }

    onFilterChange(values: any) {
        const categoryId = values['category'];

        if (categoryId !== this.lastSelectedCategoryId) {
            this.lastSelectedCategoryId = categoryId;

            if (categoryId) {
                this.subcategoryService.getSubcategoriesByCategory(categoryId).subscribe({
                    next: (res: any) => {
                        const subcategories = res.data || res || [];
                        const subOptions = subcategories.map((s: any) => ({ value: s._id, label: s.name }));
                        this.updateFilterConfig('subcategory', subOptions);
                    },
                    error: () => {
                        this.updateFilterConfig('subcategory', []);
                    }
                });
            } else {
                this.updateFilterConfig('subcategory', []);
            }
        }
    }

    openFilters() {
        this.showFilters.set(true);
    }

    closeFilters() {
        this.showFilters.set(false);
    }

    applyFilters(filters: any) {
        this.activeFilters.set(filters);
        this.currentPage.set(1);
        this.loadInventory();
    }

    loadInventory() {
        this.loading.set(true);
        const params: any = {
            limit: this.itemsPerPage(),
            skip: (this.currentPage() - 1) * this.itemsPerPage(),
            status: 'active', // Filter only active products
            ...this.activeFilters()
        };
        const searchValue = this.searchForm.get('search')?.value;
        if (searchValue) params.search = searchValue;

        this.inventoryService.getInventory(params)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res: any) => {
                    const products = res.data || res;
                    this.products.set(products);

                    if (res.pagination) {
                        this.totalItems.set(res.pagination.total);
                        this.totalPages.set(res.pagination.pages);
                    }
                },
                error: (err) => {
                    console.error('Error loading inventory', err);
                    this.toastService.error('Error al cargar inventario');
                }
            });
    }

    onPageChange(page: number) {
        this.currentPage.set(page);
        this.loadInventory();
    }

    onLimitChange(limit: any) {
        this.itemsPerPage.set(Number(limit));
        this.currentPage.set(1);
        this.loadInventory();
    }

    onSearch() {
        const searchValue = this.searchForm.get('search')?.value;
        if (!searchValue) return; // Don't search empty

        if (this.scanMode()) {
            // Scanner Mode Logic
            this.inventoryService.reviewByCode(searchValue)
                .subscribe({
                    next: (res: any) => {
                        this.toastService.success(`Producto revisado: ${res.data.name}`);
                        this.searchForm.reset();
                        // Keep focus on input (it usually stays, but good to know standard behavior)

                        // Optimistically update list if the product is visible
                        const product = this.products().find(p => p._id === res.data._id);
                        if (product) {
                            product.lastInventoryRevision = new Date();
                        }
                    },
                    error: (err) => {
                        console.error('Error scanning code', err);
                        this.toastService.error(err.error?.message || 'Error al escanear código');
                        this.searchForm.reset(); // Reset to try again? User might want to see what they typed. 
                        // Actually, better to KEEP the wrong code so user sees what happened, or clear it if they scan fast.
                        // Standard POS behavior: Error beep -> user looks -> clears. 
                        // But for "rapid scanner", clearing might be better to avoid blocking next scan.
                        // Let's clear for now as requested "se borre el codigo".
                    }
                });
        } else {
            // Standard Search Logic
            this.currentPage.set(1);
            this.loadInventory();
        }
    }

    scanMode = signal(false);

    toggleScanMode() {
        this.scanMode.update(v => !v);
        // Focus input after toggle?
        // Ideally yes, but need ViewChild for input. 
    }

    showSummaryModal = signal(false);
    summaryFilters = signal<any>({});

    openSummary() {
        const filters = { ...this.activeFilters() };
        const searchValue = this.searchForm.get('search')?.value;
        if (searchValue) {
            filters['search'] = searchValue;
        }
        this.summaryFilters.set(filters);
        this.showSummaryModal.set(true);
    }

    closeSummary() {
        this.showSummaryModal.set(false);
    }

    getCategoryName(product: Product): string {
        if (!product.category) return '';
        if (typeof product.category === 'object' && 'name' in product.category) {
            return (product.category as any).name;
        }
        return product.category as string;
    }

    getSubcategoryName(product: Product): string {
        if (!product.subcategory) return '';
        if (typeof product.subcategory === 'object' && 'name' in product.subcategory) {
            return (product.subcategory as any).name;
        }
        return product.subcategory as string;
    }

    toggleReview(product: Product, event: Event) {
        // Cast event target to input to get checked state, although assuming event is sufficient might be risky with custom components,
        // but for standard checkbox/switch input it works.
        const input = event.target as HTMLInputElement;
        const newStatus = input.checked;

        // Optimistic update? Or wait? Let's wait to ensure consistency or revert on error.
        // For better UX, let's keep it optimistic but handle error.

        this.inventoryService.toggleReviewStatus(product._id!, newStatus)
            .subscribe({
                next: (res: any) => {
                    // Update local state with the response data
                    if (res && res.data && res.data.lastInventoryRevision !== undefined) {
                        product.lastInventoryRevision = res.data.lastInventoryRevision;
                    } else {
                        // Fallback if response doesn't contain the updated field (though it should)
                        product.lastInventoryRevision = newStatus ? new Date() : undefined;
                    }
                    this.toastService.success(`Producto ${newStatus ? 'marcado como revisado' : 'marcado como no revisado'}`);
                },
                error: (err: any) => {
                    console.error('Error toggling review', err);
                    this.toastService.error('Error al actualizar estado de revisión');
                    // Revert check on error
                    input.checked = !newStatus;
                    // Also revert the model if we had optimistically updated it (we didn't yet, but good to be safe)
                }
            });
    }
}
