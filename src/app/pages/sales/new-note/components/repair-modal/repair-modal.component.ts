import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-repair-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './repair-modal.component.html'
})
export class RepairModalComponent {
    @Output() close = new EventEmitter<any>();

    form: FormGroup;

    constructor(private fb: FormBuilder) {
        const today = new Date().toISOString().split('T')[0];
        this.form = this.fb.group({
            description: ['', [Validators.required, Validators.minLength(5)]],
            deliveryDate: [today, Validators.required],
            amount: ['', [Validators.required, Validators.min(0)]]
        });
    }

    onSubmit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const formValue = this.form.value;
        const result = {
            description: formValue.description,
            deliveryDate: formValue.deliveryDate,
            amount: parseFloat(formValue.amount) || 0
        };

        this.close.emit(result);
    }

    onCancel() {
        this.close.emit(null);
    }
}
