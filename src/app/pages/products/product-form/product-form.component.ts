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
import { MaterialType, ProviderPrice } from '../../../shared/interfaces/provider.interfaces';
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
    materialTypes: MaterialType[] = [];
    currentProviderPrices: ProviderPrice[] = [];
    isLoading = false;
    isSubmitting = false;

    goldTypes = ['NAC', 'ITA', 'OTHER'];
    // karatages removed in favor of materialTypes

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
            karatage: [''], // Will now store materialTypeId
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
            this.calculatePrices();
        });

        // Watch for provider changes to load prices
        this.productForm.get('providerId')?.valueChanges.subscribe(providerId => {
            if (providerId) {
                this.loadProviderPrices(providerId);
            } else {
                this.currentProviderPrices = [];
            }
            this.calculatePrices();
        });

        // Watch for inputs that affect price
        combineLatest([
            this.productForm.get('subcategory')!.valueChanges,
            this.productForm.get('karatage')!.valueChanges, // materialTypeId
            this.productForm.get('weight')!.valueChanges
        ]).subscribe(() => {
            this.calculatePrices();
        });

        // Watch for manual cost changes to update sale price (removed automatic update from cost changes to avoid overwriting calculating logic if they want manual override, or we can keep it if we persist the margin)
        // With current logic, Price depends on ProviderPrice Margin. If user changes Cost manually, should we keep that margin?
        // Simplified: Calculating prices is triggered by main inputs.
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

        // Load material types
        this.providerService.getMaterialTypes({ status: 'active' }).subscribe({
            next: (res: any) => {
                this.materialTypes = res.data || res;
            },
            error: (err) => console.error('Error loading material types', err)
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

        const sucursal = this.loginService.currentSucursal();
        if (!sucursal || !sucursal._id) return;

        // Call backend to get real next barcode
        // We pass the categoryId and subcategoryId
        this.productService.getNextBarcode(sucursal._id, categoryId, subcategoryId).subscribe({
            next: (res: any) => {
                if (res.success && res.data && res.data.barcode) {
                    this.productForm.patchValue({ barcode: res.data.barcode }, { emitEvent: false });
                }
            },
            error: (err) => console.error('Error getting next barcode', err)
        });
    }

    loadProviderPrices(providerId: string) {
        this.providerService.getProviderPrices(providerId).subscribe({
            next: (res: any) => {
                this.currentProviderPrices = res.data || res;
                this.calculatePrices();
            },
            error: (err) => console.error('Error loading prices', err)
        });
    }

    calculatePrices() {
        const providerId = this.productForm.get('providerId')?.value;
        const subcategoryId = this.productForm.get('subcategory')?.value;
        const materialTypeId = this.productForm.get('karatage')?.value;
        const weight = this.productForm.get('weight')?.value || 0;

        if (!providerId || !materialTypeId || !weight || this.currentProviderPrices.length === 0) {
            return;
        }

        // Find matching price
        // Priority: 1. Specific Subcategory, 2. Global (no subcategory or null)
        let matchedPrice = this.currentProviderPrices.find(p =>
            (typeof p.materialTypeId === 'object' ? (p.materialTypeId as any)._id === materialTypeId : p.materialTypeId === materialTypeId) &&
            (p.subcategoryId ? (typeof p.subcategoryId === 'object' ? (p.subcategoryId as any)._id === subcategoryId : p.subcategoryId === subcategoryId) : false)
        );

        if (!matchedPrice) {
            // Try generic price (subcategoryId is null/undefined in price)
            matchedPrice = this.currentProviderPrices.find(p =>
                (typeof p.materialTypeId === 'object' ? (p.materialTypeId as any)._id === materialTypeId : p.materialTypeId === materialTypeId) &&
                !p.subcategoryId
            );
        }

        if (matchedPrice) {
            // Calculate Cost and Sale Price
            const basePrice = matchedPrice.pricePerGram;
            const providerMargin = matchedPrice.profitMargin || 0;

            // COST = Base Price * Weight
            const totalCost = basePrice * weight;
            this.productForm.patchValue({ cost: parseFloat(totalCost.toFixed(2)) }, { emitEvent: false });

            // SALE PRICE = (Base Price * (1 + Margin)) * Weight
            // OR = Cost * (1 + Margin) if we view margin as our markup on top of base cost
            // Let's use the helper: calculateFinalPrice(base, margin) gives per-gram sale price
            const salePricePerGram = this.providerService.calculateFinalPrice(basePrice, providerMargin);
            const totalSalePrice = salePricePerGram * weight;

            this.productForm.patchValue({ price: parseFloat(totalSalePrice.toFixed(2)) }, { emitEvent: false });
        }
    }

    onSubmit() {
        if (this.productForm.invalid) {
            this.productForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        const formValue = this.productForm.value;

        // Map materialTypeId to karat text for backend if needed
        const materialId = formValue.karatage;
        const selectedMaterial = this.materialTypes.find(m => m._id === materialId || m.id === materialId);
        const karatText = selectedMaterial ? `${selectedMaterial.karat}k` : (formValue.karatage || '');

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
                karatage: karatText, // Send mapped string
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
