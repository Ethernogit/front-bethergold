import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
        this.loadActiveCount();
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

                    // Los contadores se restauran desde la sesión de conteo (servidor),
                    // no desde el stock vivo — así una venta no altera lo ya registrado.
                    // Ver loadActiveCount().

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

                        const product = this.products().find(p => p._id === res.data._id);
                        if (product) {
                            if (!product.isUnique) {
                                this.incrementCount(product);
                            } else {
                                product.lastInventoryRevision = new Date();
                            }
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
    }

    // --- Conteo físico (session-only, no altera stock real) ---
    stockCounters = signal<Map<string, number>>(new Map());

    getCount(productId: string): number {
        return this.stockCounters().get(productId) ?? 0;
    }

    // Stock disponible + unidades apartadas = total físico en la joyería
    getPhysicalStock(product: Product): number {
        const reserved = (!product.isUnique && product.reservation?.reservedQty) ? product.reservation.reservedQty : 0;
        return product.stock + reserved;
    }

    // Base del conteo: el stock capturado al momento de contar (snapshot durable).
    // Si aún no se ha contado, usa el stock físico vivo como referencia.
    getCountTarget(product: Product): number {
        if (!product._id) return this.getPhysicalStock(product);
        const t = this.countTargets().get(product._id);
        return t !== undefined ? t : this.getPhysicalStock(product);
    }

    // Unidades que se contaron y luego se vendieron durante el conteo.
    getSoldDuringCount(product: Product): number {
        if (!product._id) return 0;
        const t = this.countTargets().get(product._id);
        if (t === undefined) return 0;
        return Math.max(0, t - this.getPhysicalStock(product));
    }

    private persistCount(product: Product, newCount: number) {
        if (!this.hasActiveCount()) {
            this.toastService.error('Inicia un conteo antes de registrar cantidades');
            return;
        }
        const map = new Map(this.stockCounters());
        map.set(product._id!, newCount);
        this.stockCounters.set(map);

        this.inventoryService.recordCount(product._id!, newCount).subscribe({
            next: (res: any) => {
                const entry = res?.data?.entry;
                if (entry) {
                    const targets = new Map(this.countTargets());
                    targets.set(product._id!, entry.stockAtCount);
                    this.countTargets.set(targets);
                }
                if (res?.data?.product?.lastInventoryRevision !== undefined) {
                    product.lastInventoryRevision = res.data.product.lastInventoryRevision;
                }
                this.refreshCountStats();
            },
            error: () => {
                this.toastService.error('Error al registrar el conteo');
                this.loadActiveCount(); // resincroniza con el servidor
            }
        });
    }

    incrementCount(product: Product) {
        const current = this.getCount(product._id!);
        if (current >= this.getCountTarget(product)) return;
        this.persistCount(product, current + 1);
    }

    decrementCount(product: Product) {
        const current = this.getCount(product._id!);
        if (current <= 0) return;
        this.persistCount(product, current - 1);
    }

    getCounterState(product: Product): 'empty' | 'partial' | 'complete' | 'over' {
        if (!product._id) return 'empty';
        const count = this.getCount(product._id);
        const total = this.getCountTarget(product);
        if (count === 0) return product.lastInventoryRevision ? 'complete' : 'empty';
        if (count < total) return 'partial';
        if (count === total) return 'complete';
        return 'over';
    }

    // --- Sesión de conteo (versionado durable) ---
    activeCount = signal<any>(null);
    countStats = signal<any>(null);
    countTargets = signal<Map<string, number>>(new Map());
    hasActiveCount = computed(() => !!this.activeCount());

    loadActiveCount() {
        this.inventoryService.getActiveCount().subscribe({
            next: (res: any) => {
                const session = res?.data?.session ?? null;
                this.activeCount.set(session);
                this.countStats.set(res?.data?.stats ?? null);

                const counters = new Map<string, number>();
                const targets = new Map<string, number>();
                (session?.entries || []).forEach((e: any) => {
                    const pid = (typeof e.productId === 'object' ? e.productId?._id : e.productId)?.toString();
                    if (pid) {
                        counters.set(pid, e.countedQty);
                        targets.set(pid, e.stockAtCount);
                    }
                });
                this.stockCounters.set(counters);
                this.countTargets.set(targets);
            },
            error: () => { /* sin sesión activa: silencioso */ }
        });
    }

    private refreshCountStats() {
        this.inventoryService.getActiveCount().subscribe({
            next: (res: any) => {
                this.countStats.set(res?.data?.stats ?? null);
                if (res?.data?.session) this.activeCount.set(res.data.session);
            },
            error: () => { }
        });
    }

    // Iniciar conteo (reemplaza el antiguo "reiniciar").
    showResetModal = signal(false);
    resetting = signal(false);

    openResetModal() { this.showResetModal.set(true); }
    closeResetModal() { this.showResetModal.set(false); }

    confirmReset() {
        this.resetting.set(true);
        this.inventoryService.startCount()
            .pipe(finalize(() => this.resetting.set(false)))
            .subscribe({
                next: (res: any) => {
                    this.closeResetModal();
                    this.stockCounters.set(new Map());
                    this.countTargets.set(new Map());
                    this.activeCount.set(res?.data ?? null);
                    this.toastService.success('Conteo de inventario iniciado');
                    this.loadInventory();
                    this.refreshCountStats();
                },
                error: () => {
                    this.toastService.error('Error al iniciar el conteo');
                }
            });
    }

    // Cerrar y guardar conteo (genera archivo/s por categoría).
    showCloseModal = signal(false);
    closingCount = signal(false);
    closeFormatXlsx = signal(true);
    closeFormatPdf = signal(true);

    openCloseModal() { this.showCloseModal.set(true); }
    closeCloseModal() { this.showCloseModal.set(false); }

    confirmCloseCount() {
        const formats: Array<'xlsx' | 'pdf'> = [];
        if (this.closeFormatXlsx()) formats.push('xlsx');
        if (this.closeFormatPdf()) formats.push('pdf');
        if (!formats.length) {
            this.toastService.error('Selecciona al menos un formato');
            return;
        }
        this.closingCount.set(true);
        this.inventoryService.closeCount(formats)
            .pipe(finalize(() => this.closingCount.set(false)))
            .subscribe({
                next: (res: any) => {
                    this.closeCloseModal();
                    const session = res?.data;
                    (session?.files || []).forEach((f: any) => this.downloadVersion(session._id, f.format));
                    this.activeCount.set(null);
                    this.countStats.set(null);
                    this.stockCounters.set(new Map());
                    this.countTargets.set(new Map());
                    this.toastService.success('Conteo cerrado y guardado');
                    this.loadInventory();
                },
                error: () => {
                    this.toastService.error('Error al cerrar el conteo');
                }
            });
    }

    // Historial de inventarios (versiones).
    showHistoryListModal = signal(false);
    countHistory = signal<any[]>([]);
    historyListLoading = signal(false);

    openHistoryList() {
        this.showHistoryListModal.set(true);
        this.historyListLoading.set(true);
        this.inventoryService.getCountHistory()
            .pipe(finalize(() => this.historyListLoading.set(false)))
            .subscribe({
                next: (res: any) => this.countHistory.set(res?.data || []),
                error: () => this.toastService.error('Error al cargar historial de inventarios')
            });
    }

    closeHistoryList() { this.showHistoryListModal.set(false); }

    downloadVersion(id: string, format: 'xlsx' | 'pdf') {
        this.inventoryService.downloadCountFile(id, format).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `inventario-${id}.${format}`;
                a.click();
                window.URL.revokeObjectURL(url);
            },
            error: () => this.toastService.error('Error al descargar el archivo')
        });
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
        const input = event.target as HTMLInputElement;
        const newStatus = input.checked;
        this.setReviewStatus(product, newStatus, input);
    }

    setReviewStatus(product: Product, newStatus: boolean, inputRef?: HTMLInputElement) {
        // Con una sesión de conteo activa, el toggle de un producto único se
        // registra de forma durable (cantidad 1/0) para que también cuente en
        // "vendidas durante el conteo" si luego se vende.
        if (this.hasActiveCount()) {
            const qty = newStatus ? 1 : 0;
            this.inventoryService.recordCount(product._id!, qty).subscribe({
                next: (res: any) => {
                    const entry = res?.data?.entry;
                    if (entry) {
                        const targets = new Map(this.countTargets());
                        targets.set(product._id!, entry.stockAtCount);
                        this.countTargets.set(targets);
                    }
                    const map = new Map(this.stockCounters());
                    map.set(product._id!, qty);
                    this.stockCounters.set(map);
                    product.lastInventoryRevision = res?.data?.product?.lastInventoryRevision !== undefined
                        ? res.data.product.lastInventoryRevision
                        : (newStatus ? new Date() : undefined);
                    this.refreshCountStats();
                    this.toastService.success(`Producto ${newStatus ? 'marcado como revisado' : 'marcado como no revisado'}`);
                },
                error: (err: any) => {
                    console.error('Error toggling review', err);
                    this.toastService.error('Error al actualizar estado de revisión');
                    if (inputRef) inputRef.checked = !newStatus;
                }
            });
            return;
        }

        // Sin sesión activa: comportamiento legacy (solo marca la fecha).
        this.inventoryService.toggleReviewStatus(product._id!, newStatus)
            .subscribe({
                next: (res: any) => {
                    product.lastInventoryRevision = res?.data?.lastInventoryRevision !== undefined
                        ? res.data.lastInventoryRevision
                        : (newStatus ? new Date() : undefined);
                    this.toastService.success(`Producto ${newStatus ? 'marcado como revisado' : 'marcado como no revisado'}`);
                },
                error: (err: any) => {
                    console.error('Error toggling review', err);
                    this.toastService.error('Error al actualizar estado de revisión');
                    if (inputRef) inputRef.checked = !newStatus;
                }
            });
    }
}
