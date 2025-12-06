import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = `${environment.apiUrl}/user-organization`;

    constructor(private http: HttpClient) { }

    createUser(userData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/create`, userData);
    }

    getUsers(params?: any): Observable<any> {
        return this.http.get(`${this.apiUrl}/users`, { params });
    }

    getUser(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/${id}/role`);
    }

    updateUser(id: string, userData: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, userData);
    }

    changePassword(id: string, password: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}/password`, { password });
    }
}
