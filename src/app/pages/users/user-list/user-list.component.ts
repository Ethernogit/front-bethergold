import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { UserService } from '../../../shared/services/user.service';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
    template: `
<!-- User List Component -->
<div class="mx-auto max-w-screen-2xl h-[calc(100vh-50px)] flex flex-col overflow-hidden">
    <div class="flex flex-col gap-4 h-full">
        <div
            class="rounded-sm border border-stroke bg-white shadow-default dark:border-gray-800 dark:bg-gray-900 flex flex-col h-full">
            <!-- Header -->
            <div class="border-b border-stroke px-4 py-3 dark:border-gray-800 sm:px-6 shrink-0">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h3 class="font-medium text-black dark:text-white">
                        Lista de Usuarios
                    </h3>
                    <a routerLink="/users/create"
                        class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-center font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all duration-200">
                        <svg class="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 4.5V15.5M4.5 10H15.5" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" />
                        </svg>
                        Crear Usuario
                    </a>
                </div>
            </div>

            <!-- Loading State -->
            @if (loading()) {
            <div class="flex justify-center py-10">
                <div
                    class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent">
                </div>
            </div>
            }

            <!-- Table -->
            @if (!loading()) {
            <div class="flex-1 overflow-y-auto p-0 z-0">
                @if (users().length > 0) {
                <div class="relative">
                    <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead
                            class="sticky top-0 z-10 bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-400 shadow-sm">
                            <tr>
                                <th class="px-6 py-4 font-medium">Nombre</th>
                                <th class="px-6 py-4 font-medium">Email</th>
                                <th class="px-6 py-4 font-medium">Rol</th>
                                <th class="px-6 py-4 font-medium">Estado</th>
                                <th class="px-6 py-4 font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                            @for (user of paginatedUsers(); track user._id) {
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td class="px-6 py-4">
                                    <p class="font-medium text-black dark:text-white">{{ user.profile?.firstName }} {{
                                        user.profile?.lastName }}</p>
                                </td>
                                <td class="px-6 py-4">
                                    <p class="text-black dark:text-white">{{ user.email }}</p>
                                </td>
                                <td class="px-6 py-4">
                                    <p class="text-sm text-gray-600 dark:text-gray-400 capitalize">{{ user.role }}</p>
                                </td>
                                <td class="px-6 py-4">
                                    <span class="inline-flex rounded-full px-3 py-1 text-xs font-medium" [ngClass]="{
                                      'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400': user.status === 'active',
                                      'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400': user.status === 'inactive' || user.status === 'suspended',
                                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-400': user.status === 'pending'
                                    }">
                                        {{ user.status }}
                                    </span>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-2">
                                        <button [routerLink]="['/users/edit', user._id]"
                                            class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-blue-400 transition-colors"
                                            title="Editar">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button (click)="openPasswordModal(user._id)"
                                            class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-yellow-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-yellow-400 transition-colors"
                                            title="Cambiar Contraseña">
                                            <i class="fas fa-key"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            }
                        </tbody>
                    </table>
                </div>
                } @else {
                <div class="flex flex-col items-center justify-center py-12 text-center">
                    <div class="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
                        <i class="fas fa-users text-3xl text-gray-400"></i>
                    </div>
                    <h5 class="mb-2 text-lg font-medium text-gray-900 dark:text-white">No hay usuarios registrados</h5>
                    <a routerLink="/users/create"
                        class="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all">
                        <svg class="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 4.5V15.5M4.5 10H15.5" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" />
                        </svg>
                        <span>Crear Usuario</span>
                    </a>
                </div>
                }
            </div>
            }

            <!-- Pagination Controls -->
            <div
                class="border-t border-stroke px-4 py-3 dark:border-gray-800 sm:px-6 shrink-0 bg-white dark:bg-gray-900 rounded-b-sm">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div class="flex items-center gap-2">
                        <p class="text-sm font-medium text-black dark:text-white">Items por página:</p>
                        <select [ngModel]="itemsPerPage()" (ngModelChange)="onLimitChange($event)"
                            class="rounded border border-stroke bg-transparent px-2 py-1 outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white transition focus:border-brand-500 active:border-brand-500">
                            <option [value]="10" class="dark:bg-gray-700 dark:text-white">10</option>
                            <option [value]="25" class="dark:bg-gray-700 dark:text-white">25</option>
                            <option [value]="50" class="dark:bg-gray-700 dark:text-white">50</option>
                            <option [value]="100" class="dark:bg-gray-700 dark:text-white">100</option>
                        </select>
                    </div>

                    <div class="flex items-center gap-4">
                        <p class="text-sm font-medium text-black dark:text-white">
                            Página {{ currentPage() }} de {{ totalPages() || 1 }}
                        </p>
                        <div class="flex items-center gap-2">
                            <button (click)="onPageChange(currentPage() - 1)" [disabled]="currentPage() === 1"
                                class="flex items-center justify-center rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition">
                                <svg class="fill-current text-black dark:text-white" width="20" height="20"
                                    viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fill-rule="evenodd" clip-rule="evenodd"
                                        d="M12.7071 5.29289C13.0976 5.68342 13.0976 6.31658 12.7071 6.70711L9.41421 10L12.7071 13.2929C13.0976 13.6834 13.0976 14.3166 12.7071 14.7071C12.3166 15.0976 11.6834 15.0976 11.2929 14.7071L7.29289 10.7071C6.90237 10.3166 6.90237 9.68342 7.29289 9.29289L11.2929 5.29289C11.6834 4.90237 12.3166 4.90237 12.7071 5.29289Z" />
                                </svg>
                            </button>
                            <button (click)="onPageChange(currentPage() + 1)" [disabled]="currentPage() >= totalPages()"
                                class="flex items-center justify-center rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition">
                                <svg class="fill-current text-black dark:text-white" width="20" height="20"
                                    viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fill-rule="evenodd" clip-rule="evenodd"
                                        d="M7.29289 14.7071C6.90237 14.3166 6.90237 13.6834 7.29289 13.2929L10.5858 10L7.29289 6.70711C6.90237 6.31658 6.90237 5.68342 7.29289 5.29289C7.68342 4.90237 8.31658 4.90237 8.70711 5.29289L12.7071 9.29289C13.0976 9.68342 13.0976 10.3166 12.7071 10.7071L8.70711 14.7071C8.31658 15.0976 7.68342 15.0976 7.29289 14.7071Z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Password Change Modal -->
@if (showPasswordModal) {
<div
    class="fixed left-0 top-0 z-999999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5">
    <div class="w-full max-w-142.5 rounded-lg bg-white px-8 py-12 text-center dark:bg-gray-900 md:px-17.5 md:py-15">
        <h3 class="pb-2 text-xl font-bold text-black dark:text-white sm:text-2xl">
            Cambiar Contraseña
        </h3>

        <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()" class="mt-6.5">
            <div class="mb-5.5">
                <label class="mb-3 block text-left text-sm font-medium text-black dark:text-white">
                    Nueva Contraseña <span class="text-meta-1">*</span>
                </label>
                <input type="password" formControlName="password" placeholder="Mínimo 8 caracteres"
                    class="w-full rounded-lg border border-gray-300 bg-gray-50 px-5 py-3 font-medium outline-none transition focus:border-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-brand-500 dark:focus:ring-brand-500"
                    [class.border-red-500]="passwordForm.get('password')?.touched && passwordForm.get('password')?.invalid" />
                @if (passwordForm.get('password')?.touched && passwordForm.get('password')?.invalid) {
                <p class="mt-1 text-left text-xs text-red-500">La contraseña debe tener al menos 8 caracteres</p>
                }
            </div>

            <div class="flex gap-4.5">
                <button type="button" (click)="closePasswordModal()"
                    class="flex-1 rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all">
                    Cancelar
                </button>
                <button type="submit" [disabled]="passwordLoading"
                    class="flex-1 rounded-lg bg-brand-500 px-6 py-3 font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all">
                    {{ passwordLoading ? 'Guardando...' : 'Guardar' }}
                </button>
            </div>
            @if (passwordError) {
            <div class="mt-4 text-sm text-red-500">{{ passwordError }}</div>
            }
            @if (passwordSuccess) {
            <div class="mt-4 text-sm text-green-500">{{ passwordSuccess }}</div>
            }
        </form>
    </div>
</div>
}
`
})
export class UserListComponent implements OnInit {
    private userService = inject(UserService);
    private fb = inject(FormBuilder);

