import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    Category,
    CreateCategoryRequest,
    UpdateCategoryRequest,
    CategoryFilters,
    ApiResponse,
    ProductStatus
} from '../interfaces/product.interfaces';

@Injectable({
    providedIn: 'root'
})
export class CategoryService {
    private apiUrl = `${environment.apiUrl}/products/categories`;

    constructor(private http: HttpClient) { }

    // =============== CATEGORY CRUD METHODS ===============

    /**
     * Create a new category
     */
    createCategory(category: CreateCategoryRequest): Observable<ApiResponse<Category>> {
        return this.http.post<ApiResponse<Category>>(this.apiUrl, category);
    }

    /**
     * Get all categories in the organization
     */
    getCategories(filters?: CategoryFilters): Observable<ApiResponse<Category[]>> {
        let params = new HttpParams();

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params = params.set(key, value.toString());
                }
            });
        }

        return this.http.get<ApiResponse<Category[]>>(this.apiUrl, { params });
    }

    /**
     * Get a category by ID
     */
    getCategoryById(id: string): Observable<ApiResponse<Category>> {
        return this.http.get<ApiResponse<Category>>(`${this.apiUrl}/${id}`);
    }

    /**
     * Update a category
     */
    updateCategory(id: string, updates: UpdateCategoryRequest): Observable<ApiResponse<Category>> {
        return this.http.put<ApiResponse<Category>>(`${this.apiUrl}/${id}`, updates);
    }

    /**
     * Delete (deactivate) a category
     */
    deleteCategory(id: string): Observable<ApiResponse<any>> {
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
