import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CashCut {
    _id?: string;
    organizationId: string;
    sucursalId: string;
    status: 'open' | 'closed';
    initialAmount: number;
    startDate: string;
    endDate?: string;
    openedBy?: any;
    closedBy?: any;
    totals?: {
        totalSalesCash: number;
        totalSalesCard: number;
        totalSalesTransfer: number;
        totalErasures: number;
        totalIncomes: number;
        totalSystemCalculated: number;
        totalDeclared: number;
        difference: number;
    };
    notes?: string;
}

export interface CashMovement {
    _id?: string;
    type: 'IN' | 'OUT';
    subtype: string;
    amount: number;
    description: string;
    date: string;
    method?: 'cash' | 'transfer' | 'card';
    createdBy: string;
}

export interface ShiftReport {
    shift: CashCut;
    financials: {
        initialAmount: number;
        sales: {
            cash: number;
            card: number;
            transfer: number;
            other: number;
            total: number;
        };
        movements: {
            in: number;
            inDigital?: number;
            out: number;
            outDigital?: number;
            details: CashMovement[];
        };
        expectedCashInDrawer: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class CashCutService {
    private apiUrl = `${environment.apiUrl}/sales/cash-cuts`;
    private movementsUrl = `${environment.apiUrl}/sales/cash-movements`;

    constructor(private http: HttpClient) { }

    openShift(sucursalId: string, initialAmount: number): Observable<CashCut> {
        return this.http.post<CashCut>(`${this.apiUrl}/open`, { sucursalId, initialAmount });
    }

    getCurrentShift(sucursalId: string): Observable<ShiftReport> {
        const params = new HttpParams().set('sucursalId', sucursalId);
        return this.http.get<ShiftReport>(`${this.apiUrl}/current`, { params });
    }

    closeShift(sucursalId: string, totalDeclared: number, notes?: string): Observable<CashCut> {
        return this.http.post<CashCut>(`${this.apiUrl}/close`, { sucursalId, totalDeclared, notes });
    }

    getHistory(sucursalId?: string, page: number = 1, limit: number = 10): Observable<any> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (sucursalId) {
            params = params.set('sucursalId', sucursalId);
        }

        return this.http.get<any>(`${this.apiUrl}/history`, { params });
    }

    // Movements
    createMovement(movement: { sucursalId: string, type: 'IN' | 'OUT', subtype: string, amount: number, description: string, method?: string }): Observable<CashMovement> {
        return this.http.post<CashMovement>(this.movementsUrl, movement);
    }

    deleteMovement(id: string): Observable<any> {
        return this.http.delete(`${this.movementsUrl}/${id}`);
    }
}
