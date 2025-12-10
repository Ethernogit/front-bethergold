import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SucursalService, Sucursal } from '../../../shared/services/sucursal.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../shared/services/auth/login.service';

@Component({
    selector: 'app-sucursal-config',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './sucursal-config.component.html'
})
export class SucursalConfigComponent implements OnInit {
    configForm: FormGroup;
    currentSucursalId: string | null = null;
    isLoading = false;
    previewBarcode = '';

    constructor(
        private fb: FormBuilder,
        private sucursalService: SucursalService,
        private toastService: ToastService,
        private loginService: LoginService
    ) {
        this.configForm = this.fb.group({
            enabled: [true],
            format: ['standard'],
            prefix: ['', [Validators.maxLength(10)]],
            suffix: ['', [Validators.maxLength(10)]],
            categoryLength: [3, [Validators.min(1), Validators.max(10)]],
            subcategoryLength: [3, [Validators.min(1), Validators.max(10)]],
            indexLength: [6, [Validators.min(1), Validators.max(10)]],
            pattern: ['{sucursalCode}-{category}-{index}', [Validators.required]],

            // Product Form Config
            enableSku: [true],
            enableImage: [true],
            enableName: [true],
            enableStock: [true],
            enableSpecifications: [true],
            enableTags: [true],
            requireSku: [false]
        });
    }

    ngOnInit(): void {
        this.loadUserData();

        // Subscribe to form changes to update preview
        this.configForm.valueChanges.subscribe(val => {
            this.updatePreview(val);
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
                const configBarcode = response.data.config?.barcode;
                const configProduct = response.data.config?.productForm;

                if (configBarcode) {
                    this.configForm.patchValue({
                        enabled: configBarcode.enabled,
                        format: configBarcode.format,
                        prefix: configBarcode.prefix || '',
                        suffix: configBarcode.suffix || '',
                        categoryLength: configBarcode.categoryLength || 3,
                        subcategoryLength: configBarcode.subcategoryLength || 3,
                        indexLength: configBarcode.indexLength || 6,
                        pattern: configBarcode.pattern || '{sucursalCode}-{category}-{index}'
                    });
                }

                if (configProduct) {
                    this.configForm.patchValue({
                        enableSku: configProduct.enableSku ?? true,
                        enableImage: configProduct.enableImage ?? true,
                        enableName: configProduct.enableName ?? true,
                        enableStock: configProduct.enableStock ?? true,
                        enableSpecifications: configProduct.enableSpecifications ?? true,
                        enableTags: configProduct.enableTags ?? true,
                        requireSku: configProduct.requireSku ?? false
                    });
                }

                // Update preview only needs barcode values, which are already patched
                this.updatePreview(this.configForm.value);
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading sucursal config', error);
                this.toastService.error('Error al cargar la configuración de la sucursal');
                this.isLoading = false;
            }
        });
    }

    insertPlaceholder(placeholder: string) {
        const currentPattern = this.configForm.get('pattern')?.value || '';
        // A simple append. Ideally this would insert at cursor position but for now this suffices.
        this.configForm.patchValue({ pattern: currentPattern + placeholder });
    }

    updatePreview(formValue: any) {
        // Determine preview logic based on form values
        // Using dummy values: Category='JOY' (Joyeria), Subcategory='ORO', Index='123', Sucursal='SUC'
        this.previewBarcode = this.sucursalService.generatePreview(formValue, 'JOY', 'ORO', 123, 'SUC');
    }

    onSubmit() {
        if (this.configForm.invalid) {
            return;
        }

        if (!this.currentSucursalId) {
            this.toastService.error('No hay sucursal seleccionada para actualizar.');
            return;
        }

        this.isLoading = true;
        const formValue = this.configForm.value;

        // Separate barcode config from product form config
        const barcodeConfig = {
            enabled: formValue.enabled,
            format: formValue.format,
            prefix: formValue.prefix,
            suffix: formValue.suffix,
            categoryLength: formValue.categoryLength,
            subcategoryLength: formValue.subcategoryLength,
            indexLength: formValue.indexLength,
            pattern: formValue.pattern
        };

        const productFormConfig = {
            enableSku: formValue.enableSku,
            enableImage: formValue.enableImage,
            enableName: formValue.enableName,
            enableStock: formValue.enableStock,
            enableSpecifications: formValue.enableSpecifications,
            enableTags: formValue.enableTags,
            requireSku: formValue.requireSku
        };

        const updateData = {
            config: {
                barcode: barcodeConfig,
                productForm: productFormConfig
            }
        };

        this.sucursalService.updateSucursal(this.currentSucursalId, updateData).subscribe({
            next: (response) => {
                this.toastService.success('Configuración actualizada exitosamente');
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error updating sucursal', error);
                this.toastService.error('Error al actualizar la configuración');
                this.isLoading = false;
            }
        });
    }
}
