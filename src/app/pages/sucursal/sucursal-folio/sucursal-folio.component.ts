import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SucursalService } from '../../../shared/services/sucursal.service';
import { ToastService } from '../../../shared/services/toast.service';
import { LoginService } from '../../../shared/services/auth/login.service';

@Component({
    selector: 'app-sucursal-folio',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './sucursal-folio.component.html'
})
export class SucursalFolioConfigComponent implements OnInit {
    configForm: FormGroup;
    currentSucursalId: string | null = null;
    isLoading = false;

    constructor(
        private fb: FormBuilder,
        private sucursalService: SucursalService,
        private toastService: ToastService,
        private loginService: LoginService
    ) {
        this.configForm = this.fb.group({
            folioEnabled: [true],
            folioPrefix: ['', [Validators.maxLength(10)]],
            folioPadding: [6, [Validators.min(1), Validators.max(12)]],
            folioNextNumber: [null, [Validators.min(1)]],
            emailSenderName: ['', [Validators.maxLength(100)]],
            emailSenderPrefix: ['', [Validators.maxLength(40), Validators.pattern('^[a-z0-9-]+$')]]
        });
    }

    ngOnInit(): void {
        this.loadUserData();
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
                const config = response.data.config as any;
                const configFolio = config?.folio;
                const emailConfig = config?.emailConfig;

                if (configFolio) {
                    this.configForm.patchValue({
                        folioEnabled: configFolio.enabled ?? true,
                        folioPrefix: configFolio.prefix || '',
                        folioPadding: configFolio.padding || 6
                    });
                }
                if (emailConfig) {
                    this.configForm.patchValue({
                        emailSenderName: emailConfig.senderName || '',
                        emailSenderPrefix: emailConfig.senderPrefix || ''
                    });
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

        const folioConfig = {
            enabled: formValue.folioEnabled,
            prefix: formValue.folioPrefix,
            padding: formValue.folioPadding,
            nextNumber: formValue.folioNextNumber
        };

        const emailConfig = {
            enabled: true,
            senderName: formValue.emailSenderName,
            senderPrefix: formValue.emailSenderPrefix
        };

        this.sucursalService.getSucursalById(this.currentSucursalId).subscribe(res => {
            const data = res.data;
            const currentConfig = data.config || {};

            const newConfig = {
                ...currentConfig,
                folio: folioConfig,
                emailConfig: emailConfig
            };

            this.sucursalService.updateSucursal(this.currentSucursalId!, { config: newConfig }).subscribe({
                next: () => {
                    this.toastService.success('Configuración de folios actualizada');
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
