import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NoteItem {
    itemId?: string; // Optional if custom item
    itemModel: 'Product' | 'Service' | 'Custom' | 'Inventory';
    type: 'jewelry' | 'service' | 'repair' | 'custom' | 'gold_buying' | 'pawn';
    name: string;
    quantity: number;
    financials: {
        unitPrice: number;
        discount: number;
        tax: number;
        subtotal: number;
    };
    specifications?: {
        material?: string;
        gemstone?: string;
        caratWeight?: number;
        size?: string;
        serviceType?: string;
        duration?: string;
        notes?: string;
        [key: string]: any;
    };
    tags?: string[];
}

export interface NotePayment {
    amount: number;
    method: 'cash' | 'card' | 'transfer' | 'deposit' | 'credit' | 'other';
    reference?: string;
    date?: Date;
}

export interface Note {
    _id?: string;
    folio?: string;
    organizationId?: string;
    sucursalId: string;
    clientId: string;
    sellerId?: string;
    items: NoteItem[];
    financials: {
        subtotal: number;
        globalDiscount: number;
        taxTotal: number;
        total: number;
        balancePaid: number;
        balanceDue: number;
    };
    payments: NotePayment[];
    status?: 'BORRADOR' | 'PENDIENTE_PAGO' | 'PAGADA' | 'ENTREGADA' | 'ANULADA';
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

@Injectable({
    providedIn: 'root'
})
export class NoteService {
    private apiUrl = `${environment.apiUrl}/sales`; // Matches route mount '/sales'

    constructor(private http: HttpClient) { }

    createNote(note: Note): Observable<{ success: boolean; data: Note; message?: string }> {
        return this.http.post<{ success: boolean; data: Note; message?: string }>(this.apiUrl, note);
    }

    getNotes(filters?: { term?: string }): Observable<{ success: boolean; data: Note[] }> {
        let params = new HttpParams();
        if (filters?.term) {
            params = params.set('term', filters.term);
        }
        return this.http.get<{ success: boolean; data: Note[] }>(this.apiUrl, { params });
    }

    getNoteById(id: string): Observable<{ success: boolean; data: Note }> {
        return this.http.get<{ success: boolean; data: Note }>(`${this.apiUrl}/${id}`);
    }

    addPayment(noteId: string, payment: NotePayment): Observable<{ success: boolean; data: Note; message?: string }> {
        return this.http.post<{ success: boolean; data: Note; message?: string }>(`${this.apiUrl}/${noteId}/payments`, payment);
    }
}
