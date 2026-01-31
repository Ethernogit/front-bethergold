import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SucursalService } from '../../../shared/services/sucursal.service';
import { ToastService } from '../../../shared/services/toast.service';
import { LoginService } from '../../../shared/services/auth/login.service';
import { CategoryService } from '../../../shared/services/category.service';
import { SubcategoryService } from '../../../shared/services/subcategory.service';
import { ProviderService } from '../../../shared/services/provider.service';

@Component({
    selector: 'app-sucursal-products',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './sucursal-products.component.html'
})
export class SucursalProductConfigComponent implements OnInit {
    configForm: FormGroup;
    currentSucursalId: string | null = null;
    isLoading = false;

    categories: any[] = [];
    subcategories: any[] = [];
    providers: any[] = [];

    constructor(
        private fb: FormBuilder,
        private sucursalService: SucursalService,
        private toastService: ToastService,
        private loginService: LoginService,
        private categoryService: CategoryService,
        private subcategoryService: SubcategoryService,
        private providerService: ProviderService
    ) {
        this.configForm = this.fb.group({
            enableSku: [true],
            enableImage: [true],
            enableName: [true],
            enableStock: [true],
            enableSpecifications: [true],
            enableTags: [true],
            enableDiamondPoints: [true],
            requireSku: [false],
            defaultProvider: [''],
            defaultCategory: [''],
            defaultSubcategory: ['']
        });
    }

    ngOnInit(): void {
        this.loadLists();
        this.loadUserData();

        this.configForm.get('defaultCategory')?.valueChanges.subscribe(catId => {
            this.loadSubcategories(catId);
        });
    }

    loadLists() {
        this.categoryService.getCategories().subscribe({
            next: (res: any) => this.categories = res.data || res,
            error: (err) => console.error('Error loading categories', err)
        });

        this.providerService.getProviders().subscribe({
            next: (res: any) => this.providers = res.data || res,
            error: (err) => console.error('Error loading providers', err)
        });
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

    loadUserData() {
        const sucursal = this.loginService.currentSucursal();
        if (sucursal && sucursal._id) {
            this.currentSucursalId = sucursal._id;
            this.loadSucursalConfig();
        } else {
            this.toastService.error('No se pudo identificar la sucursal del usuario.');
        }
    }

    loadSucursalConfig() {
        if (!this.currentSucursalId) return;

        this.isLoading = true;
        this.sucursalService.getSucursalById(this.currentSucursalId).subscribe({
            next: (response) => {
                const configProduct = response.data.config?.productForm;

                if (configProduct) {
                    this.configForm.patchValue({
                        enableSku: configProduct.enableSku ?? true,
                        enableImage: configProduct.enableImage ?? true,
                        enableName: configProduct.enableName ?? true,
                        enableStock: configProduct.enableStock ?? true,
                        enableSpecifications: configProduct.enableSpecifications ?? true,
                        enableTags: configProduct.enableTags ?? true,
                        enableDiamondPoints: configProduct.enableDiamondPoints ?? true,
                        requireSku: configProduct.requireSku ?? false,
                        defaultProvider: configProduct.defaultProvider || '',
                        defaultCategory: configProduct.defaultCategory || '',
                        defaultSubcategory: configProduct.defaultSubcategory || ''
                    });

                    if (configProduct.defaultCategory) {
                        this.loadSubcategories(configProduct.defaultCategory);
                    }
                }
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading config', error);
                this.toastService.error('Error al cargar la configuración');
                this.isLoading = false;
            }
        });
    }

    onSubmit() {
        if (this.configForm.invalid) return;
        if (!this.currentSucursalId) return;

        this.isLoading = true;
        const formValue = this.configForm.value;

        const productFormConfig = {
            enableSku: formValue.enableSku,
            enableImage: formValue.enableImage,
            enableName: formValue.enableName,
            enableStock: formValue.enableStock,
            enableSpecifications: formValue.enableSpecifications,
            enableTags: formValue.enableTags,
            enableDiamondPoints: formValue.enableDiamondPoints,
            requireSku: formValue.requireSku,
            defaultProvider: formValue.defaultProvider,
            defaultCategory: formValue.defaultCategory,
            defaultSubcategory: formValue.defaultSubcategory
        };

        this.sucursalService.getSucursalById(this.currentSucursalId).subscribe(res => {
            const data = res.data;
            const currentConfig = data.config || {};

            const newConfig = {
                ...currentConfig,
                productForm: productFormConfig
            };

            this.sucursalService.updateSucursal(this.currentSucursalId!, { config: newConfig }).subscribe({
                next: () => {
                    this.toastService.success('Configuración de productos actualizada');
                    this.isLoading = false;
                },
                error: (err) => {
                    console.error('Error', err);
                    this.toastService.error('Error al actualizar');
                    this.isLoading = false;
                }
            });
        });
    }
}
