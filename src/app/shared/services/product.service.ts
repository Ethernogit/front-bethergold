import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Product {
    _id?: string;
    barcode: string;
    name: string; // Will be auto-generated or same as category/sub? The form doesn't show name field, maybe it is generated or description is used? Image has Description.
    description?: string;
    sku: string; // Often same as barcode or auto-generated
    category: string;
    subcategory?: string;
    price: number;
    cost?: number;
    stock: number;
    providerId: string;
    jewelryDetails?: {
        goldType?: string;
        karatage?: string;
        diamondPoints?: number;
    };
    specifications?: {
        weight?: number;
    };
    images?: { url: string; isPrimary: boolean }[];
    status?: 'active' | 'inactive' | 'discontinued';
}

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private apiUrl = `${environment.apiUrl}/products`;

    constructor(private http: HttpClient) { }

    getProducts(params?: any): Observable<any> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this.http.get(this.apiUrl, { params: httpParams });
    }

    getProduct(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/${id}`);
    }

    createProduct(product: Partial<Product>): Observable<any> {
        return this.http.post(this.apiUrl, product);
    }

    updateProduct(id: string, product: Partial<Product>): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, product);
    }

    deleteProduct(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    searchProducts(term: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/search`, { params: { q: term } });
    }

    getNextBarcode(sucursalId: string, category?: string, subcategory?: string): Observable<any> {
        let params = new HttpParams().set('sucursalId', sucursalId);
        if (category) {
            params = params.set('category', category);
        }
        if (subcategory) {
            params = params.set('subcategory', subcategory);
        }
        return this.http.get(`${this.apiUrl}/next-barcode`, { params });
    }
}
