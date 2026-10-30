import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StockHistoryEntry {
    _id?: string;
    date: string | Date;
    quantity: number;
    previousStock: number;
    newStock: number;
    type: 'sale' | 'reservation' | 'cancel_restore' | 'consignment_settle' | 'manual_adjustment';
    noteId?: string;
    folio?: string;
    userId?: { _id: string; profile?: { firstName?: string; lastName?: string } } | string;
    clientId?: { _id: string; name?: string } | string;
}

/** Foto en R2. Varias piezas pueden compartir la misma `key` (una foto para piezas iguales) */
export interface ProductImage {
    _id: string;
    url: string;
    thumbUrl?: string;
    key?: string;
    width?: number;
    height?: number;
    alt?: string;
    isPrimary: boolean;
}

/** Piezas que quedaron con la foto, con su lista de fotos actualizada */
export interface ProductImagesResult {
    image: Omit<ProductImage, '_id' | 'isPrimary'>;
    products: { _id: string; images: ProductImage[] }[];
}

export interface Product {
    _id?: string;
    barcode: string;
    name: string; // Will be auto-generated or same as category/sub? The form doesn't show name field, maybe it is generated or description is used? Image has Description.
    description?: string;
    sku: string; // Often same as barcode or auto-generated
    category: string | { _id: string; name: string };
    subcategory?: string | { _id: string; name: string };
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
        material?: string;
    };
    images?: ProductImage[];
    status?: 'active' | 'inactive' | 'discontinued';
    isUnique?: boolean;
    lastInventoryRevision?: Date;
    reservation?: { folio: string; noteId: string; isPawn?: boolean; reservedQty?: number };
    stockHistory?: StockHistoryEntry[];
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

    searchProductsByQR(termOrParams: string | any): Observable<any> {
        let params = new HttpParams();

        if (typeof termOrParams === 'string') {
            params = params.set('q', termOrParams);
        } else {
            Object.keys(termOrParams).forEach(key => {
                if (termOrParams[key] !== null && termOrParams[key] !== undefined) {
                    params = params.set(key, termOrParams[key]);
                }
            });
        }
        return this.http.get(`${this.apiUrl}/searchqr`, { params });
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

    /** Sube una foto (ya comprimida en el navegador) y la asigna a una o varias piezas */
    uploadImage(productIds: string[], file: Blob, primary = false): Observable<{ data: ProductImagesResult }> {
        const form = new FormData();
        form.append('image', file, 'foto.jpg');
        productIds.forEach(id => form.append('productIds', id));
        if (primary) form.append('primary', 'true');
        return this.http.post<{ data: ProductImagesResult }>(`${this.apiUrl}/images`, form);
    }

    /** Asigna a otras piezas una foto que ya tiene esta pieza, sin volver a subirla */
    assignImage(productId: string, imageId: string, productIds: string[], primary = false): Observable<{ data: ProductImagesResult }> {
        return this.http.post<{ data: ProductImagesResult }>(`${this.apiUrl}/${productId}/images/${imageId}/assign`, { productIds, primary });
    }

    setPrimaryImage(productId: string, imageId: string): Observable<{ data: { product: { images: ProductImage[] } } }> {
        return this.http.patch<{ data: { product: { images: ProductImage[] } } }>(`${this.apiUrl}/${productId}/images/${imageId}/primary`, {});
    }

    removeImage(productId: string, imageId: string): Observable<{ data: { product: { images: ProductImage[] }; fileDeleted: boolean } }> {
        return this.http.delete<{ data: { product: { images: ProductImage[] }; fileDeleted: boolean } }>(`${this.apiUrl}/${productId}/images/${imageId}`);
    }

    getStockHistory(productId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/${productId}/stock-history`);
    }

    getInventoryStats(params?: any): Observable<any> {
        let httpParams = new HttpParams();

        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this.http.get(`${this.apiUrl}/stats`, { params: httpParams });
    }
}
