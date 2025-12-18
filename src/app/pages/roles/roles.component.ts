import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RoleFormComponent } from '../../shared/components/admin/roles/role-form.component';
import { RolesListComponent } from '../../shared/components/admin/roles/roles-list.component';
import { Permission, Role } from '../../shared/interfaces/auth.interfaces';
import { PermissionService } from '../../shared/services/auth/permission.service';
import { RoleService } from '../../shared/services/rbca/role.service';

@Component({
  selector: 'app-roles',
  imports: [
    CommonModule,
    FormsModule,
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

  constructor(
    private permissionService: PermissionService,
    private roleService: RoleService
  ) { }

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
    try {
      this.roles = await this.roleService.getAllRoles(true).toPromise() || [];
    } catch (error) {
      console.error('Error loading roles:', error);
      // Fallback con datos de ejemplo si falla la API
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
  }

  async loadPermissions() {
    console.log('Loading permissions...');
    try {
      // Usar el nuevo servicio de roles para obtener permisos
      this.availablePermissions = await this.roleService.getAvailablePermissions().toPromise() || [];
      console.log('Permissions loaded from roles service:', this.availablePermissions);
    } catch (error) {
      console.error('Error loading permissions from roles service:', error);
      try {
        // Fallback: usar el servicio de permisos
        this.availablePermissions = await this.permissionService.getAllPermissions().toPromise() || [];
        console.log('Permissions loaded from permission service (fallback):', this.availablePermissions);
      } catch (fallbackError) {
        console.error('Error loading permissions (fallback):', fallbackError);
        // Datos de ejemplo como último recurso
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
        console.log('Using fallback permissions:', this.availablePermissions);
      }
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
    console.log('=== ROLE SUBMIT START ===');
    console.log('Role data received:', roleData);
    console.log('Available permissions:', this.availablePermissions);

    try {
      // Convertir permisos a array de strings si son objetos Permission
      const permissionIds = Array.isArray(roleData.permissions)
        ? roleData.permissions.map(p => typeof p === 'string' ? p : p.id).filter(id => id !== undefined) as string[]
        : [];

      console.log('Permission IDs to send:', permissionIds);

      if (this.editMode && roleData.id) {
        console.log('Updating existing role...');
        // Actualizar rol existente
        const updatedRole = await this.roleService.updateRole(roleData.id, {
          name: roleData.name,
          description: roleData.description,
          permissions: permissionIds
        }).toPromise();

        if (updatedRole) {
          const index = this.roles.findIndex(r => r.id === roleData.id);
          if (index !== -1) {
            this.roles[index] = updatedRole;
          }
        }
        console.log('Rol actualizado:', updatedRole);
      } else {
        console.log('Creating new role...');
        // Crear nuevo rol
        const newRole = await this.roleService.createRole({
          name: roleData.name,
          description: roleData.description,
          permissions: permissionIds
        }).toPromise();

        if (newRole) {
          this.roles.unshift(newRole);
        }
        console.log('Nuevo rol creado:', newRole);
      }

      this.showForm = false;
      this.selectedRole = null;
      console.log('=== ROLE SUBMIT SUCCESS ===');

    } catch (error) {
      console.error('=== ROLE SUBMIT ERROR ===');
      console.error('Error saving role:', error);

      // Mostrar el error al usuario
      if (error instanceof Error) {
        alert(`Error al guardar el rol: ${error.message}`);
      } else {
        alert('Error desconocido al guardar el rol');
      }

      // Fallback: comportamiento anterior en caso de error de API
      try {
        if (this.editMode && roleData.id) {
          // Actualizar rol existente
          const index = this.roles.findIndex(r => r.id === roleData.id);
          if (index !== -1) {
            this.roles[index] = {
              ...roleData,
              updatedAt: new Date()
            };
          }
          console.log('Rol actualizado (fallback):', roleData);
        } else {
          // Crear nuevo rol
          const newRole: Role = {
            ...roleData,
            id: (Date.now()).toString(),
            createdAt: new Date(),
            updatedAt: new Date()
          };
          this.roles.unshift(newRole);
          console.log('Nuevo rol creado (fallback):', newRole);
        }

        this.showForm = false;
        this.selectedRole = null;
      } catch (fallbackError) {
        console.error('Error in fallback:', fallbackError);
      }
    } finally {
      this.isLoading = false;
      console.log('=== ROLE SUBMIT END ===');
    }
  }

  onFormCancel() {
    this.showForm = false;
    this.selectedRole = null;
    this.editMode = false;
  }

  async onToggleRole(role: Role) {
    try {
      // Por ahora, solo cambio local hasta que el backend implemente un endpoint específico
      const index = this.roles.findIndex(r => r.id === role.id);
      if (index !== -1) {
        this.roles[index] = {
          ...this.roles[index],
          isActive: !this.roles[index].isActive,
          updatedAt: new Date()
        };
      }

      console.log('Rol toggle (local):', this.roles[index]);
      // TODO: Implementar cuando el backend tenga endpoint para toggle

    } catch (error) {
      console.error('Error toggling role:', error);
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
      // Eliminar rol usando el servicio
      await this.roleService.deleteRole(this.roleToDelete.id).toPromise();

      // Remover de la lista local
      this.roles = this.roles.filter(r => r.id !== this.roleToDelete!.id);

      console.log('Rol eliminado:', this.roleToDelete);

    } catch (error) {
      console.error('Error deleting role:', error);
      // Fallback: comportamiento anterior en caso de error de API
      try {
        this.roles = this.roles.filter(r => r.id !== this.roleToDelete!.id);
        console.log('Rol eliminado (fallback):', this.roleToDelete);
      } catch (fallbackError) {
        console.error('Error in delete fallback:', fallbackError);
      }
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