import { Routes } from '@angular/router';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { LineChartComponent } from './pages/charts/line-chart/line-chart.component';
import { BarChartComponent } from './pages/charts/bar-chart/bar-chart.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { AvatarElementComponent } from './pages/ui-elements/avatar-element/avatar-element.component';
import { BadgesComponent } from './pages/ui-elements/badges/badges.component';
import { ButtonsComponent } from './pages/ui-elements/buttons/buttons.component';
import { ImagesComponent } from './pages/ui-elements/images/images.component';
import { VideosComponent } from './pages/ui-elements/videos/videos.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { CalenderComponent } from './pages/calender/calender.component';
import { PermissionsComponent } from './pages/permissions/permissions.component';
import { RolesComponent } from './pages/roles/roles.component';
import { AuthGuard } from './shared/guards/auth.guard';
import { PermissionGuard } from './shared/guards/permission.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  
  // Rutas de autenticación (públicas)
  {
    path: 'auth',
    children: [
      {
        path: 'sign-in',
        component: SignInComponent,
        title: 'Iniciar Sesión | Bethergold'
      },
      {
        path: 'sign-up',
        component: SignUpComponent,
        title: 'Registrarse | Bethergold'
      },
      {
        path: '',
        redirectTo: 'sign-in',
        pathMatch: 'full'
      }
    ]
  },

  // Rutas principales (protegidas)
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        component: EcommerceComponent,
        title: 'Dashboard | Bethergold'
      },
      {
        path: 'calendar',
        component: CalenderComponent,
        title: 'Calendario | Bethergold'
      },
      {
        path: 'profile',
        component: ProfileComponent,
        title: 'Perfil | Bethergold'
      },
      
      // Formularios
      {
        path: 'form-elements',
        component: FormElementsComponent,
        title: 'Elementos de Formulario | Bethergold'
      },
      
      // Tablas
      {
        path: 'basic-tables',
        component: BasicTablesComponent,
        title: 'Tablas Básicas | Bethergold'
      },
      
      // Páginas adicionales
      {
        path: 'blank',
        component: BlankComponent,
        title: 'Página en Blanco | Bethergold'
      },
      {
        path: 'invoice',
        component: InvoicesComponent,
        title: 'Facturas | Bethergold'
      },
      
      // Gráficos
      {
        path: 'line-chart',
        component: LineChartComponent,
        title: 'Gráfico de Líneas | Bethergold'
      },
      {
        path: 'bar-chart',
        component: BarChartComponent,
        title: 'Gráfico de Barras | Bethergold'
      },
      
      // UI Elements
      {
        path: 'alerts',
        component: AlertsComponent,
        title: 'Alertas | Bethergold'
      },
      {
        path: 'avatars',
        component: AvatarElementComponent,
        title: 'Avatares | Bethergold'
      },
      {
        path: 'badge',
        component: BadgesComponent,
        title: 'Insignias | Bethergold'
      },
      {
        path: 'buttons',
        component: ButtonsComponent,
        title: 'Botones | Bethergold'
      },
      {
        path: 'images',
        component: ImagesComponent,
        title: 'Imágenes | Bethergold'
      },
      {
        path: 'videos',
        component: VideosComponent,
        title: 'Videos | Bethergold'
      },
      
      // Administración (requiere permisos específicos)
      {
        path: 'permisos',
        component: PermissionsComponent,
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          permissions: ['MANAGE_PERMISSIONS'],
          module: 'permissions',
          action: 'read'
        },
        title: 'Gestión de Permisos | Bethergold'
      },
      {
        path: 'roles',
        component: RolesComponent,
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          permissions: ['MANAGE_ROLES'],
          module: 'roles',
          action: 'read'
        },
        title: 'Gestión de Roles | Bethergold'
      }
    ]
  },
  
  // Rutas de compatibilidad (redirect)
  {
    path: 'signin',
    redirectTo: '/auth/sign-in',
    pathMatch: 'full'
  },
  {
    path: 'signup',
    redirectTo: '/auth/sign-up',
    pathMatch: 'full'
  },
  
  // Error pages
  {
    path: '404',
    component: NotFoundComponent,
    title: 'Página No Encontrada | Bethergold'
  },
  {
    path: '**',
    redirectTo: '/404'
  }
];
