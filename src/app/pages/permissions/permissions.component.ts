import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { PermissionFormComponent } from '../../shared/components/admin/permissions/permission-form.component';
import { PermissionsListComponent } from '../../shared/components/admin/permissions/permissions-list.component';
import { Permission } from '../../shared/interfaces/auth.interfaces';
import { PermissionService } from '../../shared/services/auth/permission.service';

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

  constructor(private permissionService: PermissionService) {}

  ngOnInit() {
    this.loadPermissions();
  }

  async loadPermissions() {
    this.isLoadingList = true;
    try {
      // Simular carga de datos - aquí conectarías con tu API
      await this.delay(1000);
      
      // Datos de ejemplo
      this.permissions = [
        {
          id: '1',
          name: 'CREATE_USER',
          description: 'Permite crear nuevos usuarios en el sistema',
          module: 'users',
          action: 'create',
          isActive: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15')
        },
        {
          id: '2',
          name: 'READ_PRODUCTS',
          description: 'Permite ver la lista de productos',
          module: 'products',
          action: 'read',
          isActive: true,
          createdAt: new Date('2024-01-16'),
          updatedAt: new Date('2024-01-16')
        },
        {
          id: '3',
          name: 'UPDATE_ORDERS',
          description: 'Permite modificar órdenes existentes',
          module: 'orders',
          action: 'update',
          isActive: false,
          createdAt: new Date('2024-01-17'),
          updatedAt: new Date('2024-01-17')
        },
        {
          id: '4',
          name: 'DELETE_PROVIDER',
          description: 'Permite eliminar proveedores del sistema',
          module: 'providers',
          action: 'delete',
          isActive: true,
          createdAt: new Date('2024-01-18'),
          updatedAt: new Date('2024-01-18')
        }
      ];
    } catch (error) {
      console.error('Error loading permissions:', error);
      // Aquí podrías mostrar un toast de error
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
      // Simular llamada a API
      await this.delay(1500);

      if (this.editMode && permissionData.id) {
        // Actualizar permiso existente
        const index = this.permissions.findIndex(p => p.id === permissionData.id);
        if (index !== -1) {
          this.permissions[index] = {
            ...permissionData,
            updatedAt: new Date()
          };
        }
        console.log('Permiso actualizado:', permissionData);
      } else {
        // Crear nuevo permiso
        const newPermission: Permission = {
          ...permissionData,
          id: (Date.now()).toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.permissions.unshift(newPermission);
        console.log('Nuevo permiso creado:', newPermission);
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
      // Simular llamada a API
      await this.delay(500);
      
      const index = this.permissions.findIndex(p => p.id === permission.id);
      if (index !== -1) {
        this.permissions[index] = {
          ...this.permissions[index],
          isActive: !this.permissions[index].isActive,
          updatedAt: new Date()
        };
      }
      
      console.log('Permiso toggle:', this.permissions[index]);
      // Aquí podrías mostrar un toast de éxito
      
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
      // Simular llamada a API
      await this.delay(1000);
      
      this.permissions = this.permissions.filter(p => p.id !== this.permissionToDelete!.id);
      
      console.log('Permiso eliminado:', this.permissionToDelete);
      // Aquí podrías mostrar un toast de éxito
      
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