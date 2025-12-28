import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MovementTypeService } from '../../../../../shared/services/movement-type.service';
import { ToastService } from '../../../../../shared/services/toast.service';

@Component({
    selector: 'app-manual-movement-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './manual-movement-modal.component.html'
})
export class ManualMovementModalComponent implements OnInit {
    @Output() close = new EventEmitter<any>(); // Emit data on success, or null on cancel

    form: FormGroup;
    movementTypes: any[] = [];
    isLoading = false;

    constructor(
        private fb: FormBuilder,
        private movementTypeService: MovementTypeService,
        private toast: ToastService
    ) {
        this.form = this.fb.group({
            description: ['', [Validators.required, Validators.minLength(3)]],
            amount: ['', [Validators.required, Validators.min(0.01)]],
            movementTypeId: ['', Validators.required]
        });
    }

    ngOnInit() {
        this.loadMovementTypes();
    }

    loadMovementTypes() {
        this.isLoading = true;
        this.movementTypeService.getTypes({ status: 'active' }).subscribe({
            next: (res: any) => {
                this.movementTypes = res.data;
                this.isLoading = false;
            },
            error: () => {
                this.toast.error('Error al cargar tipos de movimiento');
                this.isLoading = false;
            }
        });
    }

    onSubmit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const formValue = this.form.value;
        const selectedType = this.movementTypes.find(t => t._id === formValue.movementTypeId);

        const result = {
            description: formValue.description,
            amount: parseFloat(formValue.amount),
            movementType: selectedType // Pass full object to helper handle logic
        };

        this.close.emit(result);
    }

    onCancel() {
        this.close.emit(null);
    }
}