    // Users State
    users = signal<any[]>([]);
    loading = signal(false);

    // Pagination (Client-side)
    currentPage = signal(1);
    itemsPerPage = signal(10);

    paginatedUsers = computed(() => {
        const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
        const endIndex = startIndex + this.itemsPerPage();
        return this.users().slice(startIndex, endIndex);
    });

    totalPages = computed(() => Math.ceil(this.users().length / this.itemsPerPage()));

    // Password Modal State
    showPasswordModal = false;
    selectedUserId: string | null = null;
    passwordForm: FormGroup;
    passwordLoading = false;
    passwordError = '';
    passwordSuccess = '';

    constructor() {
        this.passwordForm = this.fb.group({
            password: ['', [Validators.required, Validators.minLength(8)]]
        });
    }

    ngOnInit() {
        this.loadUsers();
    }

    loadUsers() {
        this.loading.set(true);
        this.userService.getUsers().subscribe({
            next: (response: any) => {
                this.loading.set(false);
                if (response.success) {
                    const mappedUsers = response.data.map((item: any) => ({
                        _id: item.userId._id,
                        email: item.userId.email,
                        profile: item.userId.profile,
                        role: item.roleId ? item.roleId.name : 'N/A',
                        status: item.status
                    }));
                    this.users.set(mappedUsers);
                }
            },
            error: (error) => {
                this.loading.set(false);
                console.error('Error loading users', error);
            }
        });
    }

    onPageChange(page: number) {
        this.currentPage.set(page);
    }

    onLimitChange(limit: number) {
        this.itemsPerPage.set(limit);
        this.currentPage.set(1);
    }

    openPasswordModal(userId: string) {
        this.selectedUserId = userId;
        this.showPasswordModal = true;
        this.passwordForm.reset();
        this.passwordError = '';
        this.passwordSuccess = '';
    }

    closePasswordModal() {
        this.showPasswordModal = false;
        this.selectedUserId = null;
    }

    onChangePassword() {
        if (this.passwordForm.invalid || !this.selectedUserId) {
            this.passwordForm.markAllAsTouched();
            return;
        }

        this.passwordLoading = true;
        this.passwordError = '';
        this.passwordSuccess = '';

        const newPassword = this.passwordForm.get('password')?.value;

        this.userService.changePassword(this.selectedUserId, newPassword).subscribe({
            next: () => {
                this.passwordLoading = false;
                this.passwordSuccess = 'Contraseña actualizada correctamente';
                setTimeout(() => {
                    this.closePasswordModal();
                }, 1500);
            },
            error: (err) => {
                this.passwordLoading = false;
                this.passwordError = err.error?.message || 'Error al actualizar la contraseña';
            }
        });
    }
}
