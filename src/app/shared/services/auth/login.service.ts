import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import {
  LoginRequest,
  PreLoginRequest,
  PreLoginResponse,
  LoginData,
  LoginResponse,
  BackendLoginResponse,
  AuthUser,
  AuthState,
  AuthPermission,
  SwitchOrganizationRequest,
  RefreshTokenResponse,
  Organization,
  Sucursal
} from '../../interfaces/auth.interfaces';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER: 'user_data',
    ORGANIZATIONS: 'organizations',
    CURRENT_ORG: 'current_organization',
    CURRENT_SUCURSAL: 'current_sucursal'
  };

  // Estado reactivo usando signals
  private authState = signal<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
    permissions: [],
    organizations: [],
    currentOrganization: null,
    currentSucursal: null
  });

  // Subject para notificaciones de cambios de autenticación
  private authStatusSubject = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuthState();
  }

  // Getters reactivos
  get isAuthenticated() {
    return computed(() => this.authState().isAuthenticated);
  }

  get currentUser() {
    return computed(() => this.authState().user);
  }

  get userPermissions() {
    return computed(() => this.authState().permissions);
  }

  get userOrganizations() {
    return computed(() => this.authState().organizations);
  }

  get currentOrganization() {
    return computed(() => this.authState().currentOrganization);
  }

  get currentSucursal() {
    return computed(() => this.authState().currentSucursal);
  }

  // Observable para suscripciones
  get authStatus$(): Observable<boolean> {
    return this.authStatusSubject.asObservable();
  }

  /**
   * Inicializar estado de autenticación desde localStorage
   */
  private initializeAuthState(): void {
    try {
      const accessToken = localStorage.getItem(this.STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = localStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN);
      const userData = localStorage.getItem(this.STORAGE_KEYS.USER);
      const organizations = localStorage.getItem(this.STORAGE_KEYS.ORGANIZATIONS);
      const currentOrg = localStorage.getItem(this.STORAGE_KEYS.CURRENT_ORG);
      const currentSucursal = localStorage.getItem(this.STORAGE_KEYS.CURRENT_SUCURSAL);

      if (accessToken && userData) {
        const user: AuthUser = JSON.parse(userData);
        const orgs: Organization[] = organizations ? JSON.parse(organizations) : [];
        const org: Organization | null = currentOrg ? JSON.parse(currentOrg) : null;
        const sucursal: Sucursal | null = currentSucursal ? JSON.parse(currentSucursal) : null;

        this.authState.set({
          isAuthenticated: true,
          user,
          accessToken,
          refreshToken,
          permissions: user.permissions || [],
          organizations: orgs,
          currentOrganization: org,
          currentSucursal: sucursal
        });

        this.authStatusSubject.next(true);
      }
    } catch (error) {
      console.error('Error initializing auth state:', error);
      this.clearAuthData();
    }
  }

  /**
   * Pre-login: Obtener organizaciones disponibles para el usuario
   */
  preLogin(email: string, password: string): Observable<PreLoginResponse> {
    const request: PreLoginRequest = { email, password };
    
    console.log('=== LOGIN SERVICE PRE-LOGIN ===');
    console.log('Request URL:', `${this.API_URL}/pre-login`);
    console.log('Request data:', { email, password: password ? '[PASSWORD PROVIDED]' : '[NO PASSWORD]' });
    
    return this.http.post<PreLoginResponse>(`${this.API_URL}/pre-login`, request)
      .pipe(
        tap(response => {
          console.log('Pre-login response:', response);
          if (response.success && response.organizations && response.organizations.length > 0) {
            // Guardar organizaciones disponibles temporalmente
            localStorage.setItem('temp_organizations', JSON.stringify(response.organizations));
          }
        }),
        catchError(error => {
          console.error('Pre-login error:', error);
          return this.handleError(error);
        })
      );
  }

  /**
   * Login principal
   */
  login(loginData: LoginData): Observable<BackendLoginResponse> {
    console.log('=== LOGIN SERVICE LOGIN ===');
    console.log('Request URL:', `${this.API_URL}/login`);
    console.log('Login data:', loginData);
    
    return this.http.post<BackendLoginResponse>(`${this.API_URL}/login`, loginData)
      .pipe(
        tap(response => {
          console.log('Login response:', response);
          if (response.data?.success) {
            this.setBackendAuthData(response.data);
          }
        }),
        catchError(error => {
          console.error('Login error:', error);
          return this.handleError(error);
        })
      );
  }

  /**
   * Cambiar organización/sucursal activa
   */
  switchOrganization(request: SwitchOrganizationRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/switch-organization`, request, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        if (response.success) {
          this.updateAuthData(response.data);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Refrescar token de acceso
   */
  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.authState().refreshToken;
    
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<RefreshTokenResponse>(`${this.API_URL}/refresh`, {
      refreshToken
    }).pipe(
      tap(response => {
        if (response.success) {
          const currentState = this.authState();
          this.authState.set({
            ...currentState,
            accessToken: response.data.accessToken
          });
          localStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, response.data.accessToken);
        }
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener perfil del usuario
   */
  getProfile(): Observable<AuthUser> {
    return this.http.get<{success: boolean, data: AuthUser}>(`${this.API_URL}/profile`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.data),
      tap(user => {
        const currentState = this.authState();
        this.authState.set({
          ...currentState,
          user,
          permissions: user.permissions || []
        });
        localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Logout
   */
  logout(): Observable<any> {
    const headers = this.getAuthHeaders();
    
    return this.http.post(`${this.API_URL}/logout`, {}, { headers })
      .pipe(
        catchError(() => of(null)), // Continuar aunque falle la llamada al backend
        tap(() => {
          this.clearAuthData();
          this.router.navigate(['/auth/sign-in']);
        })
      );
  }

  /**
   * Verificar si el usuario tiene un permiso específico
   */
  hasPermission(permission: string): boolean {
    // Convertir string "module:action" a búsqueda por module y action
    const [module, action] = permission.split(':');
    if (module && action) {
      return this.hasModulePermission(module, action);
    }
    
    // Fallback: buscar en permisos como antes
    const permissions = this.authState().permissions;
    return permissions.some((p: any) => 
      `${p.module}:${p.action}` === permission
    );
  }

  /**
   * Verificar si el usuario tiene permisos para un módulo y acción específicos
   */
  hasModulePermission(module: string, action: string): boolean {
    const permissions = this.authState().permissions;
    return permissions.some((p: any) => 
      p.module === module && 
      p.action === action
    );
  }

  /**
   * Obtener token de acceso actual
   */
  getAccessToken(): string | null {
    return this.authState().accessToken;
  }

  /**
   * Configurar datos de autenticación desde la respuesta del backend actual
   */
  private setBackendAuthData(data: BackendLoginResponse['data']): void {
    const { user, token, organization, sucursal, role } = data;
    
    // Los permisos ahora vienen como objetos completos desde el backend
    const userPermissions = user.permissions || role?.permissions || [];
    
    // Adaptar la estructura del backend a nuestro formato interno
    const adaptedUser: AuthUser = {
      id: user._id || user.id,
      email: user.email,
      profile: user.profile,
      permissions: userPermissions, // Ya son objetos completos con module, action, etc.
      organizations: user.organizations || [],
      status: user.status,
      emailVerified: user.emailVerified,
      currentOrganization: organization,
      currentSucursal: sucursal
    };
    
    // Actualizar estado
    this.authState.set({
      isAuthenticated: true,
      user: adaptedUser,
      accessToken: token,
      refreshToken: '', // El backend actual no devuelve refresh token
      permissions: userPermissions, // Usar los permisos completos
      organizations: user.organizations || [],
      currentOrganization: organization,
      currentSucursal: sucursal
    });

    // Guardar en localStorage
    localStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, token);
    localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(adaptedUser));
    
    if (organization) {
      localStorage.setItem(this.STORAGE_KEYS.CURRENT_ORG, JSON.stringify(organization));
    }
    
    if (sucursal) {
      localStorage.setItem(this.STORAGE_KEYS.CURRENT_SUCURSAL, JSON.stringify(sucursal));
    }

    // Limpiar organizaciones temporales
    localStorage.removeItem('temp_organizations');

    // Notificar cambio de estado
    this.authStatusSubject.next(true);
  }

  /**
   * Configurar datos de autenticación
   */
  private setAuthData(data: LoginResponse['data']): void {
    const { user, accessToken, refreshToken } = data;
    
    // Actualizar estado
    this.authState.set({
      isAuthenticated: true,
      user,
      accessToken,
      refreshToken,
      permissions: user.permissions || [],
      organizations: this.getStoredOrganizations(),
      currentOrganization: user.currentOrganization || null,
      currentSucursal: user.currentSucursal || null
    });

    // Guardar en localStorage
    localStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
    
    if (user.currentOrganization) {
      localStorage.setItem(this.STORAGE_KEYS.CURRENT_ORG, JSON.stringify(user.currentOrganization));
    }
    
    if (user.currentSucursal) {
      localStorage.setItem(this.STORAGE_KEYS.CURRENT_SUCURSAL, JSON.stringify(user.currentSucursal));
    }

    // Limpiar organizaciones temporales
    localStorage.removeItem('temp_organizations');

    // Notificar cambio de estado
    this.authStatusSubject.next(true);
  }

  /**
   * Actualizar datos de autenticación (para switch organization)
   */
  private updateAuthData(data: LoginResponse['data']): void {
    const currentState = this.authState();
    const { user, accessToken } = data;
    
    this.authState.set({
      ...currentState,
      user,
      accessToken,
      permissions: user.permissions || [],
      currentOrganization: user.currentOrganization || null,
      currentSucursal: user.currentSucursal || null
    });

    // Actualizar localStorage
    localStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
    
    if (user.currentOrganization) {
      localStorage.setItem(this.STORAGE_KEYS.CURRENT_ORG, JSON.stringify(user.currentOrganization));
    }
    
    if (user.currentSucursal) {
      localStorage.setItem(this.STORAGE_KEYS.CURRENT_SUCURSAL, JSON.stringify(user.currentSucursal));
    }
  }

  /**
   * Limpiar datos de autenticación
   */
  private clearAuthData(): void {
    // Limpiar estado
    this.authState.set({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      permissions: [],
      organizations: [],
      currentOrganization: null,
      currentSucursal: null
    });

    // Limpiar localStorage
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    localStorage.removeItem('temp_organizations');

    // Notificar cambio de estado
    this.authStatusSubject.next(false);
  }

  /**
   * Obtener organizaciones almacenadas
   */
  private getStoredOrganizations(): Organization[] {
    const stored = localStorage.getItem(this.STORAGE_KEYS.ORGANIZATIONS) || 
                   localStorage.getItem('temp_organizations');
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Generar headers de autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authState().accessToken;
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Manejo de errores
   */
  private handleError = (error: any): Observable<never> => {
    console.error('Auth service error:', error);
    
    // Si es error 401, intentar refrescar token
    if (error.status === 401 && this.authState().refreshToken) {
      // El interceptor se encargará del refresh automático
      return throwError(() => error);
    }
    
    // Si es error 403 o token expirado sin refresh, hacer logout
    if (error.status === 403 || (error.status === 401 && !this.authState().refreshToken)) {
      this.clearAuthData();
      this.router.navigate(['/auth/sign-in']);
    }

    return throwError(() => error);
  };
}
