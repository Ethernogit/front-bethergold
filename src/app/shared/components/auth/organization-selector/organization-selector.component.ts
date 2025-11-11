import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Organization, Sucursal } from '../../../interfaces/auth.interfaces';
import { ButtonComponent } from '../../ui/button/button.component';
import { LabelComponent } from '../../form/label/label.component';

export interface OrganizationSelection {
  organizationId: string;
  sucursalId?: string;
}

@Component({
  selector: 'app-organization-selector',
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    LabelComponent
  ],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md mx-auto">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Seleccionar Organización y Sucursal
      </h3>
      
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Selecciona la organización y sucursal con la que deseas trabajar.
      </p>

      <div class="space-y-4">
        <!-- Selector de Organización -->
        <div>
          <app-label>Organización</app-label>
          <select 
            [(ngModel)]="selectedOrganizationId"
            (ngModelChange)="onOrganizationChange()"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            required>
            <option value="">Selecciona una organización...</option>
            <option 
              *ngFor="let org of organizations" 
              [value]="org.id">
              {{ org.name }}
            </option>
          </select>
        </div>

        <!-- Selector de Sucursal (si hay múltiples) -->
        <div *ngIf="availableSucursales.length > 0">
          <app-label>Sucursal <span *ngIf="availableSucursales.length > 1" class="text-red-500">*</span></app-label>
          <select 
            [(ngModel)]="selectedSucursalId"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            [disabled]="!selectedOrganizationId">
            <option value="" *ngIf="availableSucursales.length > 1">Selecciona una sucursal...</option>
            <option value="" *ngIf="availableSucursales.length === 1">Sucursal principal</option>
            <option 
              *ngFor="let sucursal of availableSucursales" 
              [value]="sucursal.id">
              {{ sucursal.name }}
            </option>
          </select>
          <p *ngIf="availableSucursales.length > 1 && !selectedSucursalId" class="mt-1 text-sm text-red-600 dark:text-red-400">
            Selecciona una sucursal para continuar
          </p>
        </div>

        <!-- Información adicional -->
        <div *ngIf="selectedOrganization" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-blue-800 dark:text-blue-200">
                <strong>{{ selectedOrganization.name }}</strong>
                <span *ngIf="selectedSucursal"> - {{ selectedSucursal.name }}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="flex space-x-3 pt-4">
          <app-button 
            (click)="onCancel()"
            class="flex-1"
            variant="outline">
            Cancelar
          </app-button>
          
          <app-button 
            (click)="onConfirm()"
            [disabled]="!canConfirm || isLoading"
            class="flex-1">
            <span *ngIf="isLoading" class="inline-flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Conectando...
            </span>
            <span *ngIf="!isLoading">Continuar</span>
          </app-button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class OrganizationSelectorComponent implements OnInit {
  @Input() organizations: Organization[] = [];
  @Input() isLoading = false;
  @Output() organizationSelected = new EventEmitter<OrganizationSelection>();
  @Output() cancelled = new EventEmitter<void>();

  selectedOrganizationId = '';
  selectedSucursalId = '';
  availableSucursales: Sucursal[] = [];

  ngOnInit() {
    console.log('🏢 OrganizationSelector initialized');
    console.log('🏢 Received organizations:', this.organizations);
    console.log('🏢 Organizations count:', this.organizations?.length || 0);
  }

  get selectedOrganization(): Organization | null {
    return this.organizations.find(org => org.id === this.selectedOrganizationId) || null;
  }

  get selectedSucursal(): Sucursal | null {
    return this.availableSucursales.find(suc => suc.id === this.selectedSucursalId) || null;
  }

  get canConfirm(): boolean {
    if (!this.selectedOrganizationId) return false;
    
    // Si hay múltiples sucursales, debe seleccionar una
    if (this.availableSucursales.length > 1 && !this.selectedSucursalId) {
      return false;
    }
    
    return true;
  }

  onOrganizationChange(): void {
    this.selectedSucursalId = '';
    this.availableSucursales = [];

    if (this.selectedOrganizationId) {
      const org = this.organizations.find(o => o.id === this.selectedOrganizationId);
      if (org && org.sucursales) {
        // No filtrar por isActive ya que no viene en la respuesta
        this.availableSucursales = org.sucursales;
        console.log('Available sucursales:', this.availableSucursales.length);
      }
    }
  }

  onConfirm(): void {
    if (!this.selectedOrganizationId) return;

    const selection: OrganizationSelection = {
      organizationId: this.selectedOrganizationId,
      sucursalId: this.selectedSucursalId || undefined
    };

    this.organizationSelected.emit(selection);
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}