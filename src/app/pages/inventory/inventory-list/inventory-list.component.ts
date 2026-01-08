import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { InventoryService } from '../../../shared/services/inventory.service';
import { Product } from '../../../shared/services/product.service';
import { ToastService } from '../../../shared/services/toast.service';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-inventory-list',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './inventory-list.component.html'
})
export class InventoryListComponent implements OnInit {
    private inventoryService = inject(InventoryService);
    private toastService = inject(ToastService);
    private fb = inject(FormBuilder);

    // Signals
    products = signal<Product[]>([]);
    loading = signal(false);

    // Pagination
    currentPage = signal(1);
    itemsPerPage = signal(10);
    // Note: Backend might not return total count yet, adapting to current ProductController behavior

    searchForm: FormGroup;

    constructor() {
        this.searchForm = this.fb.group({
            search: ['']
        });
    }

    ngOnInit() {
        this.loadInventory();
    }

    loadInventory() {
        this.loading.set(true);
        const params: any = {
            limit: this.itemsPerPage(),
            skip: (this.currentPage() - 1) * this.itemsPerPage(),
            status: 'active' // Filter only active products
        };
        const searchValue = this.searchForm.get('search')?.value;
        if (searchValue) params.search = searchValue;

        this.inventoryService.getInventory(params)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res: any) => {
                    const products = res.data || res;
                    this.products.set(products);
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

    onLimitChange(limit: number) {
        this.itemsPerPage.set(limit);
        this.currentPage.set(1);
        this.loadInventory();
    }

    onSearch() {
        this.currentPage.set(1);
        this.loadInventory();
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
                    // Update local state if needed (though product object in array is reference)
                    // product.lastInventoryRevision = newStatus ? new Date() : null; // If interface allowed
                    this.toastService.success(`Producto ${newStatus ? 'marcado como revisado' : 'marcado como no revisado'}`);
                },
                error: (err: any) => {
                    console.error('Error toggling review', err);
                    this.toastService.error('Error al actualizar estado de revisión');
                    // Revert check
                    input.checked = !newStatus;
                }
            });
    }
}
