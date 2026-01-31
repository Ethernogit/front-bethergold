import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SucursalService } from '../../../shared/services/sucursal.service';
import { ToastService } from '../../../shared/services/toast.service';
import { LoginService } from '../../../shared/services/auth/login.service';

@Component({
    selector: 'app-sucursal-barcode',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './sucursal-barcode.component.html'
})
export class SucursalBarcodeConfigComponent implements OnInit {
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
            pattern: ['{sucursalCode}-{category}-{index}', [Validators.required]]
        });
    }

    ngOnInit(): void {
        this.loadUserData();

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
                this.updatePreview(this.configForm.value);
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading config', error);
                this.toastService.error('Error al cargar la configuración');
                this.isLoading = false;
            }
        });
    }

    insertPlaceholder(placeholder: string) {
        const currentPattern = this.configForm.get('pattern')?.value || '';
        this.configForm.patchValue({ pattern: currentPattern + placeholder });
    }

    updatePreview(formValue: any) {
        this.previewBarcode = this.sucursalService.generatePreview(formValue, 'JOY', 'ORO', 123, 'SUC');
    }

    onSubmit() {
        if (this.configForm.invalid) return;
        if (!this.currentSucursalId) return;

        this.isLoading = true;
        const formValue = this.configForm.value;

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

        const updateData = {
            config: {
                barcode: barcodeConfig
            }
        };

        // Note: Using a deep merge strategy on backend or careful update to not overwrite other config parts
        // Assuming current backend merge strategy handles partial updates for nested objects or we need to be careful.
        // The SucursalService update usually does a merge or replacement. If replacement, we might lose other config parts.
        // Let's check how the backend handles it.
        // Backend text says: `const sucursal = await sucursalService.updateSucursal(...)`
        // Mongoose updates: often use $set.
        // To be safe, we should probably merge in the frontend if the backend replaces the whole `config` object. 
        // But `config` is nested.
        // For now let's assume the backend handles dot notation updates or we send what we have. 
        // Actually, to be safer, I should fetch the existing config first (which I do in load) 
        // but wait, I only fetched specific parts. 
        // Ideally the backend service uses $set for fields provided. 
        // If I send { config: { barcode: ... } }, Mongoose might replace the whole config object if not careful.
        // Let's assume standard behavior: I'll try to just send what's changed if possible, 
        // OR better, I should implement a partial update. 
        // However, looking at the previous code, it sent everything at once. 
        // Here I'm splitting it.
        // I will risk it for now, assuming Mongoose $set on `config.barcode` if I structure it right? 
        // No, usually `findByIdAndUpdate(id, data)` where data is `{ config: { barcode: ... } }` replaces config unless flattening.

        // Let's try to be safe. I'll preserve other config parts by not sending them? 
        // If backend structure is: `config: { barcode: {}, folio: {}, ... }`
        // If I update with `config: { barcode: ... }`, I risk losing folio if backend does generic assignment.
        // I'll trust the process for now, but monitor. A safer way is using dot notation keys if possible, 
        // or fetching full config, merging, and sending back full config.

        // I'll implement the "Fetch full, Merge, Update" pattern here just to be safe.
        // But wait, `loadSucursalConfig` already fetches it. I'll store the `fullConfig` in a property.

        this.sucursalService.getSucursalById(this.currentSucursalId).subscribe(res => {
            const data = res.data;
            const currentConfig = data.config || {};

            const newConfig = {
                ...currentConfig,
                barcode: barcodeConfig
            };

            this.sucursalService.updateSucursal(this.currentSucursalId!, { config: newConfig }).subscribe({
                next: () => {
                    this.toastService.success('Configuración de códigos actualizada');
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
