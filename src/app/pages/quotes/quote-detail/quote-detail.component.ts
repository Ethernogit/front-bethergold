import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { QuoteService } from '../../../shared/services/quote.service';
import { DEFAULT_QUOTE_CLAUSE, QuotePdfService } from '../../../shared/services/quote-pdf.service';
import { ToastService } from '../../../shared/services/toast.service';
import { QuoteDetail, QuoteDetailItem } from '../../../shared/interfaces/quote.interfaces';

@Component({
    selector: 'app-quote-detail',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './quote-detail.component.html'
})
export class QuoteDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private quoteService = inject(QuoteService);
    private quotePdf = inject(QuotePdfService);
    private toastService = inject(ToastService);

    readonly clause = DEFAULT_QUOTE_CLAUSE;

    quote = signal<QuoteDetail | null>(null);
    loading = signal(true);
    notFound = signal(false);
    currentTab = signal<'general' | 'items'>('general');
    private logo: string | null = null;
    /** PDF ya generado para compartir; solo existe si el navegador puede compartir archivos */
    shareFile = signal<File | null>(null);

    showEmailModal = signal(false);
    isSendingEmail = signal(false);
    emailControl = new FormControl('', [Validators.required, Validators.email]);

    customerName = computed(() => this.quote()?.clientId?.name || this.quote()?.prospect?.name || '');
    customerEmail = computed(() => this.quote()?.clientId?.email || this.quote()?.prospect?.email || '');
    sellerName = computed(() => {
        const profile = this.quote()?.createdBy?.profile;
        return [profile?.firstName, profile?.lastName].filter(Boolean).join(' ');
    });
    /** Piezas que hoy ya no se pueden vender; solo importa mientras la cotización no está cerrada */
    unavailableItems = computed(() => {
        const quote = this.quote();
        if (!quote || quote.status !== 'VIGENTE') return [];
        return quote.items.filter(i => i.availability && !i.availability.available);
    });
    /** Partidas agrupadas como en el detalle de la nota */
    itemGroups = computed(() => {
        const items = this.quote()?.items || [];
        return {
            jewelry: items.filter(i => i.type === 'jewelry'),
            service: items.filter(i => i.type === 'service'),
            custom: items.filter(i => i.type === 'custom')
        };
    });
    /** Días que faltan para vencer (negativo si ya venció) */
    daysToExpire = computed(() => {
        const quote = this.quote();
        if (!quote) return 0;
        return Math.ceil((new Date(quote.validUntil).getTime() - Date.now()) / 86_400_000);
    });

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id') || '';
        this.quoteService.getQuote(id)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: async (res) => {
                    this.quote.set(res.data.quote);
                    this.logo = await this.quotePdf.loadLogo(res.data.quote);
                    this.prepareShareFile(res.data.quote);
                },
                error: () => this.notFound.set(true)
            });
    }

    /** Kilate, peso y entrega en una línea; la entrega se guarda como medianoche UTC */
    itemDetail(item: QuoteDetailItem): string {
        const specs = item.specifications;
        return [
            specs?.karatage,
            specs?.weight ? `${specs.weight}g` : '',
            specs?.deliveryDate
                ? `Entrega: ${new Date(specs.deliveryDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}`
                : ''
        ].filter(Boolean).join(' · ');
    }

    print() {
        const quote = this.quote();
        if (!quote) return;
        // La ventana se abre aquí, en el clic: si la abre pdfmake después, el navegador la bloquea
        const win = window.open('', '_blank');
        if (!win) {
            this.toastService.warning('El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para este sitio.', 5000);
            return;
        }
        this.quotePdf.print(quote, this.logo, win).catch(() => {
            win.close();
            this.toastService.error('Error al generar el documento PDF.');
        });
    }

    /**
     * El PDF se genera al cargar y no en el clic: el navegador (Safari sobre todo) solo deja
     * abrir el menú de compartir justo después del clic, y generar el PDF tarda.
     */
    private async prepareShareFile(quote: QuoteDetail) {
        if (!navigator.canShare) return;
        try {
            const file = await this.quotePdf.getFile(quote, this.logo);
            if (navigator.canShare({ files: [file] })) this.shareFile.set(file);
        } catch {
            // Sin archivo no se muestra el botón; quedan Descargar e Imprimir
        }
    }

    share() {
        const quote = this.quote();
        const file = this.shareFile();
        if (!quote || !file) return;
        navigator.share({ files: [file], title: `Cotización ${quote.folio}`, text: `Cotización ${quote.folio}` })
            .catch((err: DOMException) => {
                // AbortError = el usuario cerró el menú sin elegir
                if (err.name !== 'AbortError') this.toastService.error('No se pudo compartir. Usa Descargar y adjunta el archivo.', 5000);
            });
    }

    download() {
        const quote = this.quote();
        if (!quote) return;
        this.quotePdf.download(quote, this.logo)
            .catch(() => this.toastService.error('Error al generar el documento PDF.'));
    }

    openEmailModal() {
        this.emailControl.reset(this.customerEmail());
        this.showEmailModal.set(true);
    }

    async sendEmail() {
        const quote = this.quote();
        if (!quote || this.emailControl.invalid) {
            this.emailControl.markAsTouched();
            return;
        }

        this.isSendingEmail.set(true);
        try {
            const pdfBase64 = await this.quotePdf.getBase64(quote, this.logo);
            this.quoteService.sendQuoteEmail(quote._id, (this.emailControl.value || '').trim(), pdfBase64)
                .pipe(finalize(() => this.isSendingEmail.set(false)))
                .subscribe({
                    next: () => {
                        this.toastService.success(`Cotización ${quote.folio} enviada a ${this.emailControl.value}`);
                        this.showEmailModal.set(false);
                    },
                    error: (err: HttpErrorResponse) => {
                        const detail = err.error?.error?.details?.[0]?.msg;
                        this.toastService.error(detail || err.error?.error?.message || 'Error al enviar el correo', 5000);
                    }
                });
        } catch {
            this.isSendingEmail.set(false);
            this.toastService.error('Error al generar el documento PDF.');
        }
    }
}
