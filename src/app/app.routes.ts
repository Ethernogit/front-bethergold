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
import { ProvidersComponent } from './pages/providers/providers.component';
import { CategoriesComponent } from './pages/products/categories/categories.component';
import { SubcategoriesComponent } from './pages/products/subcategories/subcategories.component';
import { NoteDetailsComponent } from './pages/sales/note-details/note-details.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/sales/new',
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
          module: 'roles',
          action: 'read'
        },
        title: 'Gestión de Roles | Bethergold'
      },
      {
        path: 'providers',
        component: ProvidersComponent,
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          module: 'providers',
          action: 'read'
        },
        title: 'Gestión de Proveedores | Bethergold'
      },
      {
        path: 'categories',
        component: CategoriesComponent,
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          module: 'categories',
          action: 'read'
        },
        title: 'Gestión de Categorías | Bethergold'
      },
      {
        path: 'subcategories',
        component: SubcategoriesComponent,
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          module: 'subcategories',
          action: 'read'
        },
        title: 'Gestión de Subcategorías | Bethergold'
      },
      {
        path: 'products/movement-types',
        loadComponent: () => import('./pages/products/movement-types/movement-type-list/movement-type-list.component').then(m => m.MovementTypeListComponent),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          module: 'products',
          action: 'read'
        },
        title: 'Tipos de Movimiento | Bethergold'
      },
      {
        path: 'products/gold-types',
        loadComponent: () => import('./pages/products/gold-types/gold-types.component').then(m => m.GoldTypesComponent),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          module: 'products',
          action: 'read'
        },
        title: 'Variantes | Bethergold'
      },
      {
        path: 'products/material-types',
        loadComponent: () => import('./pages/products/material-types/material-types.component').then(m => m.MaterialTypesComponent),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          module: 'products',
          action: 'read'
        },
        title: 'Materiales | Bethergold'
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/products/product-list/product-list.component').then(m => m.ProductListComponent),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          module: 'products',
          action: 'read'
        },
        title: 'Gestión de Productos | Bethergold'
      },
      {
        path: 'inventory',
        loadComponent: () => import('./pages/inventory/inventory-list/inventory-list.component').then(m => m.InventoryListComponent),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          module: 'inventory',
          action: 'read'
        },
        title: 'Inventario | Bethergold'
      },
      {
        path: 'clients',
        loadComponent: () => import('./pages/clients/client-list/client-list.component').then(m => m.ClientListComponent),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          module: 'clients',
          action: 'read'
        },
        title: 'Gestión de Clientes | Bethergold'
      },
      {
        path: 'clients/new',
        loadComponent: () => import('./pages/clients/client-form/client-form.component').then(m => m.ClientFormComponent),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          module: 'clients',
          action: 'create'
        },
        title: 'Nuevo Cliente | Bethergold'
      },
      {
        path: 'clients/:id/edit',
        loadComponent: () => import('./pages/clients/client-form/client-form.component').then(m => m.ClientFormComponent),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          module: 'clients',
          action: 'update'
        },
        title: 'Editar Cliente | Bethergold'
      },
      {
        path: 'users/edit/:id',
        loadComponent: () => import('./pages/users/user-create/user-create.component').then(m => m.UserCreateComponent),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          module: 'users',
          action: 'update'
        },
        title: 'Editar Usuario | Bethergold'
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users/user-list/user-list.component').then(m => m.UserListComponent),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          module: 'users',
          action: 'read'
        },
        title: 'Lista de Usuarios | Bethergold'
      },
      {
        path: 'users/create',
        loadComponent: () => import('./pages/users/user-create/user-create.component').then(m => m.UserCreateComponent),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          module: 'users',
          action: 'create'
        },
        title: 'Crear Usuario | Bethergold'
      },
      {
        path: 'sucursal/print',
        loadComponent: () => import('./pages/sucursal/sucursal-print/sucursal-print.component').then(m => m.SucursalPrintConfigComponent),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          module: 'organization',
          action: 'update'
        },
        title: 'Configuración de Tickets | Bethergold'
      },
      {
        path: 'sucursal/barcode',
        loadComponent: () => import('./pages/sucursal/sucursal-barcode/sucursal-barcode.component').then(m => m.SucursalBarcodeConfigComponent),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          module: 'organization',
          action: 'update'
        },
        title: 'Configuración de Códigos | Bethergold'
      },
      {
        path: 'sucursal/folio',
        loadComponent: () => import('./pages/sucursal/sucursal-folio/sucursal-folio.component').then(m => m.SucursalFolioConfigComponent),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          module: 'organization',
          action: 'update'
        },
        title: 'Configuración de Folios | Bethergold'
      },
      {
        path: 'sucursal/products',
        loadComponent: () => import('./pages/sucursal/sucursal-products/sucursal-products.component').then(m => m.SucursalProductConfigComponent),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          module: 'organization',
          action: 'update'
        },
        title: 'Configuración de Productos | Bethergold'
      },
      {
        path: 'migration',
        loadComponent: () => import('./pages/migration/migration.component').then(m => m.MigrationComponent),
        canActivate: [AuthGuard],
        title: 'Migración Mory | Bethergold'
      },
      {
        path: 'help-center',
        loadComponent: () => import('./pages/support/support-center/support-center.component').then(m => m.SupportCenterComponent),
        canActivate: [AuthGuard],
        title: 'Centro de Ayuda | Bethergold'
      },

      // Ventas / Notas
      {
        path: 'sales/cash-cut',
        loadComponent: () => import('./pages/sales/cash-cut/cash-cut.component').then(m => m.CashCutComponent),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          module: 'sales',
          action: 'read'
        },
        title: 'Corte de Caja | Bethergold'
      },
      {
        path: 'sales/cash-history',
        loadComponent: () => import('./pages/sales/cash-history/cash-history.component').then(m => m.CashHistoryComponent),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          module: 'sales',
          action: 'read'
        },
        title: 'Historial de Cajas | Bethergold'
      },
      {
        path: 'sales/new',
        loadComponent: () => import('./pages/sales/new-note/new-note.component').then(m => m.NewNoteComponent),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          module: 'sales',
          action: 'create'
        },
        title: 'Nueva Nota / POS | Bethergold'
      },
      {
        path: 'sales/history',
        loadComponent: () => import('./pages/sales/sales-history/sales-history.component').then(m => m.SalesHistoryComponent),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          module: 'sales',
          action: 'read'
        },
        title: 'Historial de Ventas | Bethergold'
      },
      {
        path: 'sales/note/:folio',
        component: NoteDetailsComponent,
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          module: 'sales',
          action: 'read'
        },
        title: 'Detalle de Nota | Bethergold'
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
