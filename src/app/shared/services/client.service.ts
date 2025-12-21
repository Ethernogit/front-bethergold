
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Client {
    _id?: string;
    name: string;
    type: 'individual' | 'business';
    taxId?: string;
    email?: string;
    phone?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        zipCode?: string;
    };
    notes?: string;
    status: 'active' | 'inactive' | 'blocked';
    creditLimit?: number;
    balance?: number;
    isWholesale?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ClientService {
    private apiUrl = `${environment.apiUrl}/clients`;

    constructor(private http: HttpClient) { }

    getClients(params?: any): Observable<any> {
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

    getClient(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/${id}`);
    }

    createClient(client: Partial<Client>): Observable<any> {
        return this.http.post(this.apiUrl, client);
    }

    updateClient(id: string, client: Partial<Client>): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, client);
    }

    deleteClient(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}
