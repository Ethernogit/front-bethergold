import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Product } from './product.service'; // Reuse Product interface

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/inventory`;

    /**
     * Get products for inventory view (read-only)
     */
    getInventory(params?: any): Observable<any> {
        let httpParams = new HttpParams();

        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }

        return this.http.get<{ success: boolean, data: Product[] }>(this.apiUrl, { params: httpParams });
    }

    /**
     * Search inventory
     */
    searchInventory(query: string): Observable<any> {
        const params = new HttpParams().set('q', query);
        return this.http.get<{ success: boolean, data: Product[] }>(`${this.apiUrl}/search`, { params });
    }

    /**
     * Get single product details
     */
    getInventoryItem(id: string): Observable<any> {
        return this.http.get<{ success: boolean, data: Product }>(`${this.apiUrl}/${id}`);
    }

    /**
     * Toggle inventory revision status
     */
    toggleReviewStatus(id: string, status: boolean): Observable<any> {
        return this.http.patch<{ success: boolean, data: Product }>(`${this.apiUrl}/${id}/review`, { status });
    }

    /**
     * Review product by code (scanner mode)
     */
    reviewByCode(code: string): Observable<any> {
        return this.http.post<{ success: boolean, data: Product }>(`${this.apiUrl}/review-by-code`, { code });
    }
    /**
     * Reset all inventory revisions (fresh count)
     */
    resetInventory(): Observable<any> {
        return this.http.post<{ success: boolean, data: any }>(`${this.apiUrl}/reset`, {});
    }

    /**
     * Get inventory stats
     */
    getInventoryStats(params?: any): Observable<any> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this.http.get<{ success: boolean, data: any }>(`${this.apiUrl}/stats`, { params: httpParams });
    }

    // --- Sesión de conteo (versionado durable) ---

    /**
     * Inicia una sesión de conteo (reemplaza el reset). Limpia revisiones previas.
     */
    startCount(): Observable<any> {
        return this.http.post<{ success: boolean, data: any }>(`${this.apiUrl}/count/start`, {});
    }

    /**
     * Registra la cantidad contada (absoluta) de un producto de forma durable.
     */
    recordCount(productId: string, countedQty: number): Observable<any> {
        return this.http.post<{ success: boolean, data: any }>(`${this.apiUrl}/count/item`, { productId, countedQty });
    }

    /**
     * Sesión de conteo abierta + estadísticas (incluye soldDuringCount).
     */
    getActiveCount(): Observable<any> {
        return this.http.get<{ success: boolean, data: any }>(`${this.apiUrl}/count/active`);
    }

    /**
     * Cierra la sesión y genera los archivos en los formatos indicados.
     */
    closeCount(formats: Array<'xlsx' | 'pdf'>): Observable<any> {
        return this.http.post<{ success: boolean, data: any }>(`${this.apiUrl}/count/close`, { formats });
    }

    /**
     * Historial de inventarios cerrados (versiones).
     */
    getCountHistory(): Observable<any> {
        return this.http.get<{ success: boolean, data: any[] }>(`${this.apiUrl}/count/history`);
    }

    /**
     * Descarga el archivo de una versión en el formato pedido.
     */
    downloadCountFile(id: string, format: 'xlsx' | 'pdf'): Observable<Blob> {
        const params = new HttpParams().set('format', format);
        return this.http.get(`${this.apiUrl}/count/${id}/file`, { params, responseType: 'blob' });
    }
}
