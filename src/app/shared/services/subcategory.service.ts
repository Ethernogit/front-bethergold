import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    Subcategory,
    CreateSubcategoryRequest,
    UpdateSubcategoryRequest,
    SubcategoryFilters,
    ApiResponse,
    ProductStatus
} from '../interfaces/product.interfaces';

@Injectable({
    providedIn: 'root'
})
export class SubcategoryService {
    private apiUrl = `${environment.apiUrl}/products/subcategories`;

    constructor(private http: HttpClient) { }

    // =============== SUBCATEGORY CRUD METHODS ===============

    /**
     * Create a new subcategory
     */
    createSubcategory(subcategory: CreateSubcategoryRequest): Observable<ApiResponse<Subcategory>> {
        return this.http.post<ApiResponse<Subcategory>>(this.apiUrl, subcategory);
    }

    /**
     * Get all subcategories in the organization
     */
    getSubcategories(filters?: SubcategoryFilters): Observable<ApiResponse<Subcategory[]>> {
        let params = new HttpParams();

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params = params.set(key, value.toString());
                }
            });
        }

        return this.http.get<ApiResponse<Subcategory[]>>(this.apiUrl, { params });
    }

    /**
     * Get subcategories by category ID
     */
    getSubcategoriesByCategory(categoryId: string): Observable<ApiResponse<Subcategory[]>> {
        return this.http.get<ApiResponse<Subcategory[]>>(`${this.apiUrl}/category/${categoryId}`);
    }

    /**
     * Get a subcategory by ID
     */
    getSubcategoryById(id: string): Observable<ApiResponse<Subcategory>> {
        return this.http.get<ApiResponse<Subcategory>>(`${this.apiUrl}/${id}`);
    }

    /**
     * Update a subcategory
     */
    updateSubcategory(id: string, updates: UpdateSubcategoryRequest): Observable<ApiResponse<Subcategory>> {
        return this.http.put<ApiResponse<Subcategory>>(`${this.apiUrl}/${id}`, updates);
    }

    /**
     * Delete (deactivate) a subcategory
     */
    deleteSubcategory(id: string): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }

    // =============== UTILITY METHODS ===============

    /**
     * Get status display text
     */
    getStatusDisplay(status: string): string {
        const statusMap: { [key: string]: string } = {
            'active': 'Activo',
            'inactive': 'Inactivo'
        };
        return statusMap[status] || status;
    }

    /**
     * Get status CSS class
     */
    getStatusClass(status: string): string {
        const statusClasses: { [key: string]: string } = {
            'active': 'inline-flex items-center rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-700 dark:bg-success-900/30 dark:text-success-300',
            'inactive': 'inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        };
        return statusClasses[status] || 'inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
}
