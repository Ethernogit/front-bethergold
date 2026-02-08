import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProviderService } from '../../../shared/services/provider.service';
import { ToastService } from '../../../shared/services/toast.service';
import { GoldType } from '../../../shared/interfaces/provider.interfaces';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-gold-types',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './gold-types.component.html'
})
export class GoldTypesComponent implements OnInit {
    private providerService = inject(ProviderService);
    private toastService = inject(ToastService);
    private fb = inject(FormBuilder);

    goldTypes = signal<GoldType[]>([]);
    loading = signal(false);
    showModal = signal(false);
    editingType = signal<GoldType | null>(null);

    goldForm: FormGroup;

    constructor() {
        this.goldForm = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(50)]],
            status: ['active']
        });
    }

    ngOnInit() {
        this.loadGoldTypes();
    }

    loadGoldTypes() {
        this.loading.set(true);
        // Fetch all types including global ones
        this.providerService.getGoldTypes()
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res) => {
                    if (res.success) {
                        this.goldTypes.set(res.data);
                    }
                },
                error: (err) => {
                    console.error('Error loading gold types', err);
                    this.toastService.error('Error al cargar tipos de oro');
                }
            });
    }

    openCreateModal() {
        this.editingType.set(null);
        this.goldForm.reset({ status: 'active' });
        this.showModal.set(true);
    }

    openEditModal(type: GoldType) {
        this.editingType.set(type);
        this.goldForm.patchValue({
            name: type.name,
            status: type.status
        });
        this.showModal.set(true);
    }

    closeModal() {
        this.showModal.set(false);
        this.editingType.set(null);
        this.goldForm.reset();
    }

    saveType() {
        if (this.goldForm.invalid) {
            this.goldForm.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        const formData = this.goldForm.value;

        const request = this.editingType()
            ? this.providerService.updateGoldType(this.editingType()!.id || this.editingType()!._id!, formData)
            : this.providerService.createGoldType(formData);

        request
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res) => {
                    if (res.success) {
                        this.toastService.success(
                            this.editingType()
                                ? 'Tipo de oro actualizado'
                                : 'Tipo de oro creado'
                        );
                        this.closeModal();
                        this.loadGoldTypes();
                    }
                },
                error: (err) => {
                    console.error('Error saving gold type', err);
                    this.toastService.error(err.error?.message || 'Error al guardar tipo de oro');
                }
            });
    }

    deleteType(type: GoldType) {
        if (!confirm(`¿Estás seguro de eliminar el tipo "${type.name}"?`)) return;

        this.loading.set(true);
        this.providerService.deleteGoldType(type.id || type._id!)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res) => {
                    if (res.success) {
                        this.toastService.success('Tipo de oro eliminado');
                        this.loadGoldTypes();
                    }
                },
                error: (err) => {
                    console.error('Error deleting gold type', err);
                    this.toastService.error(err.error?.message || 'Error al eliminar tipo de oro');
                }
            });
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.goldForm.get(fieldName);
        return !!(field && field.invalid && field.touched);
    }

    getFieldError(fieldName: string): string {
        const field = this.goldForm.get(fieldName);
        if (field?.errors) {
            if (field.errors['required']) return 'Este campo es requerido';
            if (field.errors['maxlength']) return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
        }
        return '';
    }
}
