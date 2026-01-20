import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SupportService {
    private apiUrl = `${environment.apiUrl}/support-tickets`;
    private roadmapUrl = `${environment.apiUrl}/roadmap`;

    constructor(private http: HttpClient) { }

    // Tickets
    createTicket(data: any): Observable<any> {
        return this.http.post(this.apiUrl, data);
    }

    getTickets(page: number = 1, limit: number = 10, status?: string): Observable<any> {
        let params = new HttpParams()
            .set('page', page)
            .set('limit', limit);

        if (status) params = params.set('status', status);

        return this.http.get(this.apiUrl, { params });
    }

    getTicketById(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/${id}`);
    }

    // Roadmap
    getRoadmapItems(): Observable<any> {
        return this.http.get(this.roadmapUrl);
    }
}
