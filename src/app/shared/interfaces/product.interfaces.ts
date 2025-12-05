// =============== ENUMS ===============

export enum ProductStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive'
}

// =============== BASE MODELS ===============

export interface Category {
    _id?: string;
    id?: string;
    name: string;
    code: string;
    description?: string;
    status: ProductStatus;
    organizationId: string;
    createdBy?: string;
    updatedBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Subcategory {
    _id?: string;
    id?: string;
    name: string;
    code: string;
    description?: string;
    categoryId: string | Category;
    status: ProductStatus;
    organizationId: string;
    createdBy?: string;
    updatedBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Product {
    _id?: string;
    id?: string;
    name: string;
    code: string;
    description?: string;
    categoryId: string | Category;
    subcategoryId?: string | Subcategory;
    price: number;
    cost?: number;
    stock?: number;
    minStock?: number;
    maxStock?: number;
    unit?: string;
    barcode?: string;
    sku?: string;
    images?: string[];
    status: ProductStatus;
    organizationId: string;
    createdBy?: string;
    updatedBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// =============== TABLE DISPLAY MODELS ===============

export interface CategoryTableItem extends Category {
    statusDisplay?: string;
}

export interface SubcategoryTableItem extends Subcategory {
    categoryName?: string;
    statusDisplay?: string;
}

export interface ProductTableItem extends Product {
    categoryName?: string;
    subcategoryName?: string;
    statusDisplay?: string;
}

// =============== REQUEST TYPES ===============

export interface CreateCategoryRequest {
    name: string;
    code: string;
    description?: string;
    status?: ProductStatus;
}

export interface UpdateCategoryRequest {
    name?: string;
    code?: string;
    description?: string;
    status?: ProductStatus;
}

export interface CreateSubcategoryRequest {
    name: string;
    code: string;
    description?: string;
    categoryId: string;
    status?: ProductStatus;
}

export interface UpdateSubcategoryRequest {
    name?: string;
    code?: string;
    description?: string;
    categoryId?: string;
    status?: ProductStatus;
}

export interface CreateProductRequest {
    name: string;
    code: string;
    description?: string;
    categoryId: string;
    subcategoryId?: string;
    price: number;
    cost?: number;
    stock?: number;
    minStock?: number;
    maxStock?: number;
    unit?: string;
    barcode?: string;
    sku?: string;
    images?: string[];
    status?: ProductStatus;
}

export interface UpdateProductRequest {
    name?: string;
    code?: string;
    description?: string;
    categoryId?: string;
    subcategoryId?: string;
    price?: number;
    cost?: number;
    stock?: number;
    minStock?: number;
    maxStock?: number;
    unit?: string;
    barcode?: string;
    sku?: string;
    images?: string[];
    status?: ProductStatus;
}

// =============== FILTER TYPES ===============

export interface CategoryFilters {
    search?: string;
    status?: ProductStatus;
}

export interface SubcategoryFilters {
    search?: string;
    status?: ProductStatus;
    categoryId?: string;
}

export interface ProductFilters {
    search?: string;
    status?: ProductStatus;
    categoryId?: string;
    subcategoryId?: string;
    minPrice?: number;
    maxPrice?: number;
}

// =============== API RESPONSE TYPES ===============

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface PaginatedResponse<T> {
    success: boolean;
    message: string;
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}
