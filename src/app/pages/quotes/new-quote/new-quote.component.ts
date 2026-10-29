import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Observable, catchError, debounceTime, distinctUntilChanged, filter, finalize, map, of, switchMap } from 'rxjs';
import { QuoteService } from '../../../shared/services/quote.service';
import { ProductService, Product } from '../../../shared/services/product.service';
import { Client } from '../../../shared/services/client.service';
import { LoginService } from '../../../shared/services/auth/login.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CreateQuotePayload, QuoteItemSpecifications, QuoteItemType } from '../../../shared/interfaces/quote.interfaces';
// Los modales de captura son los mismos de la venta
import { HechuraModalComponent } from '../../sales/new-note/components/hechura-modal/hechura-modal.component';
import { RepairModalComponent } from '../../sales/new-note/components/repair-modal/repair-modal.component';
import { ClientSelectionModalComponent } from '../../sales/new-note/components/client-selection-modal/client-selection-modal.component';

interface HechuraResult {
    subcategory?: { name?: string };
    karatage: string;
    weight: number;
    description: string;
    deliveryDate: string;
    price: number;
    type: 'hechura' | 'express';
}

interface RepairResult {
    description: string;
    deliveryDate: string;
    amount: number;
}

@Component({
    selector: 'app-new-quote',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink, HechuraModalComponent, RepairModalComponent, ClientSelectionModalComponent],
    templateUrl: './new-quote.component.html'
})
export class NewQuoteComponent implements OnInit, OnDestroy {
    private fb = inject(FormBuilder);
    private quoteService = inject(QuoteService);
    private productService = inject(ProductService);
    private loginService = inject(LoginService);
    private toastService = inject(ToastService);
    private router = inject(Router);

    customerMode = signal<'client' | 'prospect'>('client');
    selectedClient = signal<Client | null>(null);
    searchResults = signal<Product[]>([]);
    isSearching = signal(false);
    isSaving = signal(false);
    showHechuraModal = signal(false);
    showRepairModal = signal(false);
    showClientModal = signal(false);

    searchControl = new FormControl('');

    private validUntilPicker: flatpickr.Instance | null = null;

    // Mismo selector de fecha que la venta; no deja elegir días pasados
    @ViewChild('validUntilInput') set validUntilInputRef(el: ElementRef<HTMLInputElement> | undefined) {
        if (el && !this.validUntilPicker) {
            this.validUntilPicker = flatpickr(el.nativeElement, {
                locale: Spanish,
                dateFormat: 'Y-m-d',
                altInput: true,
                altFormat: 'd/m/Y',
                minDate: 'today',
                disableMobile: true,
                onChange: (_, dateStr) => this.quoteForm.patchValue({ validUntil: dateStr })
            }) as flatpickr.Instance;
        }
    }

    quoteForm: FormGroup = this.fb.group({
        prospectName: ['', Validators.maxLength(120)],
        prospectEmail: ['', Validators.email],
        items: this.fb.array([]),
        globalDiscountPercent: [0, [Validators.min(0), Validators.max(100)]],
        validUntil: ['', Validators.required],
        notes: ['', Validators.maxLength(1000)]
    });

    get items(): FormArray {
        return this.quoteForm.get('items') as FormArray;
    }

