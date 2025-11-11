import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { RoleFormComponent } from '../../shared/components/admin/roles/role-form.component';
import { RolesListComponent } from '../../shared/components/admin/roles/roles-list.component';
import { Permission, Role } from '../../shared/interfaces/auth.interfaces';
import { PermissionService } from '../../shared/services/auth/permission.service';

@Component({
  selector: 'app-roles',
  imports: [
    CommonModule,
    FormsModule,
    PageBreadcrumbComponent,
    RoleFormComponent,
    RolesListComponent,
  ],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class RolesComponent {
  roles: Role[] = [];
  availablePermissions: Permission[] = [];
  selectedRole: Role | null = null;
  showForm = false;
  editMode = false;
  isLoading = false;
  isLoadingList = false;
  showDeleteModal = false;
  roleToDelete: Role | null = null;

  constructor(private permissionService: PermissionService) {}

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoadingList = true;
    try {
      await Promise.all([
        this.loadRoles(),
        this.loadPermissions()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.isLoadingList = false;
    }
  }

  async loadRoles() {
    // Simular carga de datos - aquí conectarías con tu API de roles
    await this.delay(1000);
    
    // Datos de ejemplo
    this.roles = [
      {
        id: '1',
        name: 'Super Administrador',
        description: 'Acceso completo a todas las funcionalidades del sistema',
        permissions: ['1', '2', '3', '4'],
        isActive: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: '2',
        name: 'Editor',
        description: 'Puede crear, editar y ver contenido, pero no eliminar',
        permissions: ['1', '2', '3'],
        isActive: true,
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16')
      },
      {
        id: '3',
        name: 'Viewer',
        description: 'Solo puede ver contenido, sin permisos de edición',
        permissions: ['2'],
        isActive: false,
        createdAt: new Date('2024-01-17'),
        updatedAt: new Date('2024-01-17')
      }
    ];
  }

  async loadPermissions() {
    try {
      this.availablePermissions = await this.permissionService.getAllPermissions().toPromise() || [];
    } catch (error) {
      console.error('Error loading permissions:', error);
      // Fallback con datos de ejemplo si falla la API
      this.availablePermissions = [
        {
          id: '1',
          name: 'CREATE_USER',
          description: 'Permite crear nuevos usuarios en el sistema',
          module: 'users',
          action: 'create',
          isActive: true
        },
        {
          id: '2',
          name: 'READ_PRODUCTS',
          description: 'Permite ver la lista de productos',
          module: 'products',
          action: 'read',
          isActive: true
        },
        {
          id: '3',
          name: 'UPDATE_ORDERS',
          description: 'Permite modificar órdenes existentes',
          module: 'orders',
          action: 'update',
          isActive: true
        },
        {
          id: '4',
          name: 'DELETE_PROVIDER',
          description: 'Permite eliminar proveedores del sistema',
          module: 'providers',
          action: 'delete',
          isActive: true
        }
      ];
    }
  }

  onNewRole() {
    this.selectedRole = null;
    this.editMode = false;
    this.showForm = true;
  }

  onEditRole(role: Role) {
    this.selectedRole = { ...role };
    this.editMode = true;
    this.showForm = true;
  }

  async onRoleSubmit(roleData: Role) {
    this.isLoading = true;
    try {
      // Simular llamada a API
      await this.delay(1500);

      if (this.editMode && roleData.id) {
        // Actualizar rol existente
        const index = this.roles.findIndex(r => r.id === roleData.id);
        if (index !== -1) {
          this.roles[index] = {
            ...roleData,
            updatedAt: new Date()
          };
        }
        console.log('Rol actualizado:', roleData);
      } else {
        // Crear nuevo rol
        const newRole: Role = {
          ...roleData,
          id: (Date.now()).toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.roles.unshift(newRole);
        console.log('Nuevo rol creado:', newRole);
      }

      this.showForm = false;
      this.selectedRole = null;
      
      // Aquí podrías mostrar un toast de éxito
      
    } catch (error) {
      console.error('Error saving role:', error);
      // Aquí podrías mostrar un toast de error
    } finally {
      this.isLoading = false;
    }
  }

  onFormCancel() {
    this.showForm = false;
    this.selectedRole = null;
    this.editMode = false;
  }

  async onToggleRole(role: Role) {
    try {
      // Simular llamada a API
      await this.delay(500);
      
      const index = this.roles.findIndex(r => r.id === role.id);
      if (index !== -1) {
        this.roles[index] = {
          ...this.roles[index],
          isActive: !this.roles[index].isActive,
          updatedAt: new Date()
        };
      }
      
      console.log('Rol toggle:', this.roles[index]);
      // Aquí podrías mostrar un toast de éxito
      
    } catch (error) {
      console.error('Error toggling role:', error);
      // Aquí podrías mostrar un toast de error
    }
  }

  onDeleteRole(role: Role) {
    this.roleToDelete = role;
    this.showDeleteModal = true;
  }

  async confirmDelete() {
    if (!this.roleToDelete) return;

    this.isLoading = true;
    try {
      // Simular llamada a API
      await this.delay(1000);
      
      this.roles = this.roles.filter(r => r.id !== this.roleToDelete!.id);
      
      console.log('Rol eliminado:', this.roleToDelete);
      // Aquí podrías mostrar un toast de éxito
      
    } catch (error) {
      console.error('Error deleting role:', error);
      // Aquí podrías mostrar un toast de error
    } finally {
      this.isLoading = false;
      this.showDeleteModal = false;
      this.roleToDelete = null;
    }
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.roleToDelete = null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}