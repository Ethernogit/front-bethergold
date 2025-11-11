import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { LoginService } from '../services/auth/login.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {

  constructor(
    private loginService: LoginService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    // Verificar si está autenticado primero
    if (!this.loginService.isAuthenticated()) {
      this.router.navigate(['/auth/sign-in']);
      return false;
    }

    // Obtener permisos requeridos desde la configuración de la ruta
    const requiredPermissions: string[] = route.data['permissions'] || [];
    const requiredModule: string = route.data['module'];
    const requiredAction: string = route.data['action'];

    // Si no se especificaron permisos, permitir acceso
    if (!requiredPermissions.length && !requiredModule) {
      return true;
    }

    // Verificar permisos específicos por nombre
    if (requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.some(permission => 
        this.loginService.hasPermission(permission)
      );
      
      if (!hasPermission) {
        this.router.navigate(['/dashboard'], {
          queryParams: { 
            error: 'insufficient-permissions',
            required: requiredPermissions.join(',')
          }
        });
        return false;
      }
    }

    // Verificar permisos por módulo y acción
    if (requiredModule && requiredAction) {
      if (!this.loginService.hasModulePermission(requiredModule, requiredAction)) {
        this.router.navigate(['/dashboard'], {
          queryParams: { 
            error: 'insufficient-permissions',
            module: requiredModule,
            action: requiredAction
          }
        });
        return false;
      }
    }

    return true;
  }
}