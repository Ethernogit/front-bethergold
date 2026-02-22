import { CommonModule } from '@angular/common';
import { Component, OnDestroy, AfterViewInit, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { LoginService } from '../../../services/auth/login.service';
import { OrganizationSelectorComponent, OrganizationSelection } from '../organization-selector/organization-selector.component';
import { Organization, LoginData, BackendLoginResponse, PreLoginResponse } from '../../../interfaces/auth.interfaces';
import anime from 'animejs';

@Component({
  selector: 'app-signin-form',
  imports: [
    CommonModule,
    CheckboxComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule,
    OrganizationSelectorComponent
  ],
  templateUrl: './signin-form.component.html',
  styles: `
    @keyframes shimmer {
      100% { transform: translateX(100%); }
    }
    .animate-shimmer {
      animation: shimmer 2s infinite;
    }
  `
})
export class SigninFormComponent implements OnDestroy, OnInit, AfterViewInit {
  private destroy$ = new Subject<void>();

  // Estados del componente
  showPassword = false;
  isChecked = false;
  isLoading = false;
  showOrganizationSelector = false;
  isOrgSelectionLoading = false;

  // Datos del formulario
  email = '';
  password = '';

  // Datos de organizaciones
  availableOrganizations: Organization[] = [];

  // Mensajes de error
  errorMessage = '';
  fieldErrors: { [key: string]: string } = {};

  constructor(
    private loginService: LoginService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const rememberedEmail = localStorage.getItem('remember_email');
    if (rememberedEmail) {
      this.email = rememberedEmail;
      this.isChecked = true;
    }
  }

  ngAfterViewInit(): void {
    this.initAnimations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initAnimations(): void {
    // Simple fade in for the right side content
    anime({
      targets: '.anime-fade-in',
      opacity: [0, 1],
      translateY: [20, 0],
      easing: 'easeOutExpo',
      duration: 1000,
      delay: 300
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  async onSignIn(): Promise<void> {
    // Limpiar errores previos
    this.clearErrors();

    // Validar formulario
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;

    try {
      const response: any = await this.loginService.preLogin(this.email, this.password).toPromise();

      // Check for direct login response (backend optimization for single org/branch)
      if (response?.data?.token) {
        this.loginService.setBackendAuthData(response.data);

        // Handle "remember me"
        if (this.isChecked) {
          localStorage.setItem('remember_email', this.email);
        } else {
          localStorage.removeItem('remember_email');
        }

        this.router.navigate(['/dashboard']);
        return;
      }

      const preLoginResponse = response as PreLoginResponse;

      if (!response?.success) {
        throw new Error('Error en pre-login');
      }

      const { organizations, requiresSelection } = response;

      // Verificar si necesita mostrar selector
      let needsSelection = false;

      if (organizations.length > 1) {
        // Múltiples organizaciones - siempre mostrar selector
        needsSelection = true;
      } else if (organizations.length === 1) {
        // Una organización - verificar si tiene múltiples sucursales
        const sucursales = organizations[0].sucursales || [];
        if (sucursales.length > 1) {
          needsSelection = true;
        }
      }

      // Si necesita selección, mostrar selector
      if (needsSelection || requiresSelection) {
        this.availableOrganizations = organizations;
        this.showOrganizationSelector = true;
        this.isLoading = false;
        return;
      }

      // Si llegamos aquí, es porque solo hay una organización con una sucursal
      const loginData: LoginData = {
        email: this.email,
        password: this.password
      };

      if (organizations.length === 1) {
        const org = organizations[0];
        loginData.organizationId = org.id;

        // Si la organización tiene sucursales, usar la primera (solo debería haber una)
        const sucursales = org.sucursales || [];
        if (sucursales.length === 1) {
          loginData.sucursalId = sucursales[0].id;
        } else if (sucursales.length === 0) {
          console.warn('Organization has no sucursales');
        }
      }

      await this.performLogin(loginData);

    } catch (error: any) {
      this.handleLoginError(error);
    } finally {
      this.isLoading = false;
    }
  }

  async onOrganizationSelected(selection: OrganizationSelection): Promise<void> {
    this.isOrgSelectionLoading = true;

    try {
      const loginData: LoginData = {
        email: this.email,
        password: this.password,
        organizationId: selection.organizationId,
        sucursalId: selection.sucursalId
      };

      await this.performLogin(loginData);

    } catch (error: any) {
      console.error('Error en login con organización:', error);
      this.handleLoginError(error);
    } finally {
      this.isOrgSelectionLoading = false;
    }
  }

  onOrganizationSelectionCancelled(): void {
    this.showOrganizationSelector = false;
    this.availableOrganizations = [];
  }

  private async performLogin(loginData: LoginData): Promise<void> {

    const loginResponse = await this.loginService.login(loginData).toPromise();

    if (!loginResponse?.data?.success) {
      throw new Error('Error en el login');
    }


    // Guardar "recordarme" si está marcado
    if (this.isChecked) {
      localStorage.setItem('remember_email', this.email);
    } else {
      localStorage.removeItem('remember_email');
    }

    // Ocultar selector de organización si estaba visible
    this.showOrganizationSelector = false;

    // Redirigir al dashboard
    this.router.navigate(['/dashboard']);
  }

  private validateForm(): boolean {
    let isValid = true;
    this.fieldErrors = {};

    // Validar email
    if (!this.email.trim()) {
      this.fieldErrors['email'] = 'El email es requerido';
      isValid = false;
    } else if (!this.isValidEmail(this.email)) {
      this.fieldErrors['email'] = 'El email no tiene un formato válido';
      isValid = false;
    }

    // Validar password
    if (!this.password.trim()) {
      this.fieldErrors['password'] = 'La contraseña es requerida';
      isValid = false;
    } else if (this.password.length < 6) {
      this.fieldErrors['password'] = 'La contraseña debe tener al menos 6 caracteres';
      isValid = false;
    }

    return isValid;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private handleLoginError(error: any): void {
    console.error('Login error:', error);

    // Manejar errores específicos
    if (error.status === 401) {
      this.errorMessage = 'Email o contraseña incorrectos';
    } else if (error.status === 403) {
      this.errorMessage = 'Tu cuenta está desactivada. Contacta al administrador';
    } else if (error.status === 429) {
      this.errorMessage = 'Demasiados intentos. Intenta de nuevo más tarde';
    } else if (error.error?.message) {
      this.errorMessage = error.error.message;
    } else if (error.message) {
      this.errorMessage = error.message;
    } else {
      this.errorMessage = 'Error de conexión. Verifica tu conexión a internet';
    }

    // Ocultar selector de organización en caso de error
    this.showOrganizationSelector = false;
  }

  private clearErrors(): void {
    this.errorMessage = '';
    this.fieldErrors = {};
  }
}
