import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product, StockHistoryEntry } from '../../../shared/services/product.service';
import { CategoryService } from '../../../shared/services/category.service';
import { SubcategoryService } from '../../../shared/services/subcategory.service';
import { ProviderService } from '../../../shared/services/provider.service';
import { ToastService } from '../../../shared/services/toast.service';
import { LabelPrintingService } from '../../../shared/services/label-printing.service';
import { finalize } from 'rxjs';
import { ProductFormComponent } from '../product-form/product-form.component';
import { ProductStatus } from '../../../shared/interfaces/product.interfaces';
import { FilterSidebarComponent, FilterConfig } from '../../../shared/components/ui/filter-sidebar/filter-sidebar.component';
import { TourService } from '../../../shared/services/tour.service';
@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [CommonModule, FormsModule, ProductFormComponent, FilterSidebarComponent],
    templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit {
    private productService = inject(ProductService);
    private categoryService = inject(CategoryService);
    private subcategoryService = inject(SubcategoryService);
    private providerService = inject(ProviderService);
    private toastService = inject(ToastService);
    private labelService = inject(LabelPrintingService);
    public tourService = inject(TourService);


    // Signals
    products = signal<Product[]>([]);
    loading = signal(false);
    showModal = signal(false);
    showDeleteModal = signal(false);
    deletingProduct = signal<Product | null>(null);
    editingProduct = signal<Product | null>(null);

    // Filter Sidebar State
    showFilters = signal(false);
    filterConfig = signal<FilterConfig[]>([]);
    activeFilters = signal<any>({});

    // Store last selected category to detect changes
    private lastSelectedCategoryId: string = '';

    // Store all categories for lookup (e.g. printing config)
    categories: any[] = [];



    // Selection
    selectedProducts = signal<Set<string>>(new Set());

    // Pagination
    currentPage = signal(1);
    itemsPerPage = signal(10);
    totalItems = signal(0);
    totalPages = signal(0);

    constructor() { }

    ngOnInit() {
        this.loadProducts();
        this.initFilterConfig();
    }

    startTour() {
        this.tourService.startProductTour();
    }

    initFilterConfig() {
        // Initial config placeholders
        const baseConfig: FilterConfig[] = [
            {
                key: 'barcode',
                label: 'Código de Barras',
                type: 'text',
                placeholder: 'Buscar por código...'
            },
            {
                key: 'isUnique',
                label: 'Tipo de Producto',
                type: 'select',
                options: [
                    { value: 'true', label: 'Único (joya individual)' },
                    { value: 'false', label: 'Stock (piezas múltiples)' }
                ],
                placeholder: 'Todos'
            },
            {
                key: 'jewelryDetails.karatage',
                label: 'Tipo de Material',
                type: 'select',
                options: [],
                placeholder: 'Seleccione Material'
            },
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
            }
        ];
        this.filterConfig.set(baseConfig);

        // Load Material Types
        this.providerService.getMaterialTypes({ status: 'active' }).subscribe({
            next: (res: any) => {
                const materials = res.data || res || [];
                const options = materials.map((m: any) => ({
                    value: m.karat, // Use Karatage string as value
                    label: `${m.name} (${m.karat}k)`
                }));
                this.updateFilterConfig('jewelryDetails.karatage', options);
            }
        });

        // Load Categories
        this.categoryService.getCategories({ status: ProductStatus.ACTIVE }).subscribe({
            next: (res) => {
                const categories = res.data || [];
                this.categories = categories; // Store for lookup
                const categoryOptions = categories.map(c => ({ value: c._id!, label: c.name }));
                this.updateFilterConfig('category', categoryOptions);
            }
        });
    }

    // Helper to update options of a filter
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

        // If category changed
        if (categoryId !== this.lastSelectedCategoryId) {
            this.lastSelectedCategoryId = categoryId;

            // Reset subcategory selection (optional, but good UX? Or filter component handles form value?)
            // The form value is in the child component. We don't control it directly easily unless we update defaultValue which initForm uses.
            // But we can update the options.

            if (categoryId) {
                // Fetch subcategories
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
                // Clear subcategories if no category selected
                this.updateFilterConfig('subcategory', []);
            }
        }
    }
    loadProducts() {
        this.loading.set(true);
        const params: any = {
            limit: this.itemsPerPage(),
            skip: (this.currentPage() - 1) * this.itemsPerPage(),
            ...this.activeFilters() // Include active filters
        };





        this.productService.getProducts(params)
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
                    console.error('Error loading products', err);
                    const msg = err.error?.message || err.message || 'Error desconocido';
                    this.toastService.error(`Error al cargar productos: ${msg}`);
                }
            });
    }

    // ... existing methods ...

    onPageChange(page: number) {
        this.currentPage.set(page);
        this.loadProducts();
    }

    onLimitChange(limit: number) {
        this.itemsPerPage.set(limit);
        this.currentPage.set(1);
        this.loadProducts();
    }





    // Filter Methods
    openFilters() {
        this.showFilters.set(true);
    }

    closeFilters() {
        this.showFilters.set(false);
    }

    applyFilters(filters: any) {
        this.activeFilters.set(filters);
        this.currentPage.set(1);
        this.loadProducts();
    }

    openCreateModal() {
        this.editingProduct.set(null);
        this.showModal.set(true);
        // If tour is active, continue it inside the modal
        this.tourService.continueProductFormTour();
    }

    openEditModal(product: Product) {
        this.editingProduct.set(product);
        this.showModal.set(true);
    }

    closeModal() {
        this.showModal.set(false);
        this.editingProduct.set(null);
    }

    onProductSaved() {
        this.closeModal();
        this.loadProducts();
    }

    openDeleteModal(product: Product) {
        this.deletingProduct.set(product);
        this.showDeleteModal.set(true);
    }

    closeDeleteModal() {
        this.showDeleteModal.set(false);
        this.deletingProduct.set(null);
    }

    confirmDelete() {
        const product = this.deletingProduct();
        if (!product || !product._id) return;

        this.loading.set(true);
        this.productService.deleteProduct(product._id)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: () => {
                    this.toastService.success('Producto eliminado correctamente');
                    this.closeDeleteModal();
                    this.loadProducts();
                },
                error: (err) => {
                    console.error('Error deleting product', err);
                    this.toastService.error('Error al eliminar producto');
                }
            });
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

    // Selection Logic
    toggleSelection(productId: string) {
        const currentSelected = new Set(this.selectedProducts());
        if (currentSelected.has(productId)) {
            currentSelected.delete(productId);
        } else {
            currentSelected.add(productId);
        }
        this.selectedProducts.set(currentSelected);
    }

    toggleAllSelection(event: any) {
        const checked = event.target.checked;
        if (checked) {
            const allIds = new Set(this.products().map((p: Product) => p._id!));
            this.selectedProducts.set(allIds);
        } else {
            this.selectedProducts.set(new Set());
        }
    }

    isSelected(productId: string): boolean {
        return this.selectedProducts().has(productId);
    }

    isAllSelected(): boolean {
        const products = this.products();
        return products.length > 0 && products.every((p: Product) => this.selectedProducts().has(p._id!));
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
                next: (res: any) => {
                    this.historyEntries.set(res.data?.history || []);
                },
                error: (err) => {
                    this.toastService.error('Error al cargar historial de stock');
                }
            });
    }

    closeHistoryModal() {
        this.showHistoryModal.set(false);
        this.historyProduct.set(null);
        this.historyEntries.set([]);
    }

    getHistoryTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            sale: 'Vendido',
            reservation: 'Apartado',
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
        if (typeof entry.clientId === 'object' && entry.clientId.name) {
            return entry.clientId.name;
        }
        return '-';
    }

    bulkPrintLabels() {
        const selectedIds = this.selectedProducts();
        if (selectedIds.size === 0) {
            this.toastService.error('Seleccione al menos un producto para imprimir');
            return;
        }

        const productsToPrint = this.products()
            .filter((p: Product) => selectedIds.has(p._id!))
            .map((p: Product) => {
                let category = p.category as any; // Cast to access printConfiguration if populated

                // If category is just an ID or missing config, try to find it in stored categories
                if (!category?.printConfiguration && !category?.print_configuration) {
                    const catId = typeof p.category === 'object' ? (p.category as any)._id : p.category;
                    const foundCat = this.categories.find(c => c._id === catId || c.id === catId);
                    if (foundCat) {
                        category = foundCat;
                    }
                }

                return {
                    barcode: p.barcode,
                    description: p.description || p.name,
                    price: p.price,
                    category: this.getCategoryName(p),
                    subcategory: this.getSubcategoryName(p),
                    weight: p.specifications?.weight,
                    karatage: p.jewelryDetails?.karatage,
                    goldType: p.jewelryDetails?.goldType,
                    material: p.specifications?.material,
                    printConfig: category?.printConfiguration || category?.print_configuration
                };
            });

        this.labelService.printLabels(productsToPrint);
    }
}
