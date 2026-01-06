import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Sucursal {
    id: string;
    _id: string; // Handle both id and _id
    name: string;
    code: string;
    config?: {
        barcode?: {
            enabled: boolean;
            format: 'standard' | 'custom';
            pattern: string;
            prefix?: string;
            suffix?: string;
            categoryLength?: number;
            subcategoryLength?: number;
            indexLength?: number;
        };
        productForm?: {
            enableSku: boolean;
            enableImage: boolean;
            enableName: boolean;
            enableStock: boolean;
            enableSpecifications: boolean;
            enableTags: boolean;
            enableDiamondPoints: boolean;
            requireSku: { type: Boolean, default: false };
            defaultProvider?: string;
            defaultCategory?: string;
            defaultSubcategory?: string;
        };
        folio?: {
            enabled: boolean;
            prefix?: string;
            padding?: number;
            nextNumber?: number;
        };
    };
}

@Injectable({
    providedIn: 'root'
})
export class SucursalService {
    private apiUrl = `${environment.apiUrl}/sucursales`;

    constructor(private http: HttpClient) { }

    getSucursalesByOrganization(filters?: any): Observable<{ data: Sucursal[], count: number }> {
        let params = new HttpParams();
        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    params = params.set(key, filters[key]);
                }
            });
        }
        return this.http.get<{ data: Sucursal[], count: number }>(this.apiUrl, { params });
    }

    getSucursalById(id: string): Observable<{ data: Sucursal }> {
        return this.http.get<{ data: Sucursal }>(`${this.apiUrl}/${id}`);
    }

    /**
     * Obtener siguiente folio
     */
    getNextFolio(sucursalId: string): Observable<string> {
        return this.http.get<{ success: boolean, data: string }>(`${this.apiUrl}/${sucursalId}/next-folio`)
            .pipe(map(res => res.data));
    }

    updateSucursal(id: string, data: any): Observable<{ data: Sucursal }> {
        return this.http.put<{ data: Sucursal }>(`${this.apiUrl}/${id}`, data);
    }

    // Helper method to generate a preview of the barcode
    generatePreview(config: any, categoryCode: string = 'CAT', subcategoryCode: string = 'SUB', index: number = 1, sucursalCode: string = 'SUC'): string {
        if (!config || !config.enabled) return 'DISABLED';

        const categoryLength = config.categoryLength || 3;
        const subcategoryLength = config.subcategoryLength || 3;
        const indexLength = config.indexLength || 6;

        const prefix = config.prefix || '';
        const suffix = config.suffix || '';

        const categoryPart = categoryCode.substring(0, categoryLength).toUpperCase().padEnd(categoryLength, 'X');
        const subcategoryPart = subcategoryCode.substring(0, subcategoryLength).toUpperCase().padEnd(subcategoryLength, 'X');
        const indexPart = index.toString().padStart(indexLength, '0');

        let pattern = config.pattern || '{sucursalCode}-{category}-{index}';

        // Replace placeholders
        let barcode = pattern
            .replace(/{prefix}/g, prefix)
            .replace(/{suffix}/g, suffix)
            .replace(/{category}/g, categoryPart)
            .replace(/{subcategory}/g, subcategoryPart)
            .replace(/{index}/g, indexPart)
            .replace(/{sucursalCode}/g, sucursalCode);

        return barcode;
    }
}
