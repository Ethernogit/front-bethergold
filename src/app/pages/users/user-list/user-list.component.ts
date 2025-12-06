import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { UserService } from '../../../shared/services/user.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PageBreadcrumbComponent],
  template: `
    <app-page-breadcrumb
      [pageTitle]="'Usuarios'"
    ></app-page-breadcrumb>

    <div class="flex flex-col gap-10">
      <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-gray-800 dark:bg-gray-900">
        <!-- Header -->
        <div class="border-b border-stroke px-7 py-4 dark:border-gray-800">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 class="font-medium text-black dark:text-white">
              Lista de Usuarios
            </h3>
            <a
              routerLink="/users/create"
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-center font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all duration-200"
            >
              <svg class="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 4.5V15.5M4.5 10H15.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
              Crear Usuario
            </a>
          </div>
        </div>

        <!-- Table -->
        <div class="p-7">
          <div class="overflow-x-auto">
            <table class="w-full table-auto">
              <thead>
                <tr class="bg-gray-50 text-left dark:bg-gray-800">
                  <th class="px-4 py-4 font-medium text-black dark:text-white">Nombre</th>
                  <th class="px-4 py-4 font-medium text-black dark:text-white">Email</th>
                  <th class="px-4 py-4 font-medium text-black dark:text-white">Rol</th>
                  <th class="px-4 py-4 font-medium text-black dark:text-white">Estado</th>
                  <th class="px-4 py-4 font-medium text-black dark:text-white">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @if (loading) {
                  <tr>
                    <td colspan="5" class="text-center py-4">Cargando...</td>
                  </tr>
                } @else if (users.length === 0) {
                  <tr>
                    <td colspan="5" class="text-center py-4">No hay usuarios registrados</td>
                  </tr>
                } @else {
                  @for (user of users; track user._id) {
                    <tr class="border-b border-stroke dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td class="px-4 py-5">
                        <p class="text-black dark:text-white">{{ user.profile?.firstName }} {{ user.profile?.lastName }}</p>
                      </td>
                      <td class="px-4 py-5">
                        <p class="text-black dark:text-white">{{ user.email }}</p>
                      </td>
                      <td class="px-4 py-5">
                        <p class="text-sm text-gray-600 dark:text-gray-400 capitalize">{{ user.role }}</p>
                      </td>
                      <td class="px-4 py-5">
                        <span class="inline-flex rounded-full px-3 py-1 text-sm font-medium"
                          [ngClass]="{
                            'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400': user.status === 'active',
                            'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400': user.status === 'inactive' || user.status === 'suspended',
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-400': user.status === 'pending'
                          }">
                          {{ user.status }}
                        </span>
                      </td>
                      <td class="px-4 py-5">
                        <div class="flex items-center gap-2">
                          <button [routerLink]="['/users/edit', user._id]" 
                            class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-blue-400 transition-colors" title="Editar">
                            <i class="fas fa-edit"></i>
                          </button>
                          <button (click)="openPasswordModal(user._id)"
                            class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-yellow-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-yellow-400 transition-colors" title="Cambiar Contraseña">
                            <i class="fas fa-key"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Password Change Modal -->
    @if (showPasswordModal) {
      <div class="fixed left-0 top-0 z-999999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5">
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

  users: any[] = [];
  loading = false;

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
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.success) {
          this.users = response.data.map((item: any) => ({
            _id: item.userId._id,
            email: item.userId.email,
            profile: item.userId.profile,
            role: item.roleId ? item.roleId.name : 'N/A',
            status: item.status
          }));
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading users', error);
      }
    });
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
