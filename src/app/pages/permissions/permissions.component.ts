import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { PermissionFormComponent } from '../../shared/components/admin/permissions/permission-form.component';
import { PermissionsListComponent } from '../../shared/components/admin/permissions/permissions-list.component';
import { Permission } from '../../shared/interfaces/auth.interfaces';
import { PermisosService } from '../../shared/services/rbca/permisos.service';
import { LoginService } from '../../shared/services/auth/login.service';

@Component({
  selector: 'app-permissions',
  imports: [
    CommonModule,
    FormsModule,
    PageBreadcrumbComponent,
    PermissionFormComponent,
    PermissionsListComponent,
  ],
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.css']
})
export class PermissionsComponent {
  permissions: Permission[] = [];
  selectedPermission: Permission | null = null;
  showForm = false;
  editMode = false;
  isLoading = false;
  isLoadingList = false;
  showDeleteModal = false;
  permissionToDelete: Permission | null = null;

  constructor(
    private permisosService: PermisosService,
    private loginService: LoginService
  ) {}

  ngOnInit() {
    // Verificar autenticación antes de cargar permisos
    if (this.loginService.isAuthenticated()()) {
      console.log('Usuario autenticado, cargando permisos...');
      console.log('Token:', this.loginService.getAccessToken()?.substring(0, 20) + '...');
      this.loadPermissions();
    } else {
      console.error('Usuario no autenticado');
    }
  }

  async loadPermissions() {
    this.isLoadingList = true;
    try {
      console.log('Iniciando carga de permisos...');
      const response = await this.permisosService.getPermissions().toPromise();
      console.log('Respuesta del servidor:', response);
      
      if (response?.success) {
        this.permissions = response.data;
        console.log('Permisos cargados correctamente:', this.permissions.length);
      } else {
        console.error('Error: Response not successful');
        this.permissions = [];
      }
    } catch (error: any) {
      console.error('Error loading permissions:', error);
      
      // Manejar errores específicos
      if (error.status === 401) {
        console.error('Error de autenticación: Token no válido o expirado');
        // Aquí podrías redirigir al login o mostrar un mensaje específico
      } else if (error.status === 403) {
        console.error('Error de permisos: No tienes acceso a esta funcionalidad');
      }
      
      this.permissions = [];
      // Aquí podrías mostrar un toast de error con el mensaje específico
    } finally {
      this.isLoadingList = false;
    }
  }

  onNewPermission() {
    this.selectedPermission = null;
    this.editMode = false;
    this.showForm = true;
  }

  onEditPermission(permission: Permission) {
    this.selectedPermission = { ...permission };
    this.editMode = true;
    this.showForm = true;
  }

  async onPermissionSubmit(permissionData: Permission) {
    this.isLoading = true;
    try {
      if (this.editMode && permissionData.id) {
        // Actualizar permiso existente
        const response = await this.permisosService.updatePermission(permissionData.id, permissionData).toPromise();
        if (response?.success) {
          const index = this.permissions.findIndex(p => p.id === permissionData.id);
          if (index !== -1) {
            this.permissions[index] = response.data;
          }
          console.log('Permiso actualizado:', response.data);
        }
      } else {
        // Crear nuevo permiso
        const { id, createdAt, updatedAt, ...newPermissionData } = permissionData;
        const response = await this.permisosService.createPermission(newPermissionData).toPromise();
        if (response?.success) {
          this.permissions.unshift(response.data);
          console.log('Nuevo permiso creado:', response.data);
        }
      }

      this.showForm = false;
      this.selectedPermission = null;
      
      // Aquí podrías mostrar un toast de éxito
      
    } catch (error) {
      console.error('Error saving permission:', error);
      // Aquí podrías mostrar un toast de error
    } finally {
      this.isLoading = false;
    }
  }

  onFormCancel() {
    this.showForm = false;
    this.selectedPermission = null;
    this.editMode = false;
  }

  async onTogglePermission(permission: Permission) {
    try {
      const response = await this.permisosService.togglePermission(permission.id!).toPromise();
      if (response?.success) {
        const index = this.permissions.findIndex(p => p.id === permission.id);
        if (index !== -1) {
          this.permissions[index] = response.data;
        }
        console.log('Permiso toggle:', response.data);
        // Aquí podrías mostrar un toast de éxito
      }
    } catch (error) {
      console.error('Error toggling permission:', error);
      // Aquí podrías mostrar un toast de error
    }
  }

  onDeletePermission(permission: Permission) {
    this.permissionToDelete = permission;
    this.showDeleteModal = true;
  }

  async confirmDelete() {
    if (!this.permissionToDelete) return;

    this.isLoading = true;
    try {
      const response = await this.permisosService.deletePermission(this.permissionToDelete.id!).toPromise();
      if (response?.success) {
        this.permissions = this.permissions.filter(p => p.id !== this.permissionToDelete!.id);
        console.log('Permiso eliminado:', this.permissionToDelete);
        // Aquí podrías mostrar un toast de éxito
      }
    } catch (error) {
      console.error('Error deleting permission:', error);
      // Aquí podrías mostrar un toast de error
    } finally {
      this.isLoading = false;
      this.showDeleteModal = false;
      this.permissionToDelete = null;
    }
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.permissionToDelete = null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}