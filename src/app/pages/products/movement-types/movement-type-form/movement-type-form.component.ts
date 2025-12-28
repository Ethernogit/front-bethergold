import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MovementTypeService } from '../../../../shared/services/movement-type.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-movement-type-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './movement-type-form.component.html'
})
export class MovementTypeFormComponent implements OnInit {
    @Input() typeId: string | null = null;
    @Output() close = new EventEmitter<boolean>();

    form: FormGroup;
    isLoading = false;
    isSaving = false;

    constructor(
        private fb: FormBuilder,
        private service: MovementTypeService,
        private toast: ToastService
    ) {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            description: [''],
            nature: ['in', Validators.required],
            status: ['active']
        });
    }

    ngOnInit() {
        if (this.typeId) {
            this.loadType();
        }
    }

    loadType() {
        this.isLoading = true;
        this.service.getType(this.typeId!).subscribe({
            next: (res: any) => {
                this.form.patchValue(res.data);
                this.isLoading = false;
            },
            error: () => {
                this.toast.error('Error al cargar datos');
                this.closeModal();
            }
        });
    }

    onSubmit() {
        if (this.form.invalid) return;

        this.isSaving = true;
        const data = this.form.value;

        const request = this.typeId
            ? this.service.updateType(this.typeId, data)
            : this.service.createType(data);

        request.subscribe({
            next: () => {
                this.toast.success(this.typeId ? 'Actualizado' : 'Creado');
                this.close.emit(true);
            },
            error: () => {
                this.toast.error('Error al guardar');
                this.isSaving = false;
            }
        });
    }

    closeModal() {
        this.close.emit(false);
    }
}
