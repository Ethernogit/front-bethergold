import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubcategoryService } from '../../../shared/services/subcategory.service';
import { CategoryService } from '../../../shared/services/category.service';
import { ToastService } from '../../../shared/services/toast.service';
import {
    Subcategory,
    Category,
    ProductStatus,
    CreateSubcategoryRequest,
    UpdateSubcategoryRequest,
    SubcategoryFilters,
    SubcategoryTableItem
} from '../../../shared/interfaces/product.interfaces';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-subcategories',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './subcategories.component.html',
    styleUrl: './subcategories.component.css'
})
export class SubcategoriesComponent implements OnInit {
    private subcategoryService = inject(SubcategoryService);
    private categoryService = inject(CategoryService);
    private toastService = inject(ToastService);
    private fb = inject(FormBuilder);

    // Signals for reactive state
    subcategories = signal<SubcategoryTableItem[]>([]);
    categories = signal<Category[]>([]);
    loading = signal(false);
    showModal = signal(false);
    showDeleteModal = signal(false);
    editingSubcategory = signal<Subcategory | null>(null);
    deletingSubcategory = signal<Subcategory | null>(null);

    // Forms
    subcategoryForm: FormGroup;
    searchForm: FormGroup;

    // Constants
    readonly ProductStatus = ProductStatus;

    constructor() {
        this.subcategoryForm = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(50)]],
            code: ['', [Validators.required, Validators.maxLength(10)]],
            description: ['', Validators.maxLength(200)],
            categoryId: ['', Validators.required],
            status: [ProductStatus.ACTIVE]
        });

        this.searchForm = this.fb.group({
            search: [''],
            status: [''],
            categoryId: ['']
        });
    }

    ngOnInit() {
        this.loadCategories();
        this.loadSubcategories();
    }

    loadCategories() {
        this.categoryService.getCategories({ status: ProductStatus.ACTIVE })
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.categories.set(response.data);
                    }
                },
                error: (error) => {
                    console.error('Error loading categories:', error);
                }
            });
    }

    loadSubcategories() {
        this.loading.set(true);
        const filters: SubcategoryFilters = {};

        const searchValue = this.searchForm.get('search')?.value;
        const statusValue = this.searchForm.get('status')?.value;
        const categoryValue = this.searchForm.get('categoryId')?.value;

        if (searchValue) filters.search = searchValue;
        if (statusValue) filters.status = statusValue;
        if (categoryValue) filters.categoryId = categoryValue;

        this.subcategoryService.getSubcategories(filters)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        const transformedSubcategories = response.data.map(subcategory => ({
                            ...subcategory,
                            id: subcategory._id || subcategory.id || '',
                            categoryId: (subcategory.categoryId as any)?._id || (subcategory.categoryId as any)?.id || subcategory.categoryId,
                            categoryName: (subcategory.categoryId as any)?.name || 'N/A',
                            statusDisplay: this.subcategoryService.getStatusDisplay(subcategory.status)
                        }));
                        this.subcategories.set(transformedSubcategories);
                    }
                },
                error: (error) => {
                    console.error('Error loading subcategories:', error);
                    this.toastService.error('Error al cargar las subcategorías');
                }
            });
    }

    // =============== SUBCATEGORY CRUD OPERATIONS ===============

    openCreateModal() {
        this.editingSubcategory.set(null);
        this.subcategoryForm.reset({
            status: ProductStatus.ACTIVE
        });
        this.showModal.set(true);
    }

    openEditModal(subcategory: Subcategory) {
        this.editingSubcategory.set(subcategory);
        this.subcategoryForm.patchValue({
            name: subcategory.name,
            code: subcategory.code,
            description: subcategory.description,
            categoryId: typeof subcategory.categoryId === 'object' ? (subcategory.categoryId as any)._id || (subcategory.categoryId as any).id : subcategory.categoryId,
            status: subcategory.status
        });
        this.showModal.set(true);
    }

    saveSubcategory() {
        if (this.subcategoryForm.invalid) {
            this.markFormGroupTouched(this.subcategoryForm);
            return;
        }

        const formData = this.subcategoryForm.value;
        const subcategoryData = {
            name: formData.name,
            code: formData.code,
            description: formData.description,
            categoryId: formData.categoryId,
            status: formData.status
        };

        this.loading.set(true);
        const operation = this.editingSubcategory()
            ? this.subcategoryService.updateSubcategory(this.editingSubcategory()!.id!, subcategoryData as UpdateSubcategoryRequest)
            : this.subcategoryService.createSubcategory(subcategoryData as CreateSubcategoryRequest);

        operation
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.closeModal();
                        this.loadSubcategories();
                        this.toastService.success(
                            this.editingSubcategory()
                                ? 'Subcategoría actualizada exitosamente'
                                : 'Subcategoría creada exitosamente'
                        );
                    }
                },
                error: (error) => {
                    console.error('Error saving subcategory:', error);
                    this.toastService.error('Error al guardar la subcategoría');
                }
            });
    }

    openDeleteModal(subcategory: Subcategory) {
        this.deletingSubcategory.set(subcategory);
        this.showDeleteModal.set(true);
    }

    confirmDelete() {
        const subcategory = this.deletingSubcategory();
        if (!subcategory) return;

        this.loading.set(true);
        this.subcategoryService.deleteSubcategory(subcategory.id!)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.showDeleteModal.set(false);
                        this.deletingSubcategory.set(null);
                        this.loadSubcategories();
                        this.toastService.success('Subcategoría eliminada exitosamente');
                    }
                },
                error: (error) => {
                    console.error('Error deleting subcategory:', error);
                    this.toastService.error('Error al eliminar la subcategoría');
                }
            });
    }

    // =============== UTILITY METHODS ===============

    onSearch() {
        this.loadSubcategories();
    }

    resetFilters() {
        this.searchForm.reset();
        this.loadSubcategories();
    }

    closeModal() {
        this.showModal.set(false);
        this.editingSubcategory.set(null);
    }

    closeDeleteModal() {
        this.showDeleteModal.set(false);
        this.deletingSubcategory.set(null);
    }

    getStatusClass(status: string): string {
        return this.subcategoryService.getStatusClass(status);
    }

    getCategoryName(categoryId: string): string {
        const category = this.categories().find(c => (c._id || c.id) === categoryId);
        return category?.name || 'N/A';
    }

    private markFormGroupTouched(formGroup: FormGroup) {
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            control?.markAsTouched();
        });
    }

    isFieldInvalid(fieldName: string, form: FormGroup = this.subcategoryForm): boolean {
        const field = form.get(fieldName);
        return !!(field && field.invalid && field.touched);
    }

    getFieldError(fieldName: string, form: FormGroup = this.subcategoryForm): string {
        const field = form.get(fieldName);
        if (field?.errors) {
            if (field.errors['required']) return 'Este campo es requerido';
            if (field.errors['maxlength']) return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
        }
        return '';
    }
}
