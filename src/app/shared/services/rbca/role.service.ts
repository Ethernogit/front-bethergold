import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { Role, Permission } from '../../interfaces/auth.interfaces';
import { environment } from '../../../../environments/environment';
import { LoginService } from '../auth/login.service';

export interface RoleResponse {
  success: boolean;
  message: string;
  data: Role[];
}

export interface RoleRequest {
  name: string;
  description: string;
  permissions: string[];
  sucursalId?: string | null;
  isActive?: boolean;
}

export interface SingleRoleResponse {
  success: boolean;
  message: string;
  data: Role;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly API_URL = `${environment.apiUrl}/roles`;

  constructor(
    private http: HttpClient,
    private loginService: LoginService
  ) { }

  /**
   * Generar headers de autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.loginService.getAccessToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Manejar errores HTTP
   */
  private handleError = (error: any): Observable<never> => {
    console.error('Role service error:', error);
    let errorMessage = 'Error en el servicio de roles';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  };

  /**
   * Obtener todos los roles de la organización actual
   */
  getAllRoles(includeInactive = false, sucursalId?: string): Observable<Role[]> {
    let params = includeInactive ? '?includeInactive=true' : '?';
    if (sucursalId) {
      params += `${includeInactive ? '&' : ''}sucursalId=${sucursalId}`;
    }
    return this.http.get<RoleResponse>(`${this.API_URL}${params}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener un rol específico por ID
   */
  getRole(roleId: string): Observable<Role> {
    return this.http.get<SingleRoleResponse>(`${this.API_URL}/${roleId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Crear un nuevo rol
   */
  createRole(roleData: RoleRequest): Observable<Role> {
    return this.http.post<SingleRoleResponse>(this.API_URL, roleData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Actualizar un rol existente
   */
  updateRole(roleId: string, roleData: Partial<Omit<RoleRequest, 'isActive'>>): Observable<Role> {
    return this.http.put<SingleRoleResponse>(`${this.API_URL}/${roleId}`, roleData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Eliminar un rol
   */
  deleteRole(roleId: string): Observable<void> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.API_URL}/${roleId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(() => void 0),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener todos los permisos disponibles
   */
  getAvailablePermissions(): Observable<Permission[]> {
    return this.http.get<{ success: boolean; data: Permission[] }>(`${this.API_URL}/permissions`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener permisos por categoría
   */
  getPermissionsByCategory(): Observable<any> {
    return this.http.get<{ success: boolean; data: any }>(`${this.API_URL}/permissions/category`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Asignar permisos a un rol
   */
  assignPermissions(roleId: string, permissions: string[]): Observable<Role> {
    return this.http.put<SingleRoleResponse>(`${this.API_URL}/${roleId}/permissions`, {
      permissions
    }, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Agregar un permiso a un rol
   */
  addPermission(roleId: string, permission: string): Observable<Role> {
    return this.http.post<SingleRoleResponse>(`${this.API_URL}/${roleId}/permissions`, {
      permission
    }, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Remover un permiso de un rol
   */
  removePermission(roleId: string, permission: string): Observable<Role> {
    return this.http.delete<SingleRoleResponse>(`${this.API_URL}/${roleId}/permissions/${permission}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener usuarios asignados a un rol
   */
  getUsersByRole(roleId: string): Observable<any[]> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.API_URL}/${roleId}/users`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Asignar rol a usuario
   */
  assignRoleToUser(userId: string, roleId: string): Observable<any> {
    return this.http.post<{ success: boolean; data: any }>(`${this.API_URL}/assign`, {
      userId,
      roleId
    }, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Remover rol de usuario
   */
  removeRoleFromUser(userId: string): Observable<void> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.API_URL}/users/${userId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(() => void 0),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener rol de usuario
   */
  getUserRole(userId: string): Observable<any> {
    return this.http.get<{ success: boolean; data: any }>(`${this.API_URL}/users/${userId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener permisos de usuario
   */
  getUserPermissions(userId: string): Observable<Permission[]> {
    return this.http.get<{ success: boolean; data: Permission[] }>(`${this.API_URL}/users/${userId}/permissions`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Verificar si usuario tiene un permiso específico
   */
  checkUserPermission(userId: string, permission: string): Observable<boolean> {
    return this.http.get<{ success: boolean; data: { hasPermission: boolean } }>(`${this.API_URL}/users/${userId}/permissions/${permission}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.data.hasPermission),
      catchError(this.handleError)
    );
  }
}