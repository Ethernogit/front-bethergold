import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService } from '../../../shared/services/category.service';
import { ToastService } from '../../../shared/services/toast.service';
import {
    Category,
    ProductStatus,
    CreateCategoryRequest,
    UpdateCategoryRequest,
    CategoryFilters,
    CategoryTableItem
} from '../../../shared/interfaces/product.interfaces';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-categories',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './categories.component.html',
    styleUrl: './categories.component.css'
})
export class CategoriesComponent implements OnInit {
    private categoryService = inject(CategoryService);
    private toastService = inject(ToastService);
    private fb = inject(FormBuilder);

    // Signals for reactive state
    categories = signal<CategoryTableItem[]>([]);
    loading = signal(false);
    showModal = signal(false);
    showDeleteModal = signal(false);
    editingCategory = signal<Category | null>(null);
    deletingCategory = signal<Category | null>(null);

    // Pagination (Client-side)
    currentPage = signal(1);
    itemsPerPage = signal(10);

    paginatedCategories = computed(() => {
        const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
        const endIndex = startIndex + this.itemsPerPage();
        return this.categories().slice(startIndex, endIndex);
    });

    totalPages = computed(() => Math.ceil(this.categories().length / this.itemsPerPage()));

    // Forms
    categoryForm: FormGroup;
    searchForm: FormGroup;

    // Constants
    readonly ProductStatus = ProductStatus;

    constructor() {
        this.categoryForm = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(50)]],
            code: ['', [Validators.required, Validators.maxLength(10)]],
            description: ['', Validators.maxLength(200)],
            status: [ProductStatus.ACTIVE],
            printConfiguration: this.fb.group({
                showPrice: [true],
                showWeight: [false],
                showKaratage: [false],
                showDescription: [true]
            })
        });

        this.searchForm = this.fb.group({
            search: [''],
            status: ['']
        });
    }

    ngOnInit() {
        this.loadCategories();
    }

    loadCategories() {
        this.loading.set(true);
        const filters: CategoryFilters = {};

        const searchValue = this.searchForm.get('search')?.value;
        const statusValue = this.searchForm.get('status')?.value;

        if (searchValue) filters.search = searchValue;
        if (statusValue) filters.status = statusValue;

        this.categoryService.getCategories(filters)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        const transformedCategories = response.data.map(category => ({
                            ...category,
                            id: category._id || category.id || '',
                            statusDisplay: this.categoryService.getStatusDisplay(category.status)
                        }));
                        this.categories.set(transformedCategories);
                    }
                },
                error: (error) => {
                    console.error('Error loading categories:', error);
                    this.toastService.error('Error al cargar las categorías');
                }
            });
    }

    // =============== CATEGORY CRUD OPERATIONS ===============

    openCreateModal() {
        this.editingCategory.set(null);
        this.categoryForm.reset({
            status: ProductStatus.ACTIVE,
            printConfiguration: {
                showPrice: true,
                showWeight: false,
                showKaratage: false,
                showDescription: true
            }
        });
        this.showModal.set(true);
    }

    openEditModal(category: Category) {
        this.editingCategory.set(category);
        this.categoryForm.patchValue({
            name: category.name,
            code: category.code,
            description: category.description,
            status: category.status,
            printConfiguration: category.printConfiguration || {
                showPrice: true,
                showWeight: false,
                showKaratage: false,
                showDescription: true
            }
        });
        this.showModal.set(true);
    }

    saveCategory() {
        if (this.categoryForm.invalid) {
            this.markFormGroupTouched(this.categoryForm);
            return;
        }

        const formData = this.categoryForm.value;
        const categoryData = {
            name: formData.name,
            code: formData.code,
            description: formData.description,
            status: formData.status,
            printConfiguration: formData.printConfiguration
        };

        this.loading.set(true);
        const operation = this.editingCategory()
            ? this.categoryService.updateCategory(this.editingCategory()!.id!, categoryData as UpdateCategoryRequest)
            : this.categoryService.createCategory(categoryData as CreateCategoryRequest);

        operation
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.closeModal();
                        this.loadCategories();
                        this.toastService.success(
                            this.editingCategory()
                                ? 'Categoría actualizada exitosamente'
                                : 'Categoría creada exitosamente'
                        );
                    }
                },
                error: (error) => {
                    console.error('Error saving category:', error);
                    const errorMessage = error.error?.message || error.message || 'Error al guardar la categoría';
                    this.toastService.error(errorMessage);
                }
            });
    }

    openDeleteModal(category: Category) {
        this.deletingCategory.set(category);
        this.showDeleteModal.set(true);
    }

    confirmDelete() {
        const category = this.deletingCategory();
        if (!category) return;

        this.loading.set(true);
        this.categoryService.deleteCategory(category.id!)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.showDeleteModal.set(false);
                        this.deletingCategory.set(null);
                        this.loadCategories();
                        this.toastService.success('Categoría eliminada exitosamente');
                    }
                },
                error: (error) => {
                    console.error('Error deleting category:', error);
                    this.toastService.error('Error al eliminar la categoría');
                }
            });
    }

    onPageChange(page: number) {
        this.currentPage.set(page);
    }

    onLimitChange(limit: number) {
        this.itemsPerPage.set(limit);
        this.currentPage.set(1);
    }

    // =============== UTILITY METHODS ===============

    onSearch() {
        this.currentPage.set(1);
        this.loadCategories();
    }

    resetFilters() {
        this.searchForm.reset();
        this.loadCategories();
    }

    closeModal() {
        this.showModal.set(false);
        this.editingCategory.set(null);
    }

    closeDeleteModal() {
        this.showDeleteModal.set(false);
        this.deletingCategory.set(null);
    }

    getStatusClass(status: string): string {
        return this.categoryService.getStatusClass(status);
    }

    private markFormGroupTouched(formGroup: FormGroup) {
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            control?.markAsTouched();
        });
    }

    isFieldInvalid(fieldName: string, form: FormGroup = this.categoryForm): boolean {
        const field = form.get(fieldName);
        return !!(field && field.invalid && field.touched);
    }

    getFieldError(fieldName: string, form: FormGroup = this.categoryForm): string {
        const field = form.get(fieldName);
        if (field?.errors) {
            if (field.errors['required']) return 'Este campo es requerido';
            if (field.errors['maxlength']) return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
        }
        return '';
    }
}
