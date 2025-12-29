import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginService } from '../../../services/auth/login.service';
import { ToastService } from '../../../services/toast.service';

@Component({
    selector: 'app-change-password-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './change-password-modal.component.html'
})
export class ChangePasswordModalComponent {
    @Output() close = new EventEmitter<void>();

    form: FormGroup;
    isLoading = false;
    errorMessage = '';

    showCurrentPassword = false;
    showNewPassword = false;
    showConfirmPassword = false;

    constructor(
        private fb: FormBuilder,
        private loginService: LoginService,
        private toastService: ToastService
    ) {
        this.form = this.fb.group({
            currentPassword: ['', Validators.required],
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });
    }

    passwordMatchValidator(g: FormGroup) {
        return g.get('newPassword')?.value === g.get('confirmPassword')?.value
            ? null : { mismatch: true };
    }

    onSubmit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        const { currentPassword, newPassword } = this.form.value;

        this.loginService.changePassword(currentPassword, newPassword).subscribe({
            next: () => {
                this.isLoading = false;
                this.toastService.success('Contraseña actualizada correctamente');
                this.close.emit();
            },
            error: (err) => {
                this.isLoading = false;
                const msg = err.error?.message || 'Error al actualizar contraseña';
                this.errorMessage = msg;
                this.toastService.error(msg);
                console.error('Change password error:', err);
            }
        });
    }

    onCancel() {
        this.close.emit();
    }
}
