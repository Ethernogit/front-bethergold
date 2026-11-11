import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/product.interfaces';
import {
    Discount,
    DiscountPrice,
    DiscountListData,
    DiscountListParams,
    DiscountPayload,
    DiscountSettings
} from '../interfaces/discount.interfaces';

@Injectable({
    providedIn: 'root'
})
export class DiscountService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/discounts`;

    getSettings(): Observable<ApiResponse<{ settings: DiscountSettings }>> {
        return this.http.get<ApiResponse<{ settings: DiscountSettings }>>(`${this.apiUrl}/settings`);
    }

    updateSettings(settings: Partial<DiscountSettings>): Observable<ApiResponse<{ settings: DiscountSettings }>> {
        return this.http.put<ApiResponse<{ settings: DiscountSettings }>>(`${this.apiUrl}/settings`, settings);
    }

    /** Precio de hoy de las piezas de la nota; el mismo cálculo con el que el servidor la revisa */
    getPrices(productIds: string[]): Observable<ApiResponse<{ prices: DiscountPrice[] }>> {
        const params = new HttpParams().set('productIds', productIds.join(','));
        return this.http.get<ApiResponse<{ prices: DiscountPrice[] }>>(`${this.apiUrl}/prices`, { params });
    }

    getDiscounts(params: DiscountListParams = {}): Observable<ApiResponse<DiscountListData>> {
        let httpParams = new HttpParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                httpParams = httpParams.set(key, String(value));
            }
        });
        return this.http.get<ApiResponse<DiscountListData>>(this.apiUrl, { params: httpParams });
    }

    createDiscount(payload: DiscountPayload): Observable<ApiResponse<{ discount: Discount }>> {
        return this.http.post<ApiResponse<{ discount: Discount }>>(this.apiUrl, payload);
    }

    updateDiscount(id: string, payload: Partial<DiscountPayload>): Observable<ApiResponse<{ discount: Discount }>> {
        return this.http.put<ApiResponse<{ discount: Discount }>>(`${this.apiUrl}/${id}`, payload);
    }

    setStatus(id: string, isActive: boolean): Observable<ApiResponse<{ discount: Discount }>> {
        return this.http.patch<ApiResponse<{ discount: Discount }>>(`${this.apiUrl}/${id}/status`, { isActive });
    }

    deleteDiscount(id: string): Observable<ApiResponse<{ id: string }>> {
        return this.http.delete<ApiResponse<{ id: string }>>(`${this.apiUrl}/${id}`);
    }
}
