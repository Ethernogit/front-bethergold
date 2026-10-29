import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/product.interfaces';
import { CreateQuotePayload, CreatedQuote, QuoteDetail, QuoteListData, QuoteListParams } from '../interfaces/quote.interfaces';

@Injectable({
    providedIn: 'root'
})
export class QuoteService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/quotes`;

    getQuotes(params: QuoteListParams = {}): Observable<ApiResponse<QuoteListData>> {
        let httpParams = new HttpParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                httpParams = httpParams.set(key, String(value));
            }
        });
        return this.http.get<ApiResponse<QuoteListData>>(this.apiUrl, { params: httpParams });
    }

    createQuote(payload: CreateQuotePayload): Observable<ApiResponse<{ quote: CreatedQuote }>> {
        return this.http.post<ApiResponse<{ quote: CreatedQuote }>>(this.apiUrl, payload);
    }

    getQuote(id: string): Observable<ApiResponse<{ quote: QuoteDetail }>> {
        return this.http.get<ApiResponse<{ quote: QuoteDetail }>>(`${this.apiUrl}/${id}`);
    }

    sendQuoteEmail(id: string, email: string, pdfBase64: string): Observable<ApiResponse<unknown>> {
        return this.http.post<ApiResponse<unknown>>(`${this.apiUrl}/${id}/email`, { email, pdfBase64 });
    }
}
