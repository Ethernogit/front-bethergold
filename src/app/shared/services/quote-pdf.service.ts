import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces';
import { environment } from '../../../environments/environment';
import { QuoteDetail, QuoteDetailItem } from '../interfaces/quote.interfaces';

pdfMake.addVirtualFileSystem(pdfFonts);

/** Texto por defecto; queda pendiente hacerlo editable por sucursal */
export const DEFAULT_QUOTE_CLAUSE =
    'Precio sujeto a cambio pasada la fecha de vigencia. Las piezas de inventario están sujetas a existencia disponible al momento de la compra.';

const ITEM_TYPE_LABEL: Record<QuoteDetailItem['type'], string> = {
    jewelry: 'Pieza',
    custom: 'Hechura / Pedido',
    service: 'Taller'
};

const money = (n: number) => `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const localDate = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
// La fecha de entrega se guarda como medianoche UTC: en hora local saldría un día antes
const utcDate = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });

/**
 * Documento de cotización tamaño carta. Lo usan imprimir y enviar por correo,
 * para que el cliente reciba lo mismo que se imprime.
 */
@Injectable({
    providedIn: 'root'
})
export class QuotePdfService {

    /** pdfmake no descarga imágenes: el logo de la sucursal se pasa en base64 */
    async loadLogo(quote: QuoteDetail): Promise<string | null> {
        const logoUrl = quote.sucursalId?.printConfig?.logoUrl;
        if (!logoUrl) return null;
        try {
            const response = await fetch(environment.apiUrl.replace('/api/v1', '') + logoUrl);
            const blob = await response.blob();
            return await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch {
            return null;
        }
    }

    /** `win` se abre en el clic: si la abre pdfmake después de generar, el navegador la bloquea */
    print(quote: QuoteDetail, logo: string | null, win: Window): Promise<void> {
        return pdfMake.createPdf(this.buildDocument(quote, logo)).print(win);
    }

    /** Para mandarlo por WhatsApp u otro medio fuera del sistema */
    download(quote: QuoteDetail, logo: string | null): Promise<void> {
        return pdfMake.createPdf(this.buildDocument(quote, logo)).download(this.fileName(quote));
    }

    /** Archivo listo para el menú de compartir del teléfono (Web Share API) */
    async getFile(quote: QuoteDetail, logo: string | null): Promise<File> {
        const blob = await pdfMake.createPdf(this.buildDocument(quote, logo)).getBlob();
        return new File([blob], this.fileName(quote), { type: 'application/pdf' });
    }

    private fileName(quote: QuoteDetail): string {
        return `Cotizacion-${quote.folio}.pdf`;
    }

    getBase64(quote: QuoteDetail, logo: string | null): Promise<string> {
        return pdfMake.createPdf(this.buildDocument(quote, logo)).getBase64();
    }

    private buildDocument(quote: QuoteDetail, logo: string | null): TDocumentDefinitions {
        const sucursal = quote.sucursalId;
        const printConfig = sucursal?.printConfig;
        const showAddress = printConfig?.showAddress ?? true;
        const showPhone = printConfig?.showPhone ?? true;

        const address = sucursal?.address;
        const addressStr = showAddress && address
            ? [address.street?.trim(), address.city, address.state, address.zipCode ? `C.P. ${address.zipCode}` : '']
                .filter(Boolean).join(', ')
            : '';
        const phoneStr = showPhone && sucursal?.phone ? `Tel: ${sucursal.phone}` : '';

        const customerName = quote.clientId?.name || quote.prospect?.name || '';
        const customerContact = [quote.clientId?.phone, quote.clientId?.email || quote.prospect?.email].filter(Boolean).join('  ·  ');
        const seller = [quote.createdBy?.profile?.firstName, quote.createdBy?.profile?.lastName].filter(Boolean).join(' ');

        const itemsBody: TableCell[][] = [[
            { text: 'CANT.', style: 'tableHeader' },
            { text: 'DESCRIPCIÓN', style: 'tableHeader' },
            { text: 'P.U.', style: 'tableHeader', alignment: 'right' },
            { text: 'DESC.', style: 'tableHeader', alignment: 'right' },
            { text: 'IMPORTE', style: 'tableHeader', alignment: 'right' }
        ]];
        quote.items.forEach(item => {
            const specs = item.specifications;
            const detail = [
                ITEM_TYPE_LABEL[item.type],
                specs?.notes ? `#${specs.notes}` : '',
                specs?.karatage,
                specs?.weight ? `${specs.weight}g` : '',
                specs?.deliveryDate ? `Entrega: ${utcDate(specs.deliveryDate)}` : ''
            ].filter(Boolean).join(' - ');

            itemsBody.push([
                { text: String(item.quantity), style: 'tableBody', alignment: 'center' },
                { stack: [{ text: item.name, bold: true }, { text: detail, style: 'itemDetail' }], style: 'tableBody' },
                { text: money(item.financials.unitPrice), style: 'tableBody', alignment: 'right' },
                { text: item.financials.discount ? `-${money(item.financials.discount)}` : '', style: 'tableBody', alignment: 'right' },
                { text: money(item.financials.subtotal), style: 'tableBody', alignment: 'right' }
            ]);
        });

        const percent = quote.financials.globalDiscountPercent;
        const totalsBody: TableCell[][] = [
            [{ text: 'SUBTOTAL:', style: 'totalsLabel' }, { text: money(quote.financials.subtotal), style: 'totalsValue' }]
        ];
        if (quote.financials.globalDiscount > 0) {
            totalsBody.push([
                { text: percent ? `DESCUENTO (${percent}%):` : 'DESCUENTO:', style: 'totalsLabel' },
                { text: `-${money(quote.financials.globalDiscount)}`, style: 'totalsValue' }
            ]);
        }
        totalsBody.push([
            { text: 'TOTAL:', style: 'totalsLabel', bold: true },
            { text: money(quote.financials.total), style: 'totalsValue', bold: true }
        ]);

        const socialLinks: Content[] = [];
        if (printConfig?.website) socialLinks.push({ text: printConfig.website, style: 'footerLink' });
        if (printConfig?.facebook) socialLinks.push({ text: `FB: ${printConfig.facebook}`, style: 'footerLink' });
        if (printConfig?.instagram) socialLinks.push({ text: `IG: ${printConfig.instagram}`, style: 'footerLink' });

        // Función, no constante: pdfmake modifica cada nodo al dibujarlo y no se puede reusar
        const separator = (): Content => ({ canvas: [{ type: 'line', x1: 0, y1: 5, x2: 530, y2: 5, lineWidth: 1, lineColor: '#dddddd' }], margin: [0, 10, 0, 10] });

        return {
            pageSize: 'LETTER',
            pageMargins: [40, 50, 40, 50],
            info: { title: `Cotización ${quote.folio}` },
            content: [
                {
                    columns: [
                        [
                            // fit: el logo puede ser cuadrado o horizontal; que no pase de 60 de alto
                            ...(logo ? [{ image: logo, fit: [160, 60], margin: [0, 0, 0, 10] } as Content] : []),
                            { text: (sucursal?.name || 'Joyería').toUpperCase(), style: 'header' },
                            ...(addressStr ? [{ text: addressStr, style: 'subheader' }] : []),
                            ...(phoneStr ? [{ text: phoneStr, style: 'subheader' }] : []),
                            ...(printConfig?.headerText ? [{ text: printConfig.headerText, style: 'subheader', margin: [0, 5, 0, 0] } as Content] : [])
                        ],
                        [
                            { text: 'COTIZACIÓN', style: 'docTitle', alignment: 'right' },
                            { text: `Folio: ${quote.folio}`, style: 'docSub', alignment: 'right' },
                            { text: `Fecha: ${localDate(quote.createdAt)}`, style: 'docSub', alignment: 'right' },
                            { text: `Vigente hasta: ${localDate(quote.validUntil)}`, style: 'docSub', alignment: 'right', bold: true }
                        ]
                    ]
                },
                separator(),
                {
                    columns: [
                        [
                            { text: quote.clientId ? 'CLIENTE:' : 'PARA:', style: 'label' },
                            { text: customerName, style: 'value' },
                            ...(customerContact ? [{ text: customerContact, style: 'subheader' }] : [])
                        ],
                        [
                            { text: 'ATENDIÓ:', style: 'label', alignment: 'right' },
                            { text: seller, style: 'value', alignment: 'right' }
                        ]
                    ]
                },
                { text: '', margin: [0, 8, 0, 8] },
                {
                    table: { headerRows: 1, widths: ['auto', '*', 'auto', 'auto', 'auto'], body: itemsBody },
                    layout: 'lightHorizontalLines'
                },
                { text: '', margin: [0, 8, 0, 8] },
                {
                    columns: [
                        { width: '*', text: '' },
                        { width: 'auto', table: { widths: [120, 90], body: totalsBody }, layout: 'noBorders' }
                    ]
                },
                ...(quote.notes ? [
                    { text: 'OBSERVACIONES', style: 'label', margin: [0, 16, 0, 4] } as Content,
                    { text: quote.notes, style: 'value' }
                ] : []),
                separator(),
                { text: DEFAULT_QUOTE_CLAUSE, style: 'clause' },
                ...(socialLinks.length ? [{ columns: socialLinks, margin: [0, 12, 0, 0] } as Content] : [])
            ],
            styles: {
                header: { fontSize: 18, bold: true, color: '#333333' },
                subheader: { fontSize: 10, color: '#666666', margin: [0, 2, 0, 0] },
                docTitle: { fontSize: 18, bold: true, color: '#111111' },
                docSub: { fontSize: 10, color: '#444444', margin: [0, 2, 0, 0] },
                label: { fontSize: 10, color: '#888888', bold: true },
                value: { fontSize: 11, color: '#000000', margin: [0, 2, 0, 4] },
                tableHeader: { fontSize: 10, bold: true, color: '#555555', margin: [0, 4, 0, 4] },
                tableBody: { fontSize: 10, color: '#222222', margin: [0, 4, 0, 4] },
                itemDetail: { fontSize: 9, color: '#666666' },
                totalsLabel: { fontSize: 10, color: '#666666', alignment: 'right', margin: [0, 4, 0, 4] },
                totalsValue: { fontSize: 11, color: '#111111', alignment: 'right', margin: [0, 4, 0, 4] },
                clause: { fontSize: 9, italics: true, color: '#555555', alignment: 'center' },
                footerLink: { fontSize: 9, color: '#888888', alignment: 'center' }
            },
            defaultStyle: { columnGap: 20 }
        };
    }
}
