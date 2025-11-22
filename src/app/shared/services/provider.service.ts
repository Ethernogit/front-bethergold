import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Provider,
  ProviderType,
  MaterialType,
  ProviderPrice,
  CreateProviderRequest,
  UpdateProviderRequest,
  CreateProviderTypeRequest,
  UpdateProviderTypeRequest,
  CreateMaterialTypeRequest,
  UpdateMaterialTypeRequest,
  SetProviderPriceRequest,
  ProviderFilters,
  ProviderTypeFilters,
  MaterialTypeFilters,
  ApiResponse,
  PaginatedResponse
} from '../interfaces/provider.interfaces';

@Injectable({
  providedIn: 'root'
})
export class ProviderService {
  private apiUrl = `${environment.apiUrl}/organizations`;

  constructor(private http: HttpClient) {}

  // =============== PROVIDER CRUD METHODS ===============

  /**
   * Create a new provider
   */
  createProvider(provider: CreateProviderRequest): Observable<ApiResponse<Provider>> {
    return this.http.post<ApiResponse<Provider>>(`${this.apiUrl}/providers`, provider);
  }

  /**
   * Get all providers in the organization
   */
  getProviders(filters?: ProviderFilters): Observable<ApiResponse<Provider[]>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<Provider[]>>(`${this.apiUrl}/providers`, { params });
  }

  /**
   * Get providers by sucursal
   */
  getProvidersBySucursal(sucursalId: string, filters?: ProviderFilters): Observable<ApiResponse<Provider[]>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<Provider[]>>(`${this.apiUrl}/sucursales/${sucursalId}/providers`, { params });
  }

  /**
   * Get a provider by ID
   */
  getProviderById(id: string): Observable<ApiResponse<Provider>> {
    return this.http.get<ApiResponse<Provider>>(`${this.apiUrl}/providers/${id}`);
  }

  /**
   * Update a provider
   */
  updateProvider(id: string, updates: UpdateProviderRequest): Observable<ApiResponse<Provider>> {
    return this.http.put<ApiResponse<Provider>>(`${this.apiUrl}/providers/${id}`, updates);
  }

  /**
   * Delete (deactivate) a provider
   */
  deleteProvider(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/providers/${id}`);
  }

  // =============== PROVIDER PRICE METHODS ===============

  /**
   * Set/update price for a provider
   */
  setProviderPrice(providerId: string, priceData: SetProviderPriceRequest): Observable<ApiResponse<ProviderPrice>> {
    return this.http.post<ApiResponse<ProviderPrice>>(`${this.apiUrl}/providers/${providerId}/prices`, priceData);
  }

  /**
   * Get prices for a provider
   */
  getProviderPrices(providerId: string): Observable<ApiResponse<ProviderPrice[]>> {
    return this.http.get<ApiResponse<ProviderPrice[]>>(`${this.apiUrl}/providers/${providerId}/prices`);
  }

  /**
   * Delete a provider price
   */
  deleteProviderPrice(priceId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/providers/prices/${priceId}`);
  }

  // =============== PROVIDER TYPE METHODS ===============

  /**
   * Create a new provider type
   */
  createProviderType(providerType: CreateProviderTypeRequest): Observable<ApiResponse<ProviderType>> {
    return this.http.post<ApiResponse<ProviderType>>(`${this.apiUrl}/provider-types`, providerType);
  }

  /**
   * Get all provider types
   */
  getProviderTypes(filters?: ProviderTypeFilters): Observable<ApiResponse<ProviderType[]>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<ProviderType[]>>(`${this.apiUrl}/provider-types`, { params });
  }

  /**
   * Get a provider type by ID
   */
  getProviderTypeById(id: string): Observable<ApiResponse<ProviderType>> {
    return this.http.get<ApiResponse<ProviderType>>(`${this.apiUrl}/provider-types/${id}`);
  }

  /**
   * Update a provider type
   */
  updateProviderType(id: string, updates: UpdateProviderTypeRequest): Observable<ApiResponse<ProviderType>> {
    return this.http.put<ApiResponse<ProviderType>>(`${this.apiUrl}/provider-types/${id}`, updates);
  }

  /**
   * Delete (deactivate) a provider type
   */
  deleteProviderType(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/provider-types/${id}`);
  }

  // =============== MATERIAL TYPE METHODS ===============

  /**
   * Create a new material type
   */
  createMaterialType(materialType: CreateMaterialTypeRequest): Observable<ApiResponse<MaterialType>> {
    return this.http.post<ApiResponse<MaterialType>>(`${this.apiUrl}/material-types`, materialType);
  }

  /**
   * Get all material types (global and organization)
   */
  getMaterialTypes(filters?: MaterialTypeFilters): Observable<ApiResponse<MaterialType[]>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<MaterialType[]>>(`${this.apiUrl}/material-types`, { params });
  }

  /**
   * Get global material types only
   */
  getGlobalMaterialTypes(filters?: MaterialTypeFilters): Observable<ApiResponse<MaterialType[]>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<MaterialType[]>>(`${this.apiUrl}/material-types/global`, { params });
  }

  /**
   * Get a material type by ID
   */
  getMaterialTypeById(id: string): Observable<ApiResponse<MaterialType>> {
    return this.http.get<ApiResponse<MaterialType>>(`${this.apiUrl}/material-types/${id}`);
  }

  /**
   * Update a material type
   */
  updateMaterialType(id: string, updates: UpdateMaterialTypeRequest): Observable<ApiResponse<MaterialType>> {
    return this.http.put<ApiResponse<MaterialType>>(`${this.apiUrl}/material-types/${id}`, updates);
  }

  /**
   * Delete (deactivate) a material type
   */
  deleteMaterialType(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/material-types/${id}`);
  }

  // =============== UTILITY METHODS ===============

  /**
   * Calculate final price based on provider's profit margin
   */
  calculateFinalPrice(pricePerGram: number, profitMargin: number): number {
    const profitMultiplier = 1 + (profitMargin / 100);
    return parseFloat((pricePerGram * profitMultiplier).toFixed(2));
  }

  /**
   * Get payment terms display text
   */
  getPaymentTermsDisplay(paymentTerms: string): string {
    const terms: { [key: string]: string } = {
      'contado': 'Contado',
      'credito_7': 'Crédito 7 días',
      'credito_15': 'Crédito 15 días',
      'credito_30': 'Crédito 30 días',
      'credito_60': 'Crédito 60 días',
      'credito_90': 'Crédito 90 días'
    };
    return terms[paymentTerms] || paymentTerms;
  }

  /**
   * Get status display text
   */
  getStatusDisplay(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'Activo',
      'inactive': 'Inactivo',
      'blocked': 'Bloqueado'
    };
    return statusMap[status] || status;
  }

  /**
   * Get status CSS class
   */
  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'active': 'badge badge-success',
      'inactive': 'badge badge-secondary',
      'blocked': 'badge badge-danger'
    };
    return statusClasses[status] || 'badge badge-secondary';
  }
}