import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Permission } from '../../interfaces/auth.interfaces';
import { environment } from '../../../../environments/environment';
import { LoginService } from '../auth/login.service';

@Injectable({
  providedIn: 'root'
})
export class PermisosService {
  private readonly API_URL = `${environment.apiUrl}/permissions`;

  constructor(
    private http: HttpClient,
    private loginService: LoginService
  ) {}

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
   * Obtener todos los permisos
   */
  getPermissions(): Observable<{ success: boolean; data: Permission[] }> {
    return this.http.get<{ success: boolean; data: Permission[] }>(this.API_URL, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Crear un nuevo permiso
   */
  createPermission(permission: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>): Observable<{ success: boolean; data: Permission }> {
    return this.http.post<{ success: boolean; data: Permission }>(this.API_URL, permission, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Actualizar un permiso
   */
  updatePermission(id: string, permission: Partial<Permission>): Observable<{ success: boolean; data: Permission }> {
    return this.http.put<{ success: boolean; data: Permission }>(`${this.API_URL}/${id}`, permission, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Eliminar un permiso
   */
  deletePermission(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.API_URL}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Activar/Desactivar un permiso
   */
  togglePermission(id: string): Observable<{ success: boolean; data: Permission }> {
    return this.http.patch<{ success: boolean; data: Permission }>(`${this.API_URL}/${id}/toggle`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Obtener todos los módulos disponibles
   */
  getPermissionModules(): Observable<{ success: boolean; data: string[] }> {
    return this.http.get<{ success: boolean; data: string[] }>(`${this.API_URL}/modules`, {
      headers: this.getAuthHeaders()
    });
  }
}
