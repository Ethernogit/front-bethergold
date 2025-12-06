import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../../shared/services/user.service';
import { RoleService } from '../../../shared/services/rbca/role.service';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
// Assuming SelectComponent exists or we use standard select with styling
// I will check the select component structure in the next step if needed, but for now I'll use standard select or try to find the custom one.
// The list_dir showed 'select' dir.
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

@Component({
    selector: 'app-user-create',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        InputFieldComponent,
        LabelComponent,
        PageBreadcrumbComponent
    ],
    templateUrl: './user-create.component.html'
})
export class UserCreateComponent implements OnInit {
    userForm: FormGroup;
    roles: any[] = [];
    isLoading = false;
    error = '';
    success = '';
    isEditMode = false;
    userId: string | null = null;
    pageTitle = 'Crear Usuario';

    constructor(
        private fb: FormBuilder,
        private userService: UserService,
        private roleService: RoleService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.userForm = this.fb.group({
            firstName: ['', [Validators.required]],
            lastName: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(8)]],
            roleId: ['', [Validators.required]]
        });
    }

    ngOnInit(): void {
        this.loadRoles();
        this.route.params.subscribe(params => {
            if (params['id']) {
                this.isEditMode = true;
                this.userId = params['id'];
                this.pageTitle = 'Editar Usuario';
                // Remove password validation in edit mode
                this.userForm.get('password')?.clearValidators();
                this.userForm.get('password')?.updateValueAndValidity();
                this.loadUser(this.userId!);
            }
        });
    }

    loadRoles(): void {
        this.roleService.getAllRoles().subscribe({
            next: (roles: any[]) => {
                // The service returns Role[] directly after map, not {success, data}
                // Wait, let me check the service again.
                // getAllRoles maps response.data. So it returns Role[].
                this.roles = roles;
            },
            error: (err: any) => console.error('Error loading roles', err)
        });
    }

    loadUser(id: string): void {
        this.isLoading = true;
        this.userService.getUser(id).subscribe({
            next: (response: any) => {
                this.isLoading = false;
                if (response.success) {
                    const data = response.data;
                    this.userForm.patchValue({
                        firstName: data.firstName,
                        lastName: data.lastName,
                        email: data.userEmail,
                        roleId: data.roleId
                    });
                }
            },
            error: (err: any) => {
                this.isLoading = false;
                this.error = 'Error al cargar los detalles del usuario';
                console.error(err);
            }
        });
    }

    onSubmit(): void {
        if (this.userForm.invalid) {
            this.userForm.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        this.error = '';
        this.success = '';

        const formValue = this.userForm.value;

        if (this.isEditMode && this.userId) {
            // Update User
            const payload = {
                firstName: formValue.firstName,
                lastName: formValue.lastName,
                email: formValue.email,
                roleId: formValue.roleId
            };

            this.userService.updateUser(this.userId, payload).subscribe({
                next: (res: any) => {
                    this.isLoading = false;
                    this.success = 'Usuario actualizado correctamente!';
                    setTimeout(() => {
                        this.router.navigate(['/users']);
                    }, 1500);
                },
                error: (err: any) => {
                    this.isLoading = false;
                    this.error = err.error?.message || 'Error al actualizar usuario';
                    console.error('Update user error:', err);
                }
            });
        } else {
            // Create User
            // Find the selected role object to get its name
            const selectedRole = this.roles.find(r => r._id === formValue.roleId);

            // Prepare the payload matching backend expectations
            const payload = {
                ...formValue,
                // Backend expects lowercase role name (e.g. 'owner', 'admin')
                role: selectedRole ? selectedRole.name.toLowerCase() : 'employee',
                roleId: formValue.roleId // Ensure roleId is sent
            };

            // We do NOT delete payload.roleId anymore because the backend service needs it 
            // to create the UserOrganization record.

            this.userService.createUser(payload).subscribe({
                next: (res: any) => {
                    this.isLoading = false;
                    this.success = 'Usuario creado correctamente!';
                    this.userForm.reset();
                    setTimeout(() => {
                        this.router.navigate(['/users']);
                    }, 2000);
                },
                error: (err: any) => {
                    this.isLoading = false;
                    this.error = err.error?.message || 'Error al crear usuario';
                    console.error('Create user error:', err);
                }
            });
        }
    }
}
