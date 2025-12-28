import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MovementTypeService {
    private apiUrl = `${environment.apiUrl}/products/movement-types`;

    constructor(private http: HttpClient) { }

    getTypes(params?: any) {
        return this.http.get(this.apiUrl, { params });
    }

    getType(id: string) {
        return this.http.get(`${this.apiUrl}/${id}`);
    }

    createType(data: any) {
        return this.http.post(this.apiUrl, data);
    }

    updateType(id: string, data: any) {
        return this.http.put(`${this.apiUrl}/${id}`, data);
    }

    deleteType(id: string) {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}
