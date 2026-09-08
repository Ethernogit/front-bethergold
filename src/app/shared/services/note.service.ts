import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NoteItem {
    _id?: string;
    itemId?: string;
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
    deliveryStatus?: 'immediate' | 'pending';
    returned?: boolean;
    returnedAt?: Date;
}

export interface NotePayment {
    amount: number;
    method: 'cash' | 'card' | 'transfer' | 'deposit' | 'points' | 'credit' | 'other';
    reference?: string;
    date?: Date;
}

export interface Note {
    _id?: string;
    folio?: string;
    organizationId?: string;
    sucursalId: string;
    type?: string;
    clientId: string | { _id: string; name: string; email?: string; phone?: string };
    sellerId?: string | { profile: { firstName: string; lastName: string } };
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
    status?: 'BORRADOR' | 'PENDIENTE_PAGO' | 'PAGADA' | 'ENTREGADA' | 'ANULADA' | 'CONSIGNACION' | 'CONCILIADA';
    notes?: string;
    reconciliation?: NoteReconciliation;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Set when a migrated note is closed without registering payments. Keeps the original
 * balance so the gap stays auditable, and a snapshot so it can be reverted.
 */
export interface NoteReconciliation {
    originalStatus?: string;
    originalBalanceDue?: number;
    reason?: string;
    reconciledBy?: string | { profile?: { firstName?: string; lastName?: string } };
    reconciledAt?: Date;
}

export interface LegacyLookupItem {
    name: string;
    type: string;
    returned?: boolean;
    subtotal: number;
    barcode: string | null;
    sku: string | null;
    productStatus: string | null;
    isMatch: boolean;
}

export interface LegacyLookupPayment {
    amount: number;
    method: string;
    date?: Date;
    reference?: string;
    isLegacy: boolean;
}

export interface LegacyLookupNote {
    _id: string;
    folio: string;
    createdAt: Date;
    status: string;
    client: { name: string; phone?: string } | null;
    financials: { total: number; balancePaid: number; balanceDue: number };
    items: LegacyLookupItem[];
    payments: LegacyLookupPayment[];
}

export interface LegacyLookupResult {
    term: string;
    /** Distinguishes "no such barcode" from "product isn't in any pending legacy note". */
    productFound: boolean;
    notes: LegacyLookupNote[];
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

    getNotes(filters?: any): Observable<{ success: boolean; data: Note[]; pagination?: any }> {
        let params = new HttpParams();
        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
                    params = params.set(key, filters[key]);
                }
            });
        }
        return this.http.get<{ success: boolean; data: Note[]; pagination?: any }>(this.apiUrl, { params });
    }

    getNoteById(id: string): Observable<{ success: boolean; data: Note }> {
        return this.http.get<{ success: boolean; data: Note }>(`${this.apiUrl}/${id}`);
    }

    addPayment(noteId: string, payment: NotePayment): Observable<{ success: boolean; data: Note; message?: string }> {
        return this.http.post<{ success: boolean; data: Note; message?: string }>(`${this.apiUrl}/${noteId}/payments`, payment);
    }

    cancelNote(noteId: string): Observable<{ success: boolean; data: Note; message?: string }> {
        return this.http.put<{ success: boolean; data: Note; message?: string }>(`${this.apiUrl}/${noteId}/cancel`, {});
    }

    updateClient(noteId: string, clientId: string): Observable<{ success: boolean; data: Note; message?: string }> {
        return this.http.put<{ success: boolean; data: Note; message?: string }>(`${this.apiUrl}/${noteId}/client`, { clientId });
    }

    updateItemDeliveryStatus(noteId: string, itemId: string): Observable<{ success: boolean; data: Note; message?: string }> {
        return this.http.put<{ success: boolean; data: Note; message?: string }>(`${this.apiUrl}/${noteId}/items/${itemId}/deliver`, {});
    }

    /** Find migrated notes still pending payment by product barcode/SKU or folio. */
    legacyLookup(term: string): Observable<{ success: boolean; data: LegacyLookupResult }> {
        return this.http.get<{ success: boolean; data: LegacyLookupResult }>(`${this.apiUrl}/legacy-lookup`, {
            params: { q: term }
        });
    }

    /** Close a migrated note without registering payments (does not affect cash cuts). */
    reconcileNote(noteId: string, reason: string): Observable<{ success: boolean; data: Note; message?: string }> {
        return this.http.post<{ success: boolean; data: Note; message?: string }>(`${this.apiUrl}/${noteId}/reconcile`, { reason });
    }

    revertReconciliation(noteId: string): Observable<{ success: boolean; data: Note; message?: string }> {
        return this.http.post<{ success: boolean; data: Note; message?: string }>(`${this.apiUrl}/${noteId}/reconcile/revert`, {});
    }

    checkFolioAvailability(value: string): Observable<{ success: boolean; available: boolean; folio: string }> {
        return this.http.get<{ success: boolean; available: boolean; folio: string }>(`${this.apiUrl}/folio/check`, {
            params: { value }
        });
    }

    returnNoteItem(noteId: string, itemNoteId: string): Observable<{ success: boolean; data: Note; message?: string; pointsGenerated?: number }> {
        return this.http.put<{ success: boolean; data: Note; message?: string; pointsGenerated?: number }>(`${this.apiUrl}/${noteId}/items/${itemNoteId}/return`, {});
    }

    settleConsignment(noteId: string, payload: any): Observable<{ success: boolean; data: any; message?: string }> {
        return this.http.post<{ success: boolean; data: any; message?: string }>(`${this.apiUrl}/${noteId}/consignments/settle`, payload);
    }

    sendEmailReceipt(noteId: string, email: string, pdfBase64: string): Observable<{ success: boolean; message?: string }> {
        return this.http.post<{ success: boolean; message?: string }>(`${this.apiUrl}/${noteId}/email`, { email, pdfBase64 });
    }
}
