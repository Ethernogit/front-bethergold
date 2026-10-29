import { Sucursal } from '../services/sucursal.service';

export type QuoteStatus = 'VIGENTE' | 'CONVERTIDA' | 'CANCELADA';

/** VENCIDA no se guarda: el back la calcula (VIGENTE con la fecha de vencimiento pasada) */
export type QuoteEffectiveStatus = QuoteStatus | 'VENCIDA';

export type QuoteItemType = 'jewelry' | 'custom' | 'service';

export interface QuoteItemSpecifications {
    material?: string;
    karatage?: string;
    weight?: number;
    size?: string;
    /** YYYY-MM-DD; el back la guarda como medianoche UTC, así que se muestra en UTC */
    deliveryDate?: string;
    notes?: string;
}

export interface QuoteItemPayload {
    itemId?: string;
    type: QuoteItemType;
    name: string;
    quantity: number;
    financials: { unitPrice: number; discount: number };
    specifications?: QuoteItemSpecifications;
}

export interface CreateQuotePayload {
    sucursalId: string;
    clientId?: string;
    prospect?: { name: string; email?: string };
    items: QuoteItemPayload[];
    /** 0-100; el back calcula el monto en pesos */
    globalDiscountPercent: number;
    /** ISO con hora: fin del día elegido, en hora local */
    validUntil: string;
    notes?: string;
}

export interface QuoteListItem {
    _id: string;
    folio: string;
    sucursalId: { _id: string; name: string; code: string } | null;
    clientId?: { _id: string; name: string; email?: string } | null;
    prospect?: { name: string; email?: string };
    financials: { total: number };
    validUntil: string;
    status: QuoteStatus;
    effectiveStatus: QuoteEffectiveStatus;
    createdBy?: { _id: string; profile?: { firstName?: string; lastName?: string } } | null;
    createdAt: string;
}

export interface QuoteListParams {
    status?: QuoteEffectiveStatus;
    term?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

export interface QuoteListData {
    quotes: QuoteListItem[];
    pagination: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}

export interface CreatedQuote {
    _id: string;
    folio: string;
    financials: { subtotal: number; globalDiscountPercent: number; globalDiscount: number; total: number };
}

export interface QuoteItemAvailability {
    available: boolean;
    reason?: string;
}

export interface QuoteDetailItem {
    _id: string;
    itemId?: string;
    type: QuoteItemType;
    name: string;
    quantity: number;
    financials: { unitPrice: number; discount: number; subtotal: number };
    specifications?: QuoteItemSpecifications;
    /** Solo piezas de inventario: si hoy se puede vender */
    availability?: QuoteItemAvailability;
}

export interface QuoteDetail {
    _id: string;
    folio: string;
    sucursalId: Pick<Sucursal, '_id' | 'name' | 'code' | 'phone' | 'address' | 'printConfig'> | null;
    clientId?: { _id: string; name: string; email?: string; phone?: string } | null;
    prospect?: { name: string; email?: string };
    items: QuoteDetailItem[];
    /** globalDiscountPercent no existe en cotizaciones de antes del 28-oct (descuento en pesos) */
    financials: { subtotal: number; globalDiscountPercent?: number; globalDiscount: number; total: number };
    validUntil: string;
    status: QuoteStatus;
    effectiveStatus: QuoteEffectiveStatus;
    notes?: string;
    createdBy?: { _id: string; profile?: { firstName?: string; lastName?: string } } | null;
    createdAt: string;
}
