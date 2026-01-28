import { Component, EventEmitter, Input, Output, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Note, NoteService, NotePayment } from '../../../../shared/services/note.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-global-payment',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './global-payment.component.html',
    styles: []
})
export class GlobalPaymentComponent {
    // Inputs
    isOpen = input.required<boolean>();
    note = input<Note | null>(null);

    // Outputs
    @Output() close = new EventEmitter<void>();
    @Output() paymentSuccess = new EventEmitter<Note>();

    // State
    isProcessing = signal(false);
    paymentForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private noteService: NoteService
    ) {
        this.paymentForm = this.fb.group({
            amount: [0, [Validators.required, Validators.min(0.01)]],
            method: ['cash', Validators.required],
            reference: ['']
        });
    }

    // Helper to check if field is invalid
    isFieldInvalid(fieldName: string): boolean {
        const field = this.paymentForm.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }

    // Pre-fill amount helper
    setAmount(amount: number) {
        this.paymentForm.patchValue({ amount });
    }

    onSubmit() {
        if (this.paymentForm.invalid || !this.note()?._id) return;

        // Validate amount against balance if we want to be strict, but usually backend handles or we allow overpayment as credit?
        // For now, let's assume we can't pay more than balance? Or maybe we can. 
        // Let's stick to simple form validation.

        const formValue = this.paymentForm.value;
        const paymentData: NotePayment = {
            amount: formValue.amount,
            method: formValue.method,
            reference: formValue.reference || undefined, // undefined if empty string
            date: new Date()
        };

        this.isProcessing.set(true);
        const noteId = this.note()?._id!;

        this.noteService.addPayment(noteId, paymentData)
            .pipe(finalize(() => this.isProcessing.set(false)))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.paymentForm.reset({ method: 'cash' });
                        this.paymentSuccess.emit(response.data);
                        this.close.emit();
                    }
                },
                error: (err) => {
                    console.error('Error adding payment:', err);
                    // Here ideally we'd show a toast error
                }
            });
    }
}
