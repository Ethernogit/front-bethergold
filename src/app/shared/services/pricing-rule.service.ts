import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface PricingRule {
    _id?: string;
    name: string;
    description?: string;
    active: boolean;
    priority: number;
    criteriaType: 'CATEGORY' | 'MATERIAL' | 'SUBCATEGORY';
    criteriaValue: string;
    ruleType: 'PRICE_PER_GRAM' | 'FIXED_PRICE' | 'DISCOUNT_PERCENTAGE';
    ruleValue: number;
    clientType: string;
    createdAt?: string;
    updatedAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class PricingRuleService {
    private apiUrl = `${environment.apiUrl}/organizations/pricing-rules`;

    constructor(private http: HttpClient) { }

    getPricingRules(params?: any): Observable<any> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this.http.get<any>(this.apiUrl, { params: httpParams });
    }

    getPricingRuleById(id: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`);
    }

    createPricingRule(data: Partial<PricingRule>): Observable<any> {
        return this.http.post<any>(this.apiUrl, data);
    }

    updatePricingRule(id: string, data: Partial<PricingRule>): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, data);
    }

    deletePricingRule(id: string): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }
}