    ngOnInit(): void {
        this.searchControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            filter(term => (term || '').length > 2),
            switchMap(term => {
                this.isSearching.set(true);
                return this.searchProducts(term || '').pipe(map(products => ({ term, products })));
            })
        ).subscribe(({ term, products }) => {
            this.isSearching.set(false);
            // Si la pieza ya se agregó con Enter, el buscador quedó vacío: no reabrir la lista
            if (this.searchControl.value === term) {
                this.searchResults.set(products);
            }
        });
    }

    private searchProducts(term: string): Observable<Product[]> {
        return this.productService.searchProductsByQR({ q: term }).pipe(
            map((res: { data?: Product[] }) => res.data || []),
            catchError(() => of([]))
        );
    }

    /**
     * Enter en el buscador (el lector de códigos lo manda): busca de inmediato y,
     * si el código o SKU coincide exacto, agrega la pieza. Si no, deja la lista para elegir.
     */
    onSearchEnter(event: Event) {
        event.preventDefault();
        const term = (this.searchControl.value || '').trim();
        if (!term) return;

        this.isSearching.set(true);
        this.searchProducts(term).subscribe(products => {
            this.isSearching.set(false);
            const exact = products.find(p => p.barcode === term || p.sku === term);
            if (exact) {
                this.selectProduct(exact);
            } else {
                this.searchResults.set(products);
                if (products.length === 0) {
                    this.toastService.warning(`No se encontró "${term}"`);
                }
            }
        });
    }

    // --- Cliente / prospecto ---

    setCustomerMode(mode: 'client' | 'prospect') {
        this.customerMode.set(mode);
    }

    handleClientSelection(client: Client) {
        this.selectedClient.set(client);
        this.showClientModal.set(false);
    }

    // --- Partidas ---

    selectProduct(product: Product) {
        if (product.status === 'inactive') {
            this.toastService.error('Este producto no está disponible.');
            return;
        }
        if (product.reservation) {
            this.toastService.error(`Este producto está apartado en la nota ${product.reservation.folio}.`);
            return;
        }
        const isUnique = product.isUnique !== false;
        if (isUnique && this.items.getRawValue().some(i => i.itemId === product._id)) {
            this.toastService.warning('Esta pieza ya está en la cotización.');
            return;
        }

        this.addItem('jewelry', product.name || product.description || 'Producto sin nombre', product.price || 0, {
            material: product.jewelryDetails?.goldType || '',
            karatage: product.jewelryDetails?.karatage || '',
            weight: product.specifications?.weight || 0,
            notes: product.barcode || product.sku || ''
        }, product._id, isUnique ? 1 : (product.stock || 1));

        this.searchControl.setValue('', { emitEvent: false });
        this.searchResults.set([]);
    }

    handleHechuraEntry(data: HechuraResult | null) {
        this.showHechuraModal.set(false);
        if (!data) return;

        const isExpress = data.type === 'express';
        const name = isExpress
            ? `Externo: ${data.description}`
            : `Hechura: ${data.subcategory?.name || 'Joya Personalizada'} - ${data.description}`;

        this.addItem('custom', name, data.price, {
            material: 'Oro',
            karatage: data.karatage,
            weight: data.weight,
            ...(isExpress ? {} : { deliveryDate: data.deliveryDate })
        });
    }

    handleRepairEntry(data: RepairResult | null) {
        this.showRepairModal.set(false);
        if (!data) return;

        this.addItem('service', `Taller: ${data.description}`, data.amount, { deliveryDate: data.deliveryDate });
    }

    private addItem(type: QuoteItemType, name: string, unitPrice: number, specifications: QuoteItemSpecifications,
        itemId?: string, maxQuantity = 1) {
        this.items.push(this.fb.group({
            itemId: [itemId],
            type: [type],
            name: [name, Validators.required],
            quantity: [1, [Validators.required, Validators.min(1), Validators.max(maxQuantity)]],
            maxQuantity: [maxQuantity],
            unitPrice: [unitPrice, [Validators.required, Validators.min(0)]],
            discount: [0, Validators.min(0)],
            specifications: [specifications]
        }));
    }

    removeItem(index: number) {
        this.items.removeAt(index);
    }

    // --- Totales (el back los recalcula; aquí solo se muestran) ---

    lineSubtotal(index: number): number {
        const { quantity, unitPrice, discount } = this.items.at(index).getRawValue();
        return (Number(quantity) || 0) * (Number(unitPrice) || 0) - (Number(discount) || 0);
    }

    subtotal(): number {
        return this.items.controls.reduce((sum, _, i) => sum + this.lineSubtotal(i), 0);
    }

    discountPercent(): number {
        return Number(this.quoteForm.get('globalDiscountPercent')?.value) || 0;
    }

    /** Mismo redondeo que el back */
    globalDiscountAmount(): number {
        return Math.round(this.subtotal() * this.discountPercent()) / 100;
    }

    total(): number {
        return this.subtotal() - this.globalDiscountAmount();
    }

    // --- Guardar ---

    onSubmit() {
        const sucursal = this.loginService.currentSucursal();
        const form = this.quoteForm.getRawValue();
        const prospectName = (form.prospectName || '').trim();

        if (this.customerMode() === 'client' && !this.selectedClient()) {
            this.toastService.error('Selecciona un cliente o cambia a prospecto.');
            return;
        }
        if (this.customerMode() === 'prospect' && !prospectName) {
            this.toastService.error('Escribe el nombre del prospecto.');
            return;
        }
        if (this.items.length === 0) {
            this.toastService.error('Agrega al menos una partida.');
            return;
        }
        if (!form.validUntil) {
            this.toastService.error('Elige la fecha de vencimiento.');
            return;
        }
        if (this.quoteForm.invalid || this.items.controls.some((_, i) => this.lineSubtotal(i) < 0) || this.total() < 0) {
            this.quoteForm.markAllAsTouched();
            this.toastService.error('Revisa cantidades, precios y descuentos.');
            return;
        }
        if (!sucursal?._id) {
            this.toastService.error('Sesión inválida. Recargue la página.');
            return;
        }

        const payload: CreateQuotePayload = {
            sucursalId: sucursal._id,
            ...(this.customerMode() === 'client'
                ? { clientId: this.selectedClient()?._id }
                : { prospect: { name: prospectName, ...(form.prospectEmail ? { email: form.prospectEmail.trim() } : {}) } }),
            items: form.items.map((item: { itemId?: string; type: QuoteItemType; name: string; quantity: number; unitPrice: number; discount: number; specifications: QuoteItemSpecifications }) => ({
                ...(item.itemId ? { itemId: item.itemId } : {}),
                type: item.type,
                name: item.name,
                quantity: Number(item.quantity),
                financials: { unitPrice: Number(item.unitPrice), discount: Number(item.discount) || 0 },
                specifications: item.specifications
            })),
            globalDiscountPercent: this.discountPercent(),
            // Vence al final del día elegido, en hora local
            validUntil: new Date(`${form.validUntil}T23:59:59.999`).toISOString(),
            ...(form.notes?.trim() ? { notes: form.notes.trim() } : {})
        };

        this.isSaving.set(true);
        this.quoteService.createQuote(payload)
            .pipe(finalize(() => this.isSaving.set(false)))
            .subscribe({
                next: (res) => {
                    this.toastService.success(`Cotización ${res.data.quote.folio} creada`);
                    this.router.navigate(['/quotes']);
                },
                error: (err: HttpErrorResponse) => {
                    const detail = err.error?.error?.details?.[0]?.msg;
                    this.toastService.error(detail || err.error?.error?.message || 'Error al crear la cotización', 5000);
                }
            });
    }

    ngOnDestroy(): void {
        this.validUntilPicker?.destroy();
    }
}
