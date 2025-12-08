// Interfaces para autenticación
export interface LoginRequest {
  email: string;
  password: string;
}

export interface PreLoginRequest {
  email: string;
  password: string;
}

export interface Organization {
  id: string;
  name: string;
  isActive: boolean;
  sucursales?: Sucursal[];
}

export interface Sucursal {
  id: string;
  _id?: string; // Backend Mongo ID
  name: string;
  code?: string;
  organizationId: string;
  isActive: boolean;
  config?: any;
}

export interface PreLoginResponse {
  success: boolean;
  message?: string;
  organizations: Organization[];
  requiresSelection: boolean;
}

export interface LoginData {
  email: string;
  password: string;
  organizationId?: string;
  sucursalId?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profile?: {
    firstName: string;
    lastName: string;
    language: string;
    timezone: string;
  };
  isActive?: boolean;
  status?: string;
  emailVerified?: boolean;
  currentOrganization?: Organization | any;
  currentSucursal?: Sucursal | any;
  permissions?: AuthPermission[] | any[];  // Usar AuthPermission para login
  roles?: Role[];
  organizations?: any[];
}

// Permiso simple para autenticación (desde login)
export interface AuthPermission {
  id?: string;
  module: string;
  action: string;
  resource?: string;
}

// Permiso completo para administración (desde API de permisos)
export interface Permission {
  id?: string;
  name: string;
  description: string;
  module: string;
  action: string;
  resource?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[] | Permission[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

// Nueva interfaz para la respuesta actual del backend
export interface BackendLoginResponse {
  data: {
    success: boolean;
    token: string;
    user: any; // Estructura del usuario del backend
    organization: any; // Estructura de organización del backend
    sucursal: any; // Estructura de sucursal del backend
    role: any; // Estructura de rol del backend
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  permissions: AuthPermission[];  // Usar AuthPermission para estado de auth
  organizations: Organization[];
  currentOrganization: Organization | null;
  currentSucursal: Sucursal | null;
}

export interface SwitchOrganizationRequest {
  organizationId: string;
  sucursalId?: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data: {
    accessToken: string;
    expiresIn: number;
  };
}