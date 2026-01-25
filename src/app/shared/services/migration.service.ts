import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class MigrationService {
    private apiUrl = `${environment.apiUrl}/migration`;

    constructor(private http: HttpClient) { }

    importData(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/import`, data);
    }
}
