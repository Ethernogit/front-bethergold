import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ProductService, Product } from '../../../shared/services/product.service';
import { ToastService } from '../../../shared/services/toast.service';
import { LabelPrintingService } from '../../../shared/services/label-printing.service'; // Import Service
import { finalize } from 'rxjs';
import { ProductFormComponent } from '../product-form/product-form.component';

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ProductFormComponent],
    templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit {
    private productService = inject(ProductService);
    private toastService = inject(ToastService);
    private labelService = inject(LabelPrintingService); // Inject Service
    private fb = inject(FormBuilder);

    // Signals
    products = signal<Product[]>([]);
    loading = signal(false);
    showModal = signal(false);
    showDeleteModal = signal(false);
    deletingProduct = signal<Product | null>(null);
    editingProduct = signal<Product | null>(null); // To pass to form if editable

    // Selection
    selectedProducts = signal<Set<string>>(new Set());

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
        this.loadProducts();
    }

    loadProducts() {
        this.loading.set(true);
        const params: any = {
            limit: this.itemsPerPage(),
            skip: (this.currentPage() - 1) * this.itemsPerPage()
        };
        const searchValue = this.searchForm.get('search')?.value;
        if (searchValue) params.search = searchValue;

        this.productService.getProducts(params)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res: any) => {
                    // Assuming API returns { data: [], meta: { total: number } } or similar
                    // If backend just returns array, we handle it differently.
                    // Based on controller, it returns { data: products }. It doesn't seem to return count.
                    // We might need to handle total count if API provides it.
                    // For now, if no total count, we can just set products.
                    // Checking controller... it returns { data: products }.
                    // We need to fetch total count separately or update API.
                    // Implementation plan assumed standard pagination.
                    // Let's assume for now we just show what we have, but to do real pagination we need count.
                    // Controller limit/skip is implemented.
                    // Let's assume response might change to include count or we just don't show total pages yet.
                    // Wait, standard for this project usually wraps data.
                    // Controller code:
                    // res.status(200).json({ success: true, message: '...', data: products });
                    // It does NOT return total count.
                    // I will implement client-side pagination if needed or just simple "next" if data < limit?
                    // No, usually we want total.
                    // For now, I will just set products. If length < limit, we are at end.
                    const products = res.data || res;
                    this.products.set(products);
                    // Estimate total or handle simple pagination
                    if (products.length < this.itemsPerPage()) {
                        // End of list
                    }
                },
                error: (err) => {
                    console.error('Error loading products', err);
                    this.toastService.error('Error al cargar productos');
                }
            });
    }

    onPageChange(page: number) {
        this.currentPage.set(page);
        this.loadProducts();
    }

    onLimitChange(limit: number) {
        this.itemsPerPage.set(limit);
        this.currentPage.set(1);
        this.loadProducts();
    }

    onSearch() {
        this.currentPage.set(1);
        this.loadProducts();
    }

    openCreateModal() {
        this.editingProduct.set(null);
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
            const allIds = new Set(this.products().map(p => p._id!));
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
        return products.length > 0 && products.every(p => this.selectedProducts().has(p._id!));
    }

    bulkPrintLabels() {
        const selectedIds = this.selectedProducts();
        if (selectedIds.size === 0) {
            this.toastService.error('Seleccione al menos un producto para imprimir');
            return;
        }

        const productsToPrint = this.products()
            .filter(p => selectedIds.has(p._id!))
            .map(p => ({
                barcode: p.barcode,
                description: p.description || p.name, // Fallback to name if desc is empty?
                price: p.price
            }));

        this.labelService.printLabels(productsToPrint);

        // Optional: Clear selection after print? 
        // this.selectedProducts.set(new Set());
    }
}
