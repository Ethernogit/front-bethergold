import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { NoteService, Note, NoteItem } from '../../../shared/services/note.service';
import { GlobalPaymentComponent } from '../components/global-payment/global-payment.component';

@Component({
    selector: 'app-note-details',
    standalone: true,
    imports: [CommonModule, RouterLink, GlobalPaymentComponent],
    templateUrl: './note-details.component.html',
    styleUrl: './note-details.component.css'
})
export class NoteDetailsComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private noteService = inject(NoteService);

    isLoading = true;
    error: string | null = null;

    // UI Data Structures initialized to null or empty to avoid template errors before load
    note: any = null;
    client: any = null;
    items: { reserved: any[], workshop: any[], custom: any[] } = { reserved: [], workshop: [], custom: [] };
    financials: any = null;
    rawNote: Note | null = null; // Store raw backend note for child components

    // Modal State
    showPaymentModal = signal(false);

    // Tab State
    currentTab: 'general' | 'items' | 'payments' = 'items';

    setTab(tab: 'general' | 'items' | 'payments') {
        this.currentTab = tab;
    }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const folio = params.get('folio');
            if (folio) {
                this.loadNote(folio);
            } else {
                this.error = 'No se proporcionó folio';
                this.isLoading = false;
            }
        });
    }

    loadNote(folio: string) {
        this.isLoading = true;
        this.error = null;
        this.noteService.getNotes({ term: folio }).subscribe({
            next: (response) => {
                if (response.success && response.data.length > 0) {
                    // Try to find exact match by folio, otherwise take the first result
                    const foundLiteNote = response.data.find(n => n.folio === folio) || response.data[0];

                    if (foundLiteNote._id) {
                        // Fetch full details using the ID
                        this.noteService.getNoteById(foundLiteNote._id).subscribe({
                            next: (detailResponse) => {
                                if (detailResponse.success) {
                                    this.mapNoteData(detailResponse.data);
                                } else {
                                    this.error = 'Error al cargar detalles completos';
                                }
                                this.isLoading = false;
                            },
                            error: (err) => {
                                console.error('Error fetching full note details', err);
                                this.error = 'Error al cargar detalles completos';
                                this.isLoading = false;
                            }
                        });
                    } else {
                        // Fallback if no ID (unlikely)
                        console.warn('Note found but has no ID, using lite data');
                        this.mapNoteData(foundLiteNote);
                        this.isLoading = false;
                    }
                } else {
                    this.error = 'Nota no encontrada';
                    this.isLoading = false;
                }
            },
            error: (err) => {
                console.error('Error loading note', err);
                this.error = 'Error al cargar los detalles de la nota';
                this.isLoading = false;
            }
        });
    }

    mapNoteData(backendNote: Note) {
        console.log('Mapping Note Data:', backendNote);
        this.rawNote = backendNote;
        // Map backend data to UI structure
        this.note = {
            id: backendNote.folio,
            status: this.normalizeStatus(backendNote.status || ''),
            dateCreated: backendNote.createdAt ? new Date(backendNote.createdAt).toLocaleDateString() : '',
            time: backendNote.createdAt ? new Date(backendNote.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            agent: typeof backendNote.sellerId === 'object' ? `${backendNote.sellerId.profile.firstName} ${backendNote.sellerId.profile.lastName}` : 'Agente Desconocido',
            location: 'Sucursal Principal', // transform sucursalId if needed, or hardcode for now
            privateNotes: backendNote.notes || ''
        };

        // Client Mapping
        if (typeof backendNote.clientId === 'object' && backendNote.clientId !== null) {
            this.client = {
                name: backendNote.clientId.name,
                id: backendNote.clientId._id, // Or use a friendly ID if available
                isVip: false, // Backend doesn't seem to have this yet
                vipLevel: 'Standard',
                phone: backendNote.clientId.phone || 'Sin teléfono',
                email: backendNote.clientId.email || 'Sin email',
                location: 'Desconocida',
                avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(backendNote.clientId.name) // Fallback avatar
            };
        } else {
            this.client = {
                name: 'Cliente Desconocido',
                id: backendNote.clientId as string,
                avatar: 'https://ui-avatars.com/api/?name=Unknown'
            };
        }

        // Items Mapping
        this.items = { reserved: [], workshop: [], custom: [] };
        if (backendNote.items && Array.isArray(backendNote.items)) {
            backendNote.items.forEach(item => {
                // Safely extract Ref/SKU
                let ref = 'N/A';
                if (item.specifications?.notes) {
                    ref = item.specifications.notes;
                } else if (item.itemId && typeof item.itemId === 'object' && (item.itemId as any).barcode) {
                    ref = (item.itemId as any).barcode;
                } else if (item.itemId && typeof item.itemId === 'string') {
                    ref = item.itemId;
                }

                const uiItem = {
                    id: typeof item.itemId === 'string' ? item.itemId : (item.itemId as any)?._id || 'N/A',
                    name: item.name || 'Sin Nombre',
                    ref: ref,
                    description: this.formatDescription(item),
                    price: item.financials?.unitPrice || 0,
                    status: item.deliveryStatus === 'pending' ? 'Pendiente de Entrega' : 'Entregado',
                    // Workshop specific
                    title: item.name || 'Servicio',
                    jobId: typeof item.itemId === 'string' ? item.itemId : (item.itemId as any)?._id || 'N/A',
                    estReady: item.specifications?.duration || 'Por definir',
                    // Safe status fallback
                    itemStatus: item.deliveryStatus || 'Pending'
                };

                const model = (item.itemModel || '').toLowerCase();
                const type = (item.type || '').toLowerCase();

                if (model === 'product' || model === 'inventory') {
                    this.items.reserved.push(uiItem);
                } else if (model === 'service' || type === 'service' || type === 'repair') {
                    this.items.workshop.push(uiItem);
                } else if (model === 'custom' || type === 'custom') {
                    this.items.custom.push(uiItem);
                } else {
                    // Default to reserved if unknown
                    this.items.reserved.push(uiItem);
                }
            });
        }

        // Financials Mapping
        this.financials = {
            subtotal: backendNote.financials?.subtotal || 0,
            tax: backendNote.financials?.taxTotal || 0,
            total: backendNote.financials?.total || 0,
            paid: backendNote.financials?.balancePaid || 0,
            balance: backendNote.financials?.balanceDue || 0,
            transactions: backendNote.payments ? backendNote.payments.map(p => ({
                type: p.method,
                date: p.date ? new Date(p.date).toLocaleString() : '',
                amount: p.amount || 0
            })) : []
        };
    }

    onPaymentSuccess(updatedNote: Note) {
        this.mapNoteData(updatedNote);
        // Maybe show a toast success?
    }

    private formatDescription(item: NoteItem): string {
        const parts = [];
        const product = typeof item.itemId === 'object' ? (item.itemId as any) : null;

        // 1. Category / Subcategory
        if (product) {
            const catName = typeof product.category === 'object' ? product.category.name : product.category;
            const subName = typeof product.subcategory === 'object' ? product.subcategory.name : product.subcategory;

            if (catName && subName) parts.push(`${catName} - ${subName}`);
            else if (catName) parts.push(catName);
        }

        // 2. Material (Gold Type)
        // Prefer specs, then product details
        const material = item.specifications?.material || product?.jewelryDetails?.goldType;
        if (material) parts.push(material);

        // 3. Karatage
        const karatage = (item.specifications && item.specifications['karatage']) || product?.jewelryDetails?.karatage;
        if (karatage) parts.push(karatage);

        // 4. Weight
        const weight = (item.specifications && item.specifications['weight']) || product?.specifications?.weight;
        if (weight) parts.push(`${weight}g`);

        // 5. Diamond Points
        const points = (item.specifications && item.specifications['diamondPoints']) || product?.jewelryDetails?.diamondPoints;
        if (points) parts.push(`${points} pts`);

        return parts.join(' • ') || item.name;
    }

    normalizeStatus(status: string): string {
        if (!status) return 'Borrador';
        const map: { [key: string]: string } = {
            'BORRADOR': 'Borrador',
            'PENDIENTE_PAGO': 'Pago Pendiente',
            'PAGADA': 'Pagado',
            'ENTREGADA': 'Entregado',
            'ANULADA': 'Anulada'
        };
        return map[status] || status;
    }
}
