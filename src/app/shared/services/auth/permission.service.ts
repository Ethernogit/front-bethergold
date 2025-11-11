import { Injectable, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { LoginService } from '../auth/login.service';
import { Permission } from '../../interfaces/auth.interfaces';

export interface PermissionResponse {
  success: boolean;
  data: Permission[];
  message?: string;
}

export interface PermissionRequest {
  name: string;
  description: string;
  module: string;
  action: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly API_URL = 'http://localhost:3000/api/v1';

  constructor(
    private http: HttpClient,
    private loginService: LoginService
  ) {}

  /**
   * Obtener todos los permisos disponibles en el sistema
   */
  getAllPermissions(): Observable<Permission[]> {
    return this.http.get<PermissionResponse>(`${this.API_URL}/permissions`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener permisos del usuario actual
   */
  getUserPermissions(): Observable<Permission[]> {
    return this.http.get<PermissionResponse>(`${this.API_URL}/user/permissions`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener permisos por módulo
   */
  getPermissionsByModule(module: string): Observable<Permission[]> {
    return this.http.get<PermissionResponse>(`${this.API_URL}/permissions/module/${module}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Crear un nuevo permiso
   */
  createPermission(permission: PermissionRequest): Observable<Permission> {
    return this.http.post<{success: boolean, data: Permission}>(`${this.API_URL}/permissions`, permission, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Actualizar un permiso existente
   */
  updatePermission(id: string, permission: Partial<PermissionRequest>): Observable<Permission> {
    return this.http.put<{success: boolean, data: Permission}>(`${this.API_URL}/permissions/${id}`, permission, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Eliminar un permiso
   */
  deletePermission(id: string): Observable<boolean> {
    return this.http.delete<{success: boolean}>(`${this.API_URL}/permissions/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.success),
      catchError(this.handleError)
    );
  }

  /**
   * Activar/desactivar un permiso
   */
  togglePermission(id: string, isActive: boolean): Observable<Permission> {
    return this.http.patch<{success: boolean, data: Permission}>(`${this.API_URL}/permissions/${id}/toggle`, 
      { isActive }, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Verificar si el usuario actual tiene un permiso específico
   */
  hasPermission(permissionName: string): boolean {
    return this.loginService.hasPermission(permissionName);
  }

  /**
   * Verificar si el usuario tiene permisos para un módulo y acción
   */
  hasModulePermission(module: string, action: string): boolean {
    return this.loginService.hasModulePermission(module, action);
  }

  /**
   * Obtener permisos del usuario actual (computed)
   */
  get currentUserPermissions() {
    return this.loginService.userPermissions;
  }

  /**
   * Obtener lista de módulos únicos de los permisos
   */
  getUniqueModules(permissions: Permission[]): string[] {
    const modules = permissions.map(p => p.module);
    return [...new Set(modules)].sort();
  }

  /**
   * Obtener lista de acciones únicas de los permisos
   */
  getUniqueActions(permissions: Permission[]): string[] {
    const actions = permissions.map(p => p.action);
    return [...new Set(actions)].sort();
  }

  /**
   * Filtrar permisos por módulo
   */
  filterPermissionsByModule(permissions: Permission[], module: string): Permission[] {
    return permissions.filter(p => p.module === module);
  }

  /**
   * Filtrar permisos por acción
   */
  filterPermissionsByAction(permissions: Permission[], action: string): Permission[] {
    return permissions.filter(p => p.action === action);
  }

  /**
   * Buscar permisos por texto
   */
  searchPermissions(permissions: Permission[], searchTerm: string): Permission[] {
    const term = searchTerm.toLowerCase();
    return permissions.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.module.toLowerCase().includes(term) ||
      p.action.toLowerCase().includes(term)
    );
  }

  /**
   * Agrupar permisos por módulo
   */
  groupPermissionsByModule(permissions: Permission[]): { [module: string]: Permission[] } {
    return permissions.reduce((groups, permission) => {
      const module = permission.module;
      if (!groups[module]) {
        groups[module] = [];
      }
      groups[module].push(permission);
      return groups;
    }, {} as { [module: string]: Permission[] });
  }

  /**
   * Obtener headers de autenticación
   */
  private getAuthHeaders() {
    const token = this.loginService.getAccessToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Manejo de errores
   */
  private handleError = (error: any): Observable<never> => {
    console.error('Permission service error:', error);
    
    let errorMessage = 'Error en el servicio de permisos';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  };
}