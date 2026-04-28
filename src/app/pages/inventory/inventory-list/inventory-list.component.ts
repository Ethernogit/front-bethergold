import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { InventoryService } from '../../../shared/services/inventory.service';
import { ProductService, Product, StockHistoryEntry } from '../../../shared/services/product.service';
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
    private productService = inject(ProductService);
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
            },
            {
                key: 'jewelryDetails.karatage',
                label: 'Kilataje',
                type: 'select',
                options: [
                    { value: '10K', label: '10K' },
                    { value: '14K', label: '14K' },
                    { value: '18K', label: '18K' },
                    { value: '24K', label: '24K' }
                ],
                placeholder: 'Seleccione Kilataje'
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

    // Stock History Modal
    showHistoryModal = signal(false);
    historyProduct = signal<Product | null>(null);
    historyEntries = signal<StockHistoryEntry[]>([]);
    historyLoading = signal(false);

    openStockHistory(product: Product) {
        if (!product._id) return;
        this.historyProduct.set(product);
        this.historyEntries.set([]);
        this.showHistoryModal.set(true);
        this.historyLoading.set(true);
        this.productService.getStockHistory(product._id)
            .pipe(finalize(() => this.historyLoading.set(false)))
            .subscribe({
                next: (res: any) => this.historyEntries.set(res.data?.history || []),
                error: () => this.toastService.error('Error al cargar historial de stock')
            });
    }

    closeHistoryModal() {
        this.showHistoryModal.set(false);
        this.historyProduct.set(null);
        this.historyEntries.set([]);
    }

    getHistoryTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            sale: 'Vendido', reservation: 'Apartado',
            cancel_restore: 'Cancelado · Stock repuesto',
            consignment_settle: 'Liquidación consignación',
            manual_adjustment: 'Ajuste manual'
        };
        return labels[type] || type;
    }

    getHistoryIconClasses(type: string): Record<string, boolean> {
        return {
            'bg-success-50 border-success-300 text-success-600 dark:bg-success-500/15 dark:border-success-500/40 dark:text-success-400': type === 'sale',
            'bg-[#FBF0C9] border-[#E8C97A] text-[#9A6F0A] dark:bg-[#4A474D] dark:border-[#C69214] dark:text-[#E8C97A]': type === 'reservation',
            'bg-blue-50 border-blue-300 text-blue-600 dark:bg-blue-500/15 dark:border-blue-500/40 dark:text-blue-400': type === 'cancel_restore',
            'bg-purple-50 border-purple-300 text-purple-600 dark:bg-purple-500/15 dark:border-purple-500/40 dark:text-purple-400': type === 'consignment_settle',
            'bg-gray-100 border-gray-300 text-gray-600 dark:bg-gray-500/15 dark:border-gray-500/40 dark:text-gray-400': type === 'manual_adjustment',
        };
    }

    getHistoryCardClasses(type: string): Record<string, boolean> {
        return {
            'border-success-200 dark:border-success-500/20': type === 'sale',
            'border-[#E8D9A0] dark:border-[#4A474D]': type === 'reservation',
            'border-blue-200 dark:border-blue-500/20': type === 'cancel_restore',
            'border-purple-200 dark:border-purple-500/20': type === 'consignment_settle',
            'border-gray-200 dark:border-gray-500/20': type === 'manual_adjustment',
        };
    }

    getHistoryBadgeClasses(type: string): Record<string, boolean> {
        return {
            'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400': type === 'sale',
            'bg-[#FBF0C9] text-[#9A6F0A] dark:bg-[#4A474D] dark:text-[#E8C97A]': type === 'reservation',
            'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400': type === 'cancel_restore',
            'bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400': type === 'consignment_settle',
            'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400': type === 'manual_adjustment',
        };
    }

    getHistorySellerName(entry: StockHistoryEntry): string {
        if (!entry.userId) return '-';
        if (typeof entry.userId === 'object' && entry.userId.profile) {
            const p = entry.userId.profile;
            return `${p.firstName || ''} ${p.lastName || ''}`.trim() || '-';
        }
        return '-';
    }

    getHistoryClientName(entry: StockHistoryEntry): string {
        if (!entry.clientId) return '-';
        if (typeof entry.clientId === 'object' && entry.clientId.name) return entry.clientId.name;
        return '-';
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
