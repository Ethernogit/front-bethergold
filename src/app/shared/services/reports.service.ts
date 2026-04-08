import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReportsDateFilter {
    startDate?: string;
    endDate?: string;
    sucursalId?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ReportsService {
    private apiUrl = `${environment.apiUrl}/reports`;

    constructor(private http: HttpClient) {}

    getSalesReport(filters: ReportsDateFilter = {}): Observable<any> {
        let params = new HttpParams();
        if (filters.startDate) params = params.set('startDate', filters.startDate);
        if (filters.endDate) params = params.set('endDate', filters.endDate);
        if (filters.sucursalId) params = params.set('sucursalId', filters.sucursalId);
        return this.http.get<any>(`${this.apiUrl}/sales`, { params });
    }

    getInventoryReport(filters: Pick<ReportsDateFilter, 'sucursalId'> = {}): Observable<any> {
        let params = new HttpParams();
        if (filters.sucursalId) params = params.set('sucursalId', filters.sucursalId);
        return this.http.get<any>(`${this.apiUrl}/inventory`, { params });
    }

    getCashReport(filters: ReportsDateFilter = {}): Observable<any> {
        let params = new HttpParams();
        if (filters.startDate) params = params.set('startDate', filters.startDate);
        if (filters.endDate) params = params.set('endDate', filters.endDate);
        if (filters.sucursalId) params = params.set('sucursalId', filters.sucursalId);
        return this.http.get<any>(`${this.apiUrl}/cash`, { params });
    }
}
