// Provider Interfaces

// Enum for provider status
export enum ProviderStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked'
}

// Enum for payment terms
export enum PaymentTerms {
  CASH = 'contado',
  CREDIT_7 = 'credito_7',
  CREDIT_15 = 'credito_15',
  CREDIT_30 = 'credito_30',
  CREDIT_60 = 'credito_60',
  CREDIT_90 = 'credito_90'
}

// Contact information interface
export interface ProviderContact {
  name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
}

// Address interface
export interface ProviderAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

// Tax information interface
export interface ProviderTax {
  rfc?: string;
  businessName?: string;
}

// Provider Type interface
export interface ProviderType {
  _id?: string;
  id?: string;
  name: string;
  code: string;
  description?: string;
  status: 'active' | 'inactive';
  organizationId: string;
  createdBy: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Material Type interface
export interface MaterialType {
  _id?: string;
  id?: string;
  name: string;
  code: string;
  description?: string;
  type: 'oro' | 'plata' | 'laminado';
  karat?: number | null;
  unit?: string;
  isGlobal: boolean;
  status: 'active' | 'inactive';
  organizationId?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Provider Price interface
export interface ProviderPrice {
  _id?: string;
  id?: string;
  providerId: string;
  materialTypeId: string;
  subcategoryId?: string | any;
  pricePerGram: number;
  profitMargin?: number;
  finalPrice?: number;
  materialType?: MaterialType;
  subcategory?: any;
  status: 'active' | 'inactive';
  createdBy: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  notes?: string;
  currency?: string;
  effectiveDate?: Date;
  previousPrice?: number;
}

// Main Provider interface
export interface Provider {
  _id?: string;
  id?: string;
  name: string;
  code: string;
  sucursalId: string | any;
  organizationId: string;
  providerTypeId: string | ProviderType;
  profitMargin: number;
  contact?: ProviderContact;
  address?: ProviderAddress;
  tax?: ProviderTax;
  paymentTerms: PaymentTerms;
  creditDays: number;
  notes?: string;
  status: ProviderStatus;
  createdBy: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;

  // Populated fields
  providerType?: ProviderType;
  sucursal?: any;
  prices?: ProviderPrice[];
}

// Request DTOs
export interface CreateProviderRequest {
  name: string;
  code: string;
  providerTypeId: string;
  profitMargin: number;
  contact?: ProviderContact;
  address?: ProviderAddress;
  tax?: ProviderTax;
  paymentTerms?: PaymentTerms;
  creditDays?: number;
  notes?: string;
}

export interface UpdateProviderRequest extends Partial<CreateProviderRequest> {
  status?: ProviderStatus;
}

export interface CreateProviderTypeRequest {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateProviderTypeRequest extends Partial<CreateProviderTypeRequest> {
  status?: 'active' | 'inactive';
}

export interface CreateMaterialTypeRequest {
  name: string;
  code: string;
  description?: string;
  type: 'oro' | 'plata' | 'laminado';
  karat?: number | null;
}

export interface UpdateMaterialTypeRequest extends Partial<CreateMaterialTypeRequest> {
  status?: 'active' | 'inactive';
}

export interface SetProviderPriceRequest {
  materialTypeId: string;
  pricePerGram: number;
}

// Filter interfaces
export interface ProviderFilters {
  status?: ProviderStatus;
  sucursalId?: string;
  providerTypeId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProviderTypeFilters {
  status?: 'active' | 'inactive';
  search?: string;
  page?: number;
  limit?: number;
}

export interface MaterialTypeFilters {
  status?: 'active' | 'inactive';
  isGlobal?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Table display interfaces
export interface ProviderTableItem extends Provider {
  id: string;
  providerTypeName?: string;
  sucursalName?: string;
  finalProfitMargin?: string;
  contactInfo?: string;
  statusDisplay?: string;
}