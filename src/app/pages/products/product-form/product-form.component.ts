import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../shared/services/product.service';
import { CategoryService } from '../../../shared/services/category.service';
import { SubcategoryService } from '../../../shared/services/subcategory.service';
import { ProviderService } from '../../../shared/services/provider.service';
import { ToastService } from '../../../shared/services/toast.service';
import { LoginService } from '../../../shared/services/auth/login.service';
import { SucursalService } from '../../../shared/services/sucursal.service';
import { combineLatest } from 'rxjs';

@Component({
    selector: 'app-product-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './product-form.component.html'
})
export class ProductFormComponent implements OnInit {
    @Output() close = new EventEmitter<void>();
    @Output() saved = new EventEmitter<void>();

    productForm: FormGroup;
    categories: any[] = [];
    subcategories: any[] = [];
    providers: any[] = [];
    isLoading = false;
    isSubmitting = false;

    goldTypes = ['NAC', 'ITA', 'OTHER'];
    karatages = ['10k', '14k', '18k', '22k', '24k'];

    // Barcode Configuration
    sucursalConfig: any = null;
    currentSucursalCode: string = '';

    constructor(
        private fb: FormBuilder,
        private productService: ProductService,
        private categoryService: CategoryService,
        private subcategoryService: SubcategoryService,
        private providerService: ProviderService,
        private toastService: ToastService,
        private loginService: LoginService,
        private sucursalService: SucursalService
    ) {
        // Barcode is now readonly initially or autofilled, but we keep validators for safety
        this.productForm = this.fb.group({
            barcode: ['', Validators.required],
            providerId: ['', Validators.required],
            weight: [0, [Validators.required, Validators.min(0)]],
            category: ['', Validators.required],
            subcategory: [''],
            goldType: [''],
            karatage: [''],
            diamondPoints: [0],
            cost: [0, [Validators.required, Validators.min(0)]],
            price: [0, [Validators.required, Validators.min(0)]],
            description: ['']
        });
    }

    ngOnInit(): void {
        this.loadInitialData();
        this.loadSucursalConfig();

        // Watch for category/subcategory changes to update barcode
        combineLatest([
            this.productForm.get('category')!.valueChanges,
            this.productForm.get('subcategory')!.valueChanges
        ]).subscribe(([categoryId, subcategoryId]) => {
            this.generateBarcode(categoryId, subcategoryId);
        });

        // Watch for category changes mainly to load subcategories
        this.productForm.get('category')?.valueChanges.subscribe(categoryId => {
            this.loadSubcategories(categoryId);
        });
    }

    loadInitialData() {
        this.isLoading = true;
        // Load categories
        this.categoryService.getCategories().subscribe({
            next: (res: any) => {
                this.categories = res.data || res;
            },
            error: (err) => console.error('Error loading categories', err)
        });

        // Load providers
        this.providerService.getProviders().subscribe({
            next: (res: any) => {
                this.providers = res.data || res;
            },
            error: (err) => console.error('Error loading providers', err),
            complete: () => this.isLoading = false
        });
    }

    loadSucursalConfig() {
        const sucursal = this.loginService.currentSucursal();
        if (sucursal && sucursal._id) {
            this.currentSucursalCode = sucursal.code || 'SUC';
            this.sucursalService.getSucursalById(sucursal._id).subscribe({
                next: (res: any) => {
                    this.sucursalConfig = res.data?.config?.barcode;
                },
                error: (err) => console.error('Error loading sucursal config', err)
            });
        }
    }

    loadSubcategories(categoryId: string) {
        if (!categoryId) {
            this.subcategories = [];
            return;
        }
        this.subcategoryService.getSubcategoriesByCategory(categoryId).subscribe({
            next: (res: any) => {
                this.subcategories = res.data || res;
            },
            error: (err) => console.error('Error loading subcategories', err)
        });
    }

    generateBarcode(categoryId: string, subcategoryId: string) {
        if (!this.sucursalConfig || !this.sucursalConfig.enabled) return;

        // Find Category Code
        const category = this.categories.find(c => c._id === categoryId || c.id === categoryId);
        const categoryCode = category ? category.code : 'UNKNOWN';

        // Find Subcategory Code (if selected)
        const subcategory = this.subcategories.find(s => s._id === subcategoryId || s.id === subcategoryId);
        const subcategoryCode = subcategory ? subcategory.code : '000';

        // Use a random or sequential index placeholder for now handled by backend ideally,
        // but for frontend preview we simulate it. 
        // Real implementation would be: request next sequence from backend.
        // For now, we will use '000001' or similar as placeholder to show format.
        const previewIndex = 1;

        const barcode = this.sucursalService.generatePreview(
            this.sucursalConfig,
            categoryCode,
            subcategoryCode,
            previewIndex,
            this.currentSucursalCode
        );

        this.productForm.patchValue({ barcode: barcode }, { emitEvent: false });
    }

    onSubmit() {
        if (this.productForm.invalid) {
            this.productForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        const formValue = this.productForm.value;

        const productData: any = {
            barcode: formValue.barcode,
            name: formValue.description || 'Producto sin nombre', // Fallback name
            description: formValue.description,
            providerId: formValue.providerId,
            category: formValue.category,
            subcategory: formValue.subcategory,
            price: formValue.price,
            cost: formValue.cost,
            stock: 1, // Default to 1 for unique items
            specifications: {
                weight: formValue.weight
            },
            jewelryDetails: {
                goldType: formValue.goldType,
                karatage: formValue.karatage,
                diamondPoints: formValue.diamondPoints
            }
        };

        this.productService.createProduct(productData).subscribe({
            next: () => {
                this.toastService.success('Producto registrado exitosamente');
                this.saved.emit();
                this.close.emit();
            },
            error: (err) => {
                console.error('Error creating product', err);
                this.toastService.error('Error al registrar el producto');
                this.isSubmitting = false;
            }
        });
    }

    onCancel() {
        this.close.emit();
    }
}
