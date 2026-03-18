import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { NoteService, Note, NoteItem } from '../../../shared/services/note.service';
import { SucursalService, Sucursal } from '../../../shared/services/sucursal.service';
import { CashCutService } from '../../../shared/services/cash-cut.service'; // Import
import { ToastService } from '../../../shared/services/toast.service'; // Import
import { GlobalPaymentComponent } from '../components/global-payment/global-payment.component';
import { ClientSelectionModalComponent } from '../new-note/components/client-selection-modal/client-selection-modal.component';
import { environment } from '../../../../environments/environment';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
const pdfMakeConfig = pdfMake as any;
pdfMakeConfig.vfs = (pdfFonts as any).pdfMake ? (pdfFonts as any).pdfMake.vfs : (pdfFonts as any).vfs;

@Component({
    selector: 'app-note-details',
    standalone: true,
    imports: [CommonModule, RouterLink, GlobalPaymentComponent, ClientSelectionModalComponent],
    templateUrl: './note-details.component.html',
    styleUrl: './note-details.component.css'
})
export class NoteDetailsComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private noteService = inject(NoteService);
    private sucursalService = inject(SucursalService);
    private cashCutService = inject(CashCutService); // Inject
    private toastService = inject(ToastService); // Inject

    isLoading = true;
    error: string | null = null;
    isSendingEmail = false;

    // UI Data Structures initialized to null or empty to avoid template errors before load
    note: any = null;
    client: any = null;
    items: { reserved: any[], workshop: any[], custom: any[] } = { reserved: [], workshop: [], custom: [] };
    financials: any = null;
    rawNote: Note | null = null; // Store raw backend note for child components
    sucursalDetails: Sucursal | null = null;

    // Modal State
    showPaymentModal = signal(false);
    showClientModal = signal(false);
    clientRequiredWarning = signal(false);

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

    loadSucursal(sucursalId: string | any) {
        // Handle object population if needed
        const sId = (typeof sucursalId === 'object' && sucursalId !== null) ? sucursalId._id : sucursalId;
        if (!sId) return;

        this.sucursalService.getSucursalById(sId).subscribe({
            next: (response: any) => {
                if (response.success && response.data) {
                    this.sucursalDetails = response.data;
                }
            },
            error: (err: any) => {
                console.error('Error loading sucursal details', err);
            }
        });
    }

    mapNoteData(backendNote: Note) {
        this.rawNote = backendNote;
        // Map backend data to UI structure
        this.note = {
            id: backendNote.folio,
            status: this.normalizeStatus(backendNote.status || ''),
            dateCreated: backendNote.createdAt ? new Date(backendNote.createdAt).toLocaleDateString() : '',
            time: backendNote.createdAt ? new Date(backendNote.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            agent: (typeof backendNote.sellerId === 'object' && backendNote.sellerId !== null && backendNote.sellerId.profile) ? `${backendNote.sellerId.profile.firstName || ''} ${backendNote.sellerId.profile.lastName || ''}`.trim() : 'Agente Desconocido',
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
                avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(backendNote.clientId.name),
                isUnknown: false,
                points: (backendNote.clientId as any).points || 0
            };
        } else {
            this.client = {
                name: 'Público en General',
                id: backendNote.clientId as string,
                avatar: 'https://ui-avatars.com/api/?name=Unknown',
                isUnknown: true,
                points: 0
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
                    jobId: ref !== 'N/A' ? ref : (typeof item.itemId === 'string' ? item.itemId : (item.itemId as any)?._id || 'N/A'),
                    estReady: item.specifications?.['deliveryDate'] || item.specifications?.duration || 'Por definir',
                    // Safe status fallback
                    itemStatus: item.deliveryStatus || 'Pending',
                    isHechura: !!(item.specifications && item.specifications['karatage']), // Heuristic for Hechura
                    returned: (item as any).returned || false
                };

                const model = (item.itemModel || '').toLowerCase();
                const type = (item.type || '').toLowerCase();

                if (model === 'product' || model === 'inventory') {
                    this.items.reserved.push(uiItem);
                } else if (model === 'service' || type === 'service' || type === 'repair') {
                    this.items.workshop.push(uiItem);
                } else if ((model === 'custom' || type === 'custom') && type !== 'jewelry') {
                    this.items.custom.push(uiItem);
                } else {
                    // Default to reserved (Products) - This catches Express items (model=Custom, type=jewelry)
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

    openPaymentModal() {
        if (this.client?.isUnknown || !this.client?.id) {
            this.toastService.warning('Debe asignar un cliente a la nota antes de registrar un pago.');
            this.clientRequiredWarning.set(true);
            setTimeout(() => this.clientRequiredWarning.set(false), 2000);
            return;
        }

        const sucursalId = this.rawNote?.sucursalId;

        // If sucursalId is an object (populated), we need the ID string. 
        // Based on model it refers to Sucursal, usually populated as object or string.
        const sId = (typeof sucursalId === 'object' && sucursalId !== null) ? (sucursalId as any)._id : sucursalId;

        if (!sId) {
            this.toastService.warning('No se pudo identificar la sucursal de esta nota.');
            return;
        }

        // Check for open shift
        // We need to inject CashCutService first. (See next edits)
        // Since I can't inject in this method without constructor change, I will do it via separate edits or assume injected.
        // Actually, let's use the injected service in the class property that I will add.

        // Wait, I need to add the injection first or 'this.cashCutService' won't exist.
        // I will assume I am adding 'private cashCutService = inject(CashCutService);' in the properties.

        this.cashCutService.getCurrentShift(sId).subscribe({
            next: () => {
                this.showPaymentModal.set(true);
            },
            error: () => {
                this.toastService.warning('No hay caja abierta. Debe abrir caja para registrar pagos.');
            }
        });
    }

    private formatDescription(item: NoteItem): string {
        const parts = [];
        const product = typeof item.itemId === 'object' ? (item.itemId as any) : null;

        // 1. Category / Subcategory
        if (product) {
            const catName = typeof product.category === 'object' && product.category !== null ? product.category.name : product.category;
            const subName = typeof product.subcategory === 'object' && product.subcategory !== null ? product.subcategory.name : product.subcategory;

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

    generateHtmlTicket(): string {
        const sucursal = this.sucursalDetails;
        const printConfig = sucursal?.printConfig;

        let logoUrl = '';
        if (printConfig?.logoUrl) {
            logoUrl = environment.apiUrl.replace('/api/v1', '') + printConfig.logoUrl;
        }
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
        this.rawNote?.items.forEach(item => {
            // Safe fallback for financials
            const unitPrice = item.financials?.unitPrice || 0;
            const subtotal = item.financials?.subtotal || 0;

            // Extract Ref/SKU
            let ref = '';
            if (item.specifications?.notes) {
                ref = item.specifications.notes;
            } else if (item.itemId && typeof item.itemId === 'object' && (item.itemId as any).barcode) {
                ref = (item.itemId as any).barcode;
            }

            itemsHtml += `
                <tr>
                    <td class="qty-col">${item.quantity}</td>
                    <td class="desc-col">
                        ${ref ? `<b>#${ref}</b> ` : ''}${this.formatDescription(item)}
                    </td>
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
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Ticket # ${this.note.id}</title>
                <style>
                    /* Reset */
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    
                    body { 
                        font-family: 'Courier New', Courier, monospace;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        font-size: 12px; 
                        line-height: 1.2; 
                        color: #000; 
                        width: 80mm; 
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
                    .fontlittle { font-size: 9px; line-height: 1.1; margin: 0; padding: 0; }
                    ul.fontlittle { text-align: left; padding-left: 5mm; margin: 2mm 0; }
                    ul.fontlittle li { margin-bottom: 1mm; }
                    .footer p { margin: 2mm 0; }
                    
                    @media print {
                        body { width: 100%; margin: 0; padding: 2mm; }
                        @page { 
                            size: 80mm auto;
                            margin: 0; 
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    ${logoUrl ? `<img src="${logoUrl}" class="logo" alt="Logo"/>` : ''}
                    <div class="org-name">${orgName}</div>
                    ${headerText ? `<div class="p-2" style="white-space: pre-line; text-align: center; margin-bottom: 2mm;">${headerText}</div>` : ''}
                    ${!headerText ? `<div class="address">${address}</div>` : ''}
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
            </body>
            </html>
        `;
    }

    printNote() {
        if (!this.note || !this.rawNote) return;

        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) return;

        const htmlContent = this.generateHtmlTicket();

        // Add print-specific script wrapper
        const printHtml = `
            ${htmlContent}
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                }
            </script>
        `;

        printWindow.document.write(printHtml);
        printWindow.document.close();
    }

    onClientSelected(client: any) {
        if (!this.rawNote?._id) return;

        this.isLoading = true;
        this.noteService.updateClient(this.rawNote._id, client._id).subscribe({
            next: (response) => {
                if (response.success) {
                    this.showClientModal.set(false);
                    this.toastService.success('Cliente asignado correctamente');
                    // Refresh data
                    this.mapNoteData(response.data);
                } else {
                    this.toastService.error(response.message || 'Error al actualizar cliente');
                }
                this.isLoading = false;
            },
            error: (err) => {
                console.error(err);
                this.toastService.error('Error al actualizar cliente');
                this.isLoading = false;
            }
        });
    }

    markAsDelivered(itemId: string) {
        if (!this.rawNote?._id) return;

        this.isLoading = true;
        this.noteService.updateItemDeliveryStatus(this.rawNote._id, itemId).subscribe({
            next: (response) => {
                if (response.success) {
                    this.toastService.success('Artículo marcado como entregado');
                    this.mapNoteData(response.data);
                } else {
                    this.toastService.error(response.message || 'Error al actualizar el estado de entrega');
                }
                this.isLoading = false;
            },
            error: (err) => {
                console.error(err);
                this.toastService.error('Error al actualizar el estado de entrega');
                this.isLoading = false;
            }
        });
    }

    async sendEmail() {
        if (!this.rawNote?._id || !this.client?.email || this.client.email === 'Sin email') {
            this.toastService.warning('El cliente no tiene un correo electrónico válido registrado.');
            return;
        }

        this.isSendingEmail = true;

        try {
            const sucursal = this.sucursalDetails;
            const printConfig = sucursal?.printConfig;

            let base64Logo: string | null = null;
            if (printConfig?.logoUrl) {
                const logoUrl = environment.apiUrl.replace('/api/v1', '') + printConfig.logoUrl;
                try {
                    const response = await fetch(logoUrl);
                    const blob = await response.blob();
                    base64Logo = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                } catch (e) {
                    console.warn('No se pudo cargar el logo para el PDF', e);
                }
            }

            const orgName = sucursal?.name || 'Joyería';
            const showAddress = printConfig?.showAddress ?? true;
            const showPhone = printConfig?.showPhone ?? true;

            const addressParts = [];
            if (sucursal?.address) {
                if (sucursal.address.street) addressParts.push(sucursal.address.street.trim());
                if (sucursal.address.city) addressParts.push(sucursal.address.city);
                if (sucursal.address.state) addressParts.push(sucursal.address.state);
                if (sucursal.address.zipCode) addressParts.push(`C.P. ${sucursal.address.zipCode}`);
                if (sucursal.address.country) addressParts.push(sucursal.address.country);
            }
            const addressStr = (showAddress && addressParts.length > 0) ? addressParts.join(', ') : '';
            const phoneStr = (showPhone && sucursal?.phone) ? sucursal.phone : '';

            // Construir tabla de artículos
            const itemsBody: any[][] = [
                [
                    { text: 'CANT.', style: 'tableHeader' }, 
                    { text: 'DESCRIPCIÓN', style: 'tableHeader' }, 
                    { text: 'P.U.', style: 'tableHeader', alignment: 'right' }, 
                    { text: 'IMPORTE', style: 'tableHeader', alignment: 'right' }
                ]
            ];

            this.rawNote.items.forEach(item => {
                const unitPrice = item.financials?.unitPrice || 0;
                const subtotal = item.financials?.subtotal || 0;

                let ref = '';
                if (item.specifications?.notes) {
                    ref = item.specifications.notes;
                } else if (item.itemId && typeof item.itemId === 'object' && (item.itemId as any).barcode) {
                    ref = (item.itemId as any).barcode;
                }

                const descText = (ref ? `#${ref} ` : '') + this.formatDescription(item);

                itemsBody.push([
                    { text: item.quantity.toString(), style: 'tableBody', alignment: 'center' },
                    { text: descText, style: 'tableBody' },
                    { text: `$${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, style: 'tableBody', alignment: 'right' },
                    { text: `$${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, style: 'tableBody', alignment: 'right' }
                ]);
            });

            // Tabla de pagos
            const paymentsBody: any[][] = [];
            if (this.financials.transactions && this.financials.transactions.length > 0) {
                paymentsBody.push([
                    { text: 'FECHA', style: 'tableHeader' },
                    { text: 'MÉTODO', style: 'tableHeader' },
                    { text: 'MONTO', style: 'tableHeader', alignment: 'right' }
                ]);
                this.financials.transactions.forEach((t: any) => {
                    paymentsBody.push([
                        { text: t.date || '', style: 'tableBody' },
                        { text: t.type || '', style: 'tableBody' },
                        { text: `$${typeof t.amount === 'number' ? t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : t.amount}`, style: 'tableBody', alignment: 'right' }
                    ]);
                });
            }
            
            // Footer Extra Links
            const footerLinks = [];
            if (printConfig?.facebook) footerLinks.push({ text: `FB: ${printConfig.facebook}`, alignment: 'center', style: 'footerLink' });
            if (printConfig?.instagram) footerLinks.push({ text: `IG: ${printConfig.instagram}`, alignment: 'center', style: 'footerLink' });
            
            const docDefinition: any = {
                pageSize: 'LETTER',
                pageMargins: [ 40, 60, 40, 60 ],
                content: [
                    // Header
                    {
                        columns: [
                            [
                                ...(base64Logo ? [{ image: base64Logo, width: 140, margin: [0, 0, 0, 10] as [number, number, number, number] }] : []),
                                { text: orgName.toUpperCase(), style: 'header' },
                                addressStr ? { text: addressStr, style: 'subheader' } : '',
                                phoneStr ? { text: `Tel: ${phoneStr}`, style: 'subheader' } : '',
                                printConfig?.headerText ? { text: printConfig.headerText, style: 'subheader', margin: [0, 5, 0, 0] } : ''
                            ],
                            [
                                { text: 'COMPROBANTE', style: 'invoiceTitle', alignment: 'right' },
                                { text: `Folio: ${this.note.id}`, style: 'invoiceSub', alignment: 'right' },
                                { text: `Fecha: ${this.note.dateCreated} ${this.note.time}`, style: 'invoiceSub', alignment: 'right' }
                            ]
                        ]
                    },
                    { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 530, y2: 5, lineWidth: 1, lineColor: '#dddddd' }], margin: [0, 10, 0, 10] },
                    // Client Info
                    {
                        columns: [
                            [
                                { text: 'CLIENTE:', style: 'label' },
                                { text: this.client.name, style: 'value' },
                                { text: this.client.phone && this.client.phone !== 'Sin teléfono' ? `Tel: ${this.client.phone}` : '', style: 'value' }
                            ],
                            [
                                { text: 'ATENDIÓ:', style: 'label', alignment: 'right' },
                                { text: this.note.agent, style: 'value', alignment: 'right' }
                            ]
                        ]
                    },
                    { text: '', margin: [0, 10, 0, 10] },
                    // Items Section
                    {
                        table: {
                            headerRows: 1,
                            widths: [ 'auto', '*', 'auto', 'auto' ],
                            body: itemsBody
                        },
                        layout: 'lightHorizontalLines'
                    },
                    // Totals
                    { text: '', margin: [0, 10, 0, 10] },
                    {
                        columns: [
                            { width: '*', text: '' },
                            {
                                width: 'auto',
                                table: {
                                    widths: [100, 80],
                                    body: [
                                        [ { text: 'SUBTOTAL:', style: 'totalsLabel' }, { text: `$${this.financials.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, style: 'totalsValue' } ],
                                        ...(this.financials.tax > 0 ? [[ { text: 'IMPUESTOS:', style: 'totalsLabel' }, { text: `$${this.financials.tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, style: 'totalsValue' } ]] : []),
                                        [ { text: 'TOTAL:', style: 'totalsLabel', bold: true }, { text: `$${this.financials.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, style: 'totalsValue', bold: true } ],
                                        [ { text: 'PAGADO:', style: 'totalsLabel' }, { text: `$${this.financials.paid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, style: 'totalsValue' } ],
                                        [ { text: 'PENDIENTE:', style: 'totalsLabel' }, { text: `$${this.financials.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, style: 'totalsValue' } ]
                                    ]
                                },
                                layout: 'noBorders'
                            }
                        ]
                    },
                    // Payments
                    ...(paymentsBody.length > 0 ? [
                        { text: 'PAGOS REALIZADOS', style: 'sectionTitle', margin: [0, 20, 0, 10] },
                        {
                            table: {
                                headerRows: 1,
                                widths: [ 'auto', '*', 'auto' ],
                                body: paymentsBody
                            },
                            layout: 'lightHorizontalLines'
                        }
                    ] : []),
                    // Footer
                    { text: '', margin: [0, 20, 0, 20] },
                    { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 530, y2: 5, lineWidth: 1, lineColor: '#dddddd' }], margin: [0, 0, 0, 10] },
                    { text: printConfig?.footerText || '¡Gracias por su compra!', alignment: 'center', style: 'footer' },
                    printConfig?.website ? { text: printConfig.website, alignment: 'center', style: 'footerLink' } : '',
                    ...(footerLinks.length > 0 ? [
                        {
                            columns: footerLinks
                        }
                    ] : [])
                ],
                styles: {
                    header: { fontSize: 18, bold: true, color: '#333333' },
                    subheader: { fontSize: 10, color: '#666666', margin: [0, 2, 0, 0] },
                    invoiceTitle: { fontSize: 18, bold: true, color: '#111111' },
                    invoiceSub: { fontSize: 10, color: '#444444', margin: [0, 2, 0, 0] },
                    label: { fontSize: 10, color: '#888888', bold: true },
                    value: { fontSize: 11, color: '#000000', margin: [0, 2, 0, 4] },
                    tableHeader: { fontSize: 10, bold: true, color: '#555555', margin: [0, 4, 0, 4] },
                    tableBody: { fontSize: 10, color: '#222222', margin: [0, 4, 0, 4] },
                    totalsLabel: { fontSize: 10, color: '#666666', alignment: 'right', margin: [0, 4, 0, 4] },
                    totalsValue: { fontSize: 11, color: '#111111', alignment: 'right', margin: [0, 4, 0, 4] },
                    sectionTitle: { fontSize: 12, bold: true, color: '#333333' },
                    footer: { fontSize: 10, color: '#555555', margin: [0, 4, 0, 4] },
                    footerLink: { fontSize: 9, color: '#888888', margin: [0, 2, 0, 2] }
                },
                defaultStyle: {
                    columnGap: 20
                }
            };

            const pdfDocGenerator = pdfMake.createPdf(docDefinition);
            pdfDocGenerator.getBase64().then((base64Data: string) => {
                this.noteService.sendEmailReceipt(this.rawNote!._id as string, this.client!.email as string, base64Data).subscribe({
                    next: (res) => {
                        this.toastService.success('El recibo ha sido enviado por correo exitosamente.');
                        this.isSendingEmail = false;
                    },
                    error: (err) => {
                        console.error(err);
                        this.toastService.error('Hubo un error al enviar el correo. Por favor intente más tarde.');
                        this.isSendingEmail = false;
                    }
                });
            }).catch((err) => {
                console.error('Error generating PDF base64:', err);
                this.toastService.error('Error al generar el documento PDF.');
                this.isSendingEmail = false;
            });

        } catch (error) {
            console.error('Error in PDF generation:', error);
            this.toastService.error('Error al generar el documento PDF.');
            this.isSendingEmail = false;
        }
    }
}
