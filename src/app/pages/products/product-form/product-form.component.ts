import { Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common'; // Added isPlatformBrowser
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService, Product } from '../../../shared/services/product.service';
import { CategoryService } from '../../../shared/services/category.service';
import { SubcategoryService } from '../../../shared/services/subcategory.service';
import { ProviderService } from '../../../shared/services/provider.service';
import { ToastService } from '../../../shared/services/toast.service';
import { LabelPrintingService } from '../../../shared/services/label-printing.service';
import { LoginService } from '../../../shared/services/auth/login.service';
import { SucursalService } from '../../../shared/services/sucursal.service';
import { MaterialType, ProviderPrice, GoldType } from '../../../shared/interfaces/provider.interfaces';
import { combineLatest, forkJoin } from 'rxjs';

@Component({
    selector: 'app-product-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './product-form.component.html'
})
export class ProductFormComponent implements OnInit, OnChanges {
    @Input() product: Product | null = null;
    @Input() isEditMode = false;
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
    isDataLoaded = false;

    goldTypes: GoldType[] = [];
    // karatages removed in favor of materialTypes

    // Barcode Configuration
    sucursalConfig: any = null;
    productFormConfig: any = null;
    currentSucursalCode: string = '';

    constructor(
        private fb: FormBuilder,
        private productService: ProductService,
        private categoryService: CategoryService,
        private subcategoryService: SubcategoryService,
        private providerService: ProviderService,
        private toastService: ToastService,
        private labelService: LabelPrintingService,
        @Inject(PLATFORM_ID) private platformId: Object,
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
            description: [''],
            isUnique: [true],
            stock: [1, [Validators.required, Validators.min(0)]]
        });
    }

    @Input() preloadedCategories: any[] | null = null;
    @Input() preloadedProviders: any[] | null = null;

    ngOnInit(): void {
        this.loadInitialData();
        this.loadSucursalConfig();
        this.setupFormListeners();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['product'] && this.product && this.isDataLoaded) {
            this.patchForm(this.product);
            if (this.isEditMode) {
                this.productForm.get('barcode')?.disable();
            } else {
                this.productForm.get('barcode')?.enable();
            }
        }
    }

    // ... setupFormListeners ...

    // ... patchForm ...

    loadInitialData() {
        this.isLoading = true;

        const sources: any = {
            materials: this.providerService.getMaterialTypes({ status: 'active' }),
            goldTypes: this.providerService.getGoldTypes({ status: 'active' })
        };

        if (!this.preloadedCategories) {
            sources.categories = this.categoryService.getCategories();
        }

        if (!this.preloadedProviders) {
            sources.providers = this.providerService.getProviders();
        }

        // OPTIMIZATION: Load subcategories immediately if product exists
        if (this.product && this.product.category) {
            console.log("categoria", this.product.category)
            const categoryId = typeof this.product.category === 'object' ? (this.product.category as any)._id : this.product.category;
            console.log("categoria id", categoryId)
            if (categoryId) {
                sources.subcategories = this.subcategoryService.getSubcategoriesByCategory(categoryId);
                console.log("subcategorias", sources.subcategories)
            }
        }

        forkJoin(sources).subscribe({
            next: (res: any) => {
                this.categories = this.preloadedCategories || res.categories?.data || res.categories || [];
                this.providers = this.preloadedProviders || res.providers?.data || res.providers || [];
                this.materialTypes = res.materials?.data || res.materials || [];
                this.goldTypes = res.goldTypes?.data || res.goldTypes || [];

                if (res.subcategories) {
                    this.subcategories = res.subcategories?.data || res.subcategories || [];
                }

                this.isDataLoaded = true;

                // Patch form only ONCE after all data is loaded
                if (this.product && this.isEditMode) {
                    this.patchForm(this.product);
                }
            },
            error: (err) => {
                console.error('Error loading initial data', err);
                this.toastService.error('Error cargando datos iniciales. Por favor recargue.');
            },
            complete: () => this.isLoading = false
        });
    }

    setupFormListeners() {
        // Watch for category/subcategory changes to update barcode
        combineLatest([
            this.productForm.get('category')!.valueChanges,
            this.productForm.get('subcategory')!.valueChanges
        ]).subscribe(([categoryId, subcategoryId]) => {
            if (!this.isEditMode) {
                this.generateBarcode(categoryId, subcategoryId);
            }
        });

        // Watch for category changes mainly to load subcategories
        this.productForm.get('category')?.valueChanges.subscribe(categoryId => {
            this.loadSubcategories(categoryId);
            if (!this.isEditMode) this.calculatePrices();
        });

        // Watch for provider changes to load prices
        this.productForm.get('providerId')?.valueChanges.subscribe(providerId => {
            if (providerId) {
                this.loadProviderPrices(providerId);
            } else {
                this.currentProviderPrices = [];
            }
            if (!this.isEditMode) this.calculatePrices();
            if (!this.isEditMode) this.calculatePrices();
        });

        // Watch for isUnique changes to toggle stock field validation/visibility logic helpers if needed
        this.productForm.get('isUnique')?.valueChanges.subscribe(isUnique => {
            const stockControl = this.productForm.get('stock');
            if (isUnique) {
                stockControl?.setValue(1);
                stockControl?.disable();
            } else {
                stockControl?.enable();
            }
        });

        // Watch for inputs that affect price
        combineLatest([
            this.productForm.get('subcategory')!.valueChanges,
            this.productForm.get('karatage')!.valueChanges, // materialTypeId
            this.productForm.get('weight')!.valueChanges
        ]).subscribe(() => {
            if (!this.isEditMode) this.calculatePrices();
        });
    }

    patchForm(product: Product) {
        // Map category/subcategory if they are objects
        const categoryId = typeof product.category === 'object' ? (product.category as any)._id : product.category;
        const subcategoryId = ProductFormComponent.getIdFromRelation(product.subcategory);
        const providerId = product.providerId;

        // OPTIMIZATION: Check if subcategory is already in the list to avoid double-fetch
        const subcategoryAlreadyLoaded = this.subcategories.some(s => s._id === subcategoryId);

        if (subcategoryAlreadyLoaded) {
            this.productForm.patchValue({ subcategory: subcategoryId }, { emitEvent: false });
        } else if (categoryId) {
            this.loadSubcategories(categoryId, subcategoryId);
        }

        // Find material type from karatage string
        let materialTypeId = '';
        if (product.jewelryDetails?.karatage && this.materialTypes.length > 0) {
            const pKarat = product.jewelryDetails.karatage.toLowerCase();
            const m = this.materialTypes.find(mt =>
                mt.karat && (
                    `${mt.karat}k`.toLowerCase() === pKarat ||
                    mt.karat.toString().toLowerCase() === pKarat
                )
            );
            if (m) materialTypeId = m._id || m.id || '';
        }

        this.productForm.patchValue({
            barcode: product.barcode,
            providerId: providerId,
            weight: product.specifications?.weight || 0,
            category: categoryId,
            // subcategory is handled above
            goldType: product.jewelryDetails?.goldType || '',
            karatage: materialTypeId || product.jewelryDetails?.karatage,
            diamondPoints: product.jewelryDetails?.diamondPoints || 0,
            cost: product.cost || 0,
            price: product.price || 0,
            description: product.description || '',
            isUnique: product.isUnique !== undefined ? product.isUnique : true,
            stock: product.stock || 1
        }, { emitEvent: false });

        // Manually trigger simple change logic for UI state
        if (product.isUnique !== undefined && !product.isUnique) {
            this.productForm.get('stock')?.enable();
        } else {
            this.productForm.get('stock')?.disable();
        }

        // If using provider prices, loading them might auto-calc price, so we rely on isEditMode check in listeners to prevent overwrite
        if (providerId) {
            this.loadProviderPrices(providerId);
        }
    }

    // Helper to extract ID
    static getIdFromRelation(relation: any): string {
        if (!relation) return '';
        return typeof relation === 'object' && relation._id ? relation._id : relation as string;
    }




    loadSucursalConfig() {
        const sucursal = this.loginService.currentSucursal();
        if (sucursal && sucursal._id) {
            this.currentSucursalCode = sucursal.code || 'SUC';
            this.sucursalService.getSucursalById(sucursal._id).subscribe({
                next: (res: any) => {
                    this.sucursalConfig = res.data?.config?.barcode;
                    this.productFormConfig = res.data?.config?.productForm;
                    this.applyDefaults();
                },
                error: (err) => console.error('Error loading sucursal config', err)
            });
        }
    }

    applyDefaults() {
        if (!this.productFormConfig || this.isEditMode) return;

        const { defaultProvider, defaultCategory, defaultSubcategory } = this.productFormConfig;

        if (defaultProvider) {
            this.productForm.patchValue({ providerId: defaultProvider });
        }

        if (defaultCategory) {
            this.productForm.patchValue({ category: defaultCategory });
        }

        if (defaultCategory && defaultSubcategory) {
            this.loadSubcategories(defaultCategory);
            // Patch subcategory after a short delay to allow subscription to possibly fire, 
            // though reactive forms value holds regardless of options availability.
            setTimeout(() => {
                this.productForm.patchValue({ subcategory: defaultSubcategory });
            }, 100);
        }
    }

    loadSubcategories(categoryId: string, preselectedId: string = '') {
        if (!categoryId) {
            this.subcategories = [];
            return;
        }
        this.subcategoryService.getSubcategoriesByCategory(categoryId).subscribe({
            next: (res: any) => {
                this.subcategories = res.data || res;
                if (preselectedId) {
                    this.productForm.patchValue({ subcategory: preselectedId }, { emitEvent: false });
                    // Trigger price calc manually if needed since event is suppressed
                    if (!this.isEditMode) this.calculatePrices();
                }
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
                // Only calculate prices if NOT in edit mode to preserve stored values
                if (!this.isEditMode) {
                    this.calculatePrices();
                }
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
            isUnique: formValue.isUnique,
            stock: formValue.isUnique ? 1 : formValue.stock,
            specifications: {
                weight: formValue.weight
            },
            jewelryDetails: {
                goldType: formValue.goldType,
                karatage: karatText, // Send mapped string
                diamondPoints: formValue.diamondPoints
            }
        };

        if (this.isEditMode && this.product && this.product._id) {
            this.productService.updateProduct(this.product._id, productData).subscribe({
                next: () => {
                    this.toastService.success('Producto actualizado exitosamente');
                    this.saved.emit();
                    this.close.emit();
                },
                error: (err) => {
                    console.error('Error updating product', err);
                    this.toastService.error('Error al actualizar el producto');
                    this.isSubmitting = false;
                }
            });
        } else {
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
    }

    onCancel() {
        this.close.emit();
    }

    testPrint() {
        if (!this.productForm.get('barcode')?.value) {
            this.toastService.error('Debe ingresar un código de barras para imprimir');
            return;
        }

        const barcode = this.productForm.get('barcode')?.value;
        const price = this.productForm.get('price')?.value || 0;
        const description = this.productForm.get('description')?.value || '';

        this.labelService.printLabels([{
            barcode,
            description,
            price
        }]);
    }
}
