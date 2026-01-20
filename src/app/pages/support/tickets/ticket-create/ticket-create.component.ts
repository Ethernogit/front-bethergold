import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupportService } from '../../../../services/support.service';

@Component({
    selector: 'app-ticket-create',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './ticket-create.component.html',
    styles: []
})
export class TicketCreateComponent {
    @Output() close = new EventEmitter<boolean>();

    ticketForm: FormGroup;
    isSubmitting = false;

    constructor(
        private fb: FormBuilder,
        private supportService: SupportService
    ) {
        this.ticketForm = this.fb.group({
            title: ['', [Validators.required, Validators.maxLength(100)]],
            type: ['bug', Validators.required],
            description: ['', Validators.required],
            priority: ['low']
        });
    }

    onSubmit() {
        if (this.ticketForm.invalid) return;

        this.isSubmitting = true;
        this.supportService.createTicket(this.ticketForm.value).subscribe({
            next: () => {
                this.isSubmitting = false;
                this.close.emit(true);
            },
            error: (err) => {
                console.error('Error creating ticket', err);
                this.isSubmitting = false;
                // Ideally show toast error here
            }
        });
    }

    onCancel() {
        this.close.emit(false);
    }
}
