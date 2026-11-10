// Descuentos automáticos de la organización (back: /api/v1/discounts)

export type DiscountScope = 'all' | 'category' | 'subcategory';

export type CombineMode = 'chained' | 'summed' | 'highest' | 'most_specific';

// Calculado por el back: apagado, todavía no empieza, ya terminó o aplicando hoy
export type DiscountEffectiveStatus = 'inactive' | 'scheduled' | 'expired' | 'active';

export interface DiscountSettings {
    cap: number;
    combineMode: CombineMode;
}

interface NamedRef {
    _id: string;
    name: string;
}

export interface Discount {
    _id: string;
    name: string;
    percent: number;
    scope: DiscountScope;
    categoryId?: NamedRef | null;
    subcategoryId?: (NamedRef & { categoryId?: NamedRef | null }) | null;
    startsAt?: string | null;
    endsAt?: string | null;
    isActive: boolean;
    effectiveStatus: DiscountEffectiveStatus;
    createdAt: string;
    createdBy?: { profile?: { firstName?: string; lastName?: string } } | null;
}

// Lo que se captura. Las fechas van como "AAAA-MM-DD" (día de México); null borra la fecha.
export interface DiscountPayload {
    name: string;
    percent: number;
    scope: DiscountScope;
    categoryId?: string;
    subcategoryId?: string;
    startsAt?: string | null;
    endsAt?: string | null;
}

export interface DiscountListParams {
    status?: 'active' | 'inactive';
    term?: string;
    page?: number;
    limit?: number;
}

export interface DiscountListData {
    discounts: Discount[];
    pagination: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
