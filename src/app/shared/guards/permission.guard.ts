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
    const requiredModule: string = route.data['module'];
    const requiredAction: string = route.data['action'];

    // Si no se especificaron módulo/acción, permitir acceso
    if (!requiredModule || !requiredAction) {
      return true;
    }

    // Verificar permisos por módulo y acción
    if (!this.loginService.hasModulePermission(requiredModule, requiredAction)) {
      this.router.navigate(['/dashboard'], {
        queryParams: { 
          error: 'insufficient-permissions',
          module: requiredModule,
          action: requiredAction,
          message: `Necesitas el permiso '${requiredModule}:${requiredAction}' para acceder a esta sección`
        }
      });
      return false;
    }

    return true;
  }
}