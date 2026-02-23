import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProviderService } from '../../../shared/services/provider.service';
import { ToastService } from '../../../shared/services/toast.service';
import { GoldType, MaterialType } from '../../../shared/interfaces/provider.interfaces';
import { finalize, forkJoin } from 'rxjs';

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
    materialTypes = signal<MaterialType[]>([]);
    loading = signal(false);
    showModal = signal(false);
    editingType = signal<GoldType | null>(null);

    goldForm: FormGroup;

    constructor() {
        this.goldForm = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(50)]],
            status: ['active'],
            materialType: [null]
        });
    }

    ngOnInit() {
        this.loadGoldTypes();
    }

    loadGoldTypes() {
        this.loading.set(true);
        // Fetch types and materials
        forkJoin({
            gold: this.providerService.getGoldTypes(),
            materials: this.providerService.getMaterialTypes()
        })
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res) => {
                    if (res.gold.success) {
                        this.goldTypes.set(res.gold.data);
                    }
                    if (res.materials.success) {
                        this.materialTypes.set(res.materials.data.filter(m => m.status === 'active'));
                    }
                },
                error: (err) => {
                    console.error('Error loading data', err);
                    this.toastService.error('Error al cargar datos necesarios');
                }
            });
    }

    openCreateModal() {
        this.editingType.set(null);
        this.goldForm.reset({ status: 'active', materialType: '' });
        this.showModal.set(true);
    }

    openEditModal(type: GoldType) {
        this.editingType.set(type);
        this.goldForm.patchValue({
            name: type.name,
            status: type.status,
            materialType: type.materialType ? (typeof type.materialType === 'string' ? type.materialType : type.materialType._id || type.materialType.id) : ''
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
        const formData = { ...this.goldForm.value };

        // Handle optional material selection
        if (!formData.materialType || formData.materialType === '') {
            formData.materialType = null;
        }

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
                                ? 'Variante actualizada'
                                : 'Variante creada'
                        );
                        this.closeModal();
                        this.loadGoldTypes();
                    }
                },
                error: (err) => {
                    console.error('Error saving gold type', err);
                    this.toastService.error(err.error?.message || 'Error al guardar variante');
                }
            });
    }

    deleteType(type: GoldType) {
        if (!confirm(`¿Estás seguro de eliminar la variante "${type.name}"?`)) return;

        this.loading.set(true);
        this.providerService.deleteGoldType(type.id || type._id!)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res) => {
                    if (res.success) {
                        this.toastService.success('Variante eliminada');
                        this.loadGoldTypes();
                    }
                },
                error: (err) => {
                    console.error('Error deleting gold type', err);
                    this.toastService.error(err.error?.message || 'Error al eliminar variante');
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

    getMaterialName(type: GoldType): string {
        if (!type.materialType) return 'Global (Aplica a todos)';
        if (typeof type.materialType === 'string') {
            const mat = this.materialTypes().find(m => (m.id || m._id) === type.materialType);
            return mat?.name || 'Material desconocido';
        }
        return type.materialType.name || 'Desconocido';
    }
}
