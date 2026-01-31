import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { NoteService, Note, NoteItem } from '../../../shared/services/note.service';
import { SucursalService, Sucursal } from '../../../shared/services/sucursal.service';
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
    private sucursalService = inject(SucursalService);

    isLoading = true;
    error: string | null = null;

    // UI Data Structures initialized to null or empty to avoid template errors before load
    note: any = null;
    client: any = null;
    items: { reserved: any[], workshop: any[], custom: any[] } = { reserved: [], workshop: [], custom: [] };
    financials: any = null;
    rawNote: Note | null = null; // Store raw backend note for child components
    sucursalDetails: Sucursal | null = null;

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
                                    if (detailResponse.data.sucursalId) {
                                        this.loadSucursal(detailResponse.data.sucursalId);
                                    }
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

    loadSucursal(sucursalId: string) {
        this.sucursalService.getSucursalById(sucursalId).subscribe({
            next: (res) => {
                this.sucursalDetails = res.data;
            },
            error: (err) => console.error('Error loading sucursal', err)
        });
    }

    printNote() {
        if (!this.note || !this.rawNote) return;

        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) return;

        const sucursal = this.sucursalDetails;
        const printConfig = sucursal?.printConfig;

        const logoUrl = printConfig?.logoUrl || '';
        const orgName = sucursal?.name || 'Joyería';

        // Dynamic fields based on config
        const showAddress = printConfig?.showAddress ?? true;
        const showPhone = printConfig?.showPhone ?? true;
        const showClient = printConfig?.showClient ?? true;
        const showSeller = printConfig?.showSeller ?? true;

        const address = (showAddress && sucursal?.address) ?
            `${sucursal.address.street}, ${sucursal.address.city}, ${sucursal.address.state}` : '';
        const phone = (showPhone && sucursal?.phone) ? sucursal.phone : '';

        const ticketWidth = printConfig?.ticketWidth || '80mm';
        const fontFamily = printConfig?.fontFamily || 'Courier New';
        const headerText = printConfig?.headerText || '';
        const footerText = printConfig?.footerText || '¡Gracias por su compra!';
        const website = printConfig?.website || '';
        const facebook = printConfig?.facebook || '';
        const instagram = printConfig?.instagram || '';

        // Items HTML
        let itemsHtml = '';
        this.rawNote.items.forEach(item => {
            // Safe fallback for financials
            const unitPrice = item.financials?.unitPrice || 0;
            const subtotal = item.financials?.subtotal || 0;

            itemsHtml += `
                <tr>
                    <td class="qty-col">${item.quantity}</td>
                    <td class="desc-col">${this.formatDescription(item)}</td>
                    <td class="price-col">$${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td class="total-col">$${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
            `;
        });

        // Payments HTML
        let paymentsHtml = '';
        if (this.financials.transactions && this.financials.transactions.length > 0) {
            paymentsHtml += `<div class="section-title">Pagos Realizados</div>
            <table class="items-table">
                ${this.financials.transactions.map((t: any) => `
                    <tr>
                        <td>${t.date}</td>
                        <td>${t.type}</td>
                        <td class="text-right">$${typeof t.amount === 'number' ? t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : t.amount}</td>
                    </tr>
                `).join('')}
            </table>`;
        }
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Ticket # ${this.note.id}</title>
                <style>
                    /* Reset */
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    
                    body { 
                        font-family: 'Courier New', Courier, monospace; /* Monospace fits receipts better or a clean sans */
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        font-size: 12px; 
                        line-height: 1.2; 
                        color: #000; 
                        width: 80mm; /* Target 80mm Standard Ticket */
                        margin: 0; 
                        padding: 5mm; 
                        background-color: #fff;
                    }
                    
                    .header { text-align: center; margin-bottom: 3mm; }
                    .logo { max-width: 60mm; max-height: 20mm; margin-bottom: 2mm; display: block; margin-left: auto; margin-right: auto; }
                    .org-name { font-size: 14px; font-weight: bold; margin-bottom: 1mm; text-transform: uppercase; }
                    .address { font-size: 10px; margin-bottom: 1mm; }
                    
                    .divider { border-top: 1px dashed #000; margin: 2mm 0; }
                    
                    .meta { font-size: 11px; margin-bottom: 2mm; }
                    .meta-row { display: flex; justify-content: space-between; margin-bottom: 1mm; }
                    
                    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 2mm; font-size: 11px; }
                    .items-table th { text-align: left; border-bottom: 1px dashed #000; padding: 1mm 0; font-weight: bold; }
                    .items-table td { padding: 1mm 0; vertical-align: top; }
                    .qty-col { width: 10%; text-align: center; }
                    .desc-col { width: 55%; }
                    .price-col { width: 15%; text-align: right; }
                    .total-col { width: 20%; text-align: right; }
                    
                    .totals { margin-top: 2mm; }
                    .total-row { display: flex; justify-content: space-between; margin-bottom: 1mm; }
                    .grand-total { font-weight: bold; font-size: 16px; margin-top: 2mm; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 2mm 0; }
                    
                    .payments { margin-top: 3mm; }
                    .section-title { font-weight: bold; text-align: center; margin-bottom: 1mm; font-size: 11px; text-transform: uppercase; }
                    
                    .footer { text-align: center; margin-top: 5mm; font-size: 10px; }
                    
                    @media print {
                        body { width: 100%; margin: 0; padding: 2mm; }
                        @page { 
                            size: 80mm auto; /* Fixed width, fluid height */
                            margin: 0; 
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    ${logoUrl ? `<img src="${logoUrl}" class="logo" alt="Logo"/>` : ''}
                    <div class="org-name">${orgName}</div>
                    <div class="address">${address}</div>
                    ${phone ? `<div class="address">Tel: ${phone}</div>` : ''}
                </div>
                
                <div class="divider"></div>

                <div class="meta">
                    <div class="meta-row"><span>FOLIO:</span> <strong>${this.note.id}</strong></div>
                    <div class="meta-row"><span>FECHA:</span> <span>${this.note.dateCreated} ${this.note.time}</span></div>
                </div>
                
                <div class="divider"></div>
                
                <div class="meta">
                    <div class="meta-row"><span>CLIENTE:</span> <span style="text-align:right; max-width: 60%;">${this.client.name}</span></div>
                    ${this.client.phone && this.client.phone !== 'Sin teléfono' ? `<div class="meta-row"><span>TEL:</span> <span>${this.client.phone}</span></div>` : ''}
                    <div class="meta-row"><span>ATENDIÓ:</span> <span>${this.note.agent}</span></div>
                </div>

                <div class="divider"></div>

                <table class="items-table">
                    <thead>
                        <tr>
                            <th class="qty-col">C.</th>
                            <th class="desc-col">DESCRIPCIÓN</th>
                            <th class="price-col">P.U</th>
                            <th class="total-col">IMP</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div class="divider"></div>

                <div class="totals">
                    <div class="total-row">
                        <span>SUBTOTAL:</span>
                        <span>$${this.financials.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    ${this.financials.tax > 0 ? `
                    <div class="total-row">
                        <span>IMPUESTOS:</span>
                        <span>$${this.financials.tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>` : ''}
                    <div class="total-row grand-total">
                        <span>TOTAL:</span>
                        <span>$${this.financials.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div class="total-row" style="margin-top: 2px;">
                        <span>PAGADO:</span>
                        <span>$${this.financials.paid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div class="total-row">
                        <span>PENDIENTE:</span>
                        <span>$${this.financials.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                ${paymentsHtml}

                <div class="footer">
                    <div class="divider"></div>
                    <div style="margin-bottom: 2mm;">${footerText}</div>
                    ${website ? `<div>${website}</div>` : ''}
                    ${facebook ? `<div>FB: ${facebook}</div>` : ''}
                    ${instagram ? `<div>IG: ${instagram}</div>` : ''}
                    <div style="margin-top: 5mm; font-size: 9px;">*** COPIA CLIENTE ***</div>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    }
}
