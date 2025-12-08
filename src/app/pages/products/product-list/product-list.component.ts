import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ProductService, Product } from '../../../shared/services/product.service';
import { ToastService } from '../../../shared/services/toast.service';
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
    private fb = inject(FormBuilder);

    // Signals
    products = signal<Product[]>([]);
    loading = signal(false);
    showModal = signal(false);
    showDeleteModal = signal(false);
    deletingProduct = signal<Product | null>(null);
    editingProduct = signal<Product | null>(null); // To pass to form if editable

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
        const params: any = {};
        const searchValue = this.searchForm.get('search')?.value;
        if (searchValue) params.search = searchValue;

        this.productService.getProducts(params)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res: any) => {
                    this.products.set(res.data || res);
                },
                error: (err) => {
                    console.error('Error loading products', err);
                    this.toastService.error('Error al cargar productos');
                }
            });
    }

    onSearch() {
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
}
