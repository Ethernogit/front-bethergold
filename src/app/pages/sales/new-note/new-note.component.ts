import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es';
import 'flatpickr/dist/flatpickr.css';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { NoteService, Note, NoteItem } from '../../../shared/services/note.service';
import { ClientService } from '../../../shared/services/client.service';
import { ProductService, Product } from '../../../shared/services/product.service';
import { LoginService } from '../../../shared/services/auth/login.service';
import { ToastService } from '../../../shared/services/toast.service';
import { SucursalService } from '../../../shared/services/sucursal.service';
import { CashCutService } from '../../../shared/services/cash-cut.service';
import { PricingRuleService, PricingRule } from '../../../shared/services/pricing-rule.service';
import { PermissionService } from '../../../shared/services/auth/permission.service';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, catchError, filter } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

import { RouterModule } from '@angular/router';
import { ManualMovementModalComponent } from './components/manual-movement-modal/manual-movement-modal.component';
import { RepairModalComponent } from './components/repair-modal/repair-modal.component';
import { HechuraModalComponent } from './components/hechura-modal/hechura-modal.component';

// Imports for UI components (assuming they exist or will be used directly)
// import { ClientSelectorComponent } from ...

import { ClientSelectionModalComponent } from './components/client-selection-modal/client-selection-modal.component';

@Component({
    selector: 'app-new-note',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, ManualMovementModalComponent, RepairModalComponent, ClientSelectionModalComponent, HechuraModalComponent],
    templateUrl: './new-note.component.html'
})
export class NewNoteComponent implements OnInit, OnDestroy {
    noteForm: FormGroup;
    searchControl = new FormControl('');
    isLoading = false;

    // Lists
    clients: any[] = [];
    searchResults: Product[] = [];
    isSearching = false;

    // Pricing Rules Engine
    activeRules: PricingRule[] = [];

    // UX State
    showPaymentModal = false;
    showManualEntryModal = false;
    showHechuraModal = false;
    showRepairModal = false;
    showClientModal = false;
    selectedClient: any = null;
    currentDate = new Date();
    noteDate: string = this.toDateInputValue(new Date());
    noteDateDisplay: string = this.formatDateDisplay(new Date());
    nextFolio = '---';

    private fpInstance: flatpickr.Instance | null = null;

    // Custom folio
    customFolio = '';
    folioStatus: 'idle' | 'checking' | 'available' | 'taken' = 'idle';
    private folioInput$ = new Subject<string>();

    @ViewChild('noteDateBtn') set noteDateBtnRef(el: ElementRef<HTMLElement>) {
        if (el && !this.fpInstance) {
            this.fpInstance = flatpickr(el.nativeElement, {
                locale: Spanish,
                dateFormat: 'Y-m-d',
                defaultDate: this.noteDate,
                maxDate: 'today',
                disableMobile: true,
                onChange: (_, dateStr) => {
                    this.noteDate = dateStr;
                    this.noteDateDisplay = this.formatDateDisplay(new Date(dateStr + 'T12:00:00'));
                }
            }) as flatpickr.Instance;
        }
    }
    paymentMethod: 'cash' | 'card' | 'points' = 'cash';
    saleType: 'sale' | 'consignment' = 'sale';

    constructor(
        private fb: FormBuilder,
        private noteService: NoteService,
        private clientService: ClientService,
        private productService: ProductService,
        private loginService: LoginService,
        private toastService: ToastService,
        private sucursalService: SucursalService,
        private cashCutService: CashCutService,
        private pricingRuleService: PricingRuleService,
        readonly permissionService: PermissionService,
        private router: Router
    ) {
        this.noteForm = this.fb.group({
            clientId: ['', Validators.required],
            items: this.fb.array([], [Validators.minLength(1)]),
            subtotal: [{ value: 0, disabled: true }],
            discount: [0],
            total: [{ value: 0, disabled: true }],
            receivedAmount: [0], // New for UI
            changeAmount: [{ value: 0, disabled: true }], // New for UI
            cashAmount: [0],
            cardAmount: [0],
            transferAmount: [0],
            pointsAmount: [0],
            reference: ['']
        });
    }

    ngOnInit(): void {
        this.checkOpenShift();
        this.setupSearch();
        this.loadNextFolio();
        this.loadDefaultClient();
        this.loadPricingRules();
        this.setupFolioCheck();
    }

    loadPricingRules() {
        this.pricingRuleService.getPricingRules({ active: true }).subscribe({
            next: (res: any) => {
                this.activeRules = res.data || [];
            },
            error: (err) => console.error('Error loading pricing rules', err)
        });
    }

    checkOpenShift() {
        const sucursal = this.loginService.currentSucursal();
        if (!sucursal?._id) return;

        this.cashCutService.getCurrentShift(sucursal._id).subscribe({
            next: (res) => {
                // Shift is open, proceed
                console.log('Caja abierta:', res);
            },
            error: (err) => {
                // If 404 or error, assume closed.
                console.warn('No active shift', err);

                // Use a simple confirm or just redirect/toast
                // Ideally prompt user to open caja.

                // Simplest block:
                this.toastService.warning('No hay caja abierta. Debe abrir caja para realizar ventas.');

                // Disable form or redirect? 
                // Let's redirect to open caja if they want, or just block submission.
                // Redirecting might be invasive if they just want to look, but for "New Note" it implies action.
                // Let's disable the inputs and show a big message or just redirect after a delay.

                // For now, let's just show the toast and disable the form heavily or redirect.
                this.router.navigate(['/sales/cash-cut']);
            }
        });
    }

    loadNextFolio() {
        const sucursal = this.loginService.currentSucursal();
        if (sucursal?._id) {
            this.sucursalService.getNextFolio(sucursal._id).subscribe({
                next: (folio) => this.nextFolio = folio,
                error: (err) => console.error('Error fetching folio', err)
            });
        }
    }

    loadDefaultClient() {
        this.clientService.getClients({ q: 'Publico General' }).subscribe({
            next: (res: any) => {
                const clients = res.data?.clients || (Array.isArray(res.data) ? res.data : []);
                if (clients.length > 0) {
                    // Try to find exact match or take first
                    const defaultClient = clients.find((c: any) =>
                        c.name.toLowerCase().includes('publico') && c.name.toLowerCase().includes('general')
                    ) || clients[0];

                    if (defaultClient) {
                        this.handleClientSelection(defaultClient);
                    }
                }
            },
            error: (err) => console.error('Error loading default client', err)
        });
    }

    private toDateInputValue(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    private formatDateDisplay(date: Date): string {
        return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    ngOnDestroy() {
        if (this.fpInstance) {
            this.fpInstance.destroy();
            this.fpInstance = null;
        }
    }

    setPaymentMethod(method: 'cash' | 'card' | 'points') {
        this.paymentMethod = method;
        this.calculateTotals();
    }

    toggleSaleType() {
        this.saleType = this.saleType === 'sale' ? 'consignment' : 'sale';
        if (this.saleType === 'consignment' && !this.isWholesaleClient) {
            this.toastService.warning('Recuerde que las ventas de mayoreo son solo para clientes de Mayoreo.');
        }
        this.recalculateAllPrices();
    }

    openClientModal() {
        this.showClientModal = true;
    }

    handleClientSelection(client: any) {
        this.showClientModal = false;
        if (client) {
            this.selectedClient = client;
            this.noteForm.patchValue({ clientId: client._id });
            this.recalculateAllPrices(); // Re-calculate prices if client type changed
        }
    }

    get isWholesaleClient(): boolean {
        return this.selectedClient?.type === 'MAYOREO' || this.selectedClient?.type === 'MAYORISTA';
    }

    setupFolioCheck() {
        this.folioInput$.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            switchMap(value => {
                const trimmed = value.trim();
                if (!trimmed) {
                    this.folioStatus = 'idle';
                    return of(null);
                }
                this.folioStatus = 'checking';
                return this.noteService.checkFolioAvailability(trimmed).pipe(
                    catchError(() => of(null))
                );
            })
        ).subscribe(res => {
            if (!res) { this.folioStatus = 'idle'; return; }
            this.folioStatus = res.available ? 'available' : 'taken';
        });
    }

    onFolioInput(value: string) {
        this.customFolio = value.toUpperCase();
        this.folioInput$.next(this.customFolio);
    }

    setupSearch() {
        this.searchControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            filter(term => (term || '').length > 2),
            switchMap(term => {
                this.isSearching = true;
                return this.productService.searchProductsByQR({ q: term || '' }).pipe(
                    catchError(err => {
                        console.error(err);
                        return of({ data: [] });
                    })
                );
            })
        ).subscribe((res: any) => {
            this.isSearching = false;
            this.searchResults = res.data || [];
        });
    }

    get items(): FormArray {
        return this.noteForm.get('items') as FormArray;
    }

    loadClients() {
        this.clientService.getClients().subscribe({
            next: (res: any) => {
                if (Array.isArray(res)) {
                    this.clients = res;
                } else if (res && Array.isArray(res.data)) {
                    this.clients = res.data;
                } else {
                    console.error('Expected array of clients, got:', res);
                    this.clients = [];
                }
            },
            error: (err) => console.error('Error loading clients', err)
        });
    }

    getCategoryName(product: Product): string {
        if (!product.category) return 'N/A';
        if (typeof product.category === 'string') {
            return product.category;
        }
        return product.category.name || 'N/A';
    }

    // --- Pricing Engine Core ---

    calculatePriceForProduct(product: Product): { price: number, ruleApplied?: boolean, ruleName?: string, originalPrice?: number } {
        // Base case: Not wholesale or no rules active
        if (!this.isWholesaleClient || this.activeRules.length === 0) {
            return { price: product.price || 0, originalPrice: product.price };
        }

        const categoryId = typeof product.category === 'string' ? product.category : product.category?._id;
        const subcategoryId = typeof product.subcategory === 'string' ? product.subcategory : product.subcategory?._id;
        const material = product.jewelryDetails?.goldType || '';
        const weight = product.specifications?.weight || 0;

        // Find applicable rule. Priority logic: Specific Subcategory > Category > Material
        // For simplicity, we just find the first matching rule, assuming backend sorts by priority or we just take the first.
        const rule = this.activeRules.find(r => {
            if (r.criteriaType === 'CATEGORY' && categoryId) {
                return (r.criteriaValue === categoryId);
            }
            if (r.criteriaType === 'MATERIAL' && material) {
                return (r.criteriaValue.toLowerCase() === material.toLowerCase());
            }
            return false;
        });

        if (rule) {
            let finalPrice = product.price || 0;

            if (rule.ruleType === 'PRICE_PER_GRAM' && weight > 0) {
                finalPrice = rule.ruleValue * weight;
            } else if (rule.ruleType === 'FIXED_PRICE') {
                finalPrice = rule.ruleValue;
            } else if (rule.ruleType === 'DISCOUNT_PERCENTAGE') {
                finalPrice = finalPrice * (1 - (rule.ruleValue / 100));
            }

            return {
                price: parseFloat(finalPrice.toFixed(2)),
                ruleApplied: true,
                ruleName: rule.name,
                originalPrice: product.price
            };
        }

        return { price: product.price || 0, originalPrice: product.price };
    }

    recalculateAllPrices() {
        const items = this.items.controls;
        let showToast = false;

        items.forEach((itemCtrl: any) => {
            const rawProduct = itemCtrl.get('rawProduct')?.value;
            if (rawProduct && itemCtrl.get('type')?.value === 'jewelry' && !itemCtrl.get('manuallyEdited')?.value) {
                const { price, ruleApplied, originalPrice } = this.calculatePriceForProduct(rawProduct);

                // Only override if the user hasn't manually overridden it heavily, or if they just switched client types.
                // For safety, we always override to the rule price and let the user re-override if needed.
                itemCtrl.patchValue({
                    unitPrice: price,
                    originalPrice: originalPrice,
                    ruleApplied: ruleApplied
                });

                if (ruleApplied) showToast = true;
            }
        });

        if (showToast) {
            this.toastService.success('Precios de Mayoreo Aplicados');
        }

        this.calculateTotals();
    }


    // --- Item Management ---

    selectProduct(product: Product) {
        if ((product as any).status === 'inactive') {
            this.toastService.error('Este producto no está disponible para venta.');
            return;
        }
        if ((product as any).reservation) {
            this.toastService.error('Este producto ya está apartado en otra nota.');
            return;
        }

        const type = 'jewelry';

        const isUnique = product.isUnique !== false; // Default to true if undefined
        const maxStock = isUnique ? 1 : (product.stock || 0);

        // Pass to Pricing Engine
        const { price, ruleApplied, ruleName, originalPrice } = this.calculatePriceForProduct(product);

        const itemGroup = this.fb.group({
            itemId: [product._id],
            itemModel: ['Product'],
            type: [type],
            name: [product.name || product.description || 'Producto sin nombre', Validators.required],
            deliveryStatus: [this.saleType === 'consignment' ? 'pending' : 'immediate'], // Consignments are pending by default (they owe it)
            // If unique, lock to 1. If bulk, allow 1 to maxStock
            quantity: [1, [Validators.required, Validators.min(0.01), ...(isUnique ? [Validators.max(1)] : [Validators.max(maxStock)])]],
            unitPrice: [price, [Validators.required, Validators.min(0)]],
            originalPrice: [originalPrice],
            ruleApplied: [ruleApplied],
            manuallyEdited: [false],
            discount: [0, [Validators.min(0)]],
            subtotal: [price],
            isUnique: [isUnique], // For UI condition
            maxStock: [maxStock], // For UI validation msg
            rawProduct: [product], // Store to recalculate later
            specifications: this.fb.group({
                material: [product.jewelryDetails?.goldType || ''],
                size: [''],
                weight: [product.specifications?.weight || 0],
                karatage: [product.jewelryDetails?.karatage || ''],
                notes: [product.barcode || product.sku || '']
            })
        });

        this.subscribeToItemChanges(itemGroup);
        this.items.push(itemGroup);

        // Clear search
        this.searchControl.setValue('', { emitEvent: false });
        this.searchResults = [];
        this.calculateTotals();

        if (ruleApplied) {
            this.toastService.success(`Producto agregado (Regla Aplicada: ${ruleName})`);
        } else {
            this.toastService.success('Producto agregado');
        }
    }

    openManualEntryModal() {
        this.showManualEntryModal = true;
    }

    openHechuraModal() {
        this.showHechuraModal = true;
    }

    openRepairModal() {
        this.showRepairModal = true;
    }

    handleManualEntry(data: any) {
        this.showManualEntryModal = false;
        if (!data) return;

        const { description, amount, movementType } = data;

        const itemGroup = this.fb.group({
            itemId: [null],
            itemModel: ['Custom'],
            type: ['custom'],
            name: [description, Validators.required],
            deliveryStatus: ['immediate'],
            quantity: [1, [Validators.required, Validators.min(0.01)]],
            unitPrice: [amount, [Validators.required, Validators.min(0)]],
            manuallyEdited: [false],
            discount: [0, [Validators.min(0)]],
            subtotal: [amount],
            specifications: this.fb.group({
                material: [''],
                size: [''],
                weight: [''],
                karatage: [''],
                notes: [`Tipo: ${movementType.name}`],
                deliveryDate: [null]
            })
        });

        this.subscribeToItemChanges(itemGroup);
        this.items.push(itemGroup);
        this.calculateTotals();
        this.toastService.success('Movimiento agregado');
    }

    handleHechuraEntry(data: any) {
        this.showHechuraModal = false;
        if (!data) return;

        const { subcategory, karatage, weight, description, deliveryDate, price, type } = data;
        const isExpress = type === 'express';

        const timestamp = Date.now().toString().slice(-6);
        const prefix = isExpress ? 'EXT' : 'HECH';
        const barcode = `${prefix}-${timestamp}`;

        const itemGroup = this.fb.group({
            itemId: [null],
            itemModel: ['Custom'], // Both are Custom model (no inventory)
            type: [isExpress ? 'jewelry' : 'custom'], // Express looks like a product (jewelry), Hechura is custom
            name: [isExpress ? `Externo: ${description}` : `Hechura: ${subcategory?.name || 'Joya Personalizada'} - ${description}`, Validators.required],
            deliveryStatus: [isExpress ? 'immediate' : 'pending'], // Express is immediate
            quantity: [1, [Validators.required, Validators.min(0.01)]],
            unitPrice: [price, [Validators.required, Validators.min(0)]],
            manuallyEdited: [false],
            discount: [0, [Validators.min(0)]],
            subtotal: [price],
            specifications: this.fb.group({
                material: ['Oro'],
                karatage: [karatage],
                weight: [weight],
                size: [''],
                notes: [barcode],
                deliveryDate: [isExpress ? null : deliveryDate]
            })
        });

        this.subscribeToItemChanges(itemGroup);
        this.items.push(itemGroup);
        this.calculateTotals();

        if (isExpress) {
            this.toastService.success(`Ítem Express agregado (${barcode})`);
        } else {
            this.toastService.success(`Hechura agregada (${barcode})`);
        }
    }

    handleRepairEntry(data: any) {
        this.showRepairModal = false;
        if (!data) return;

        const { description, deliveryDate, amount } = data;

        const itemGroup = this.fb.group({
            itemId: [null],
            itemModel: ['Service'],
            type: ['service'], // Taller = Service
            name: [`Taller: ${description}`, Validators.required],
            deliveryStatus: ['pending'], // Taller usually starts as pending/in-process, but user can change if paying full? Actually taller is service. Let's keep it consistent or simple. If it's a repair, they don't take it immediately usually, but they might pay in full. Let's stick to 'immediate' meaning "Fully Paid/active" vs 'pending' layaway. Actually for Repair, "Apartado" makes less sense, but "Pending Delivery" does. Let's default to immediate (paid) or pending (owed).
            // User request is about "Product Apartado". Let's stick to deliveryStatus for all for uniformity.
            // But wait, Repair logic might be different. Let's leave it as immediate for now.
            quantity: [1, [Validators.required, Validators.min(0.01)]],
            unitPrice: [amount, [Validators.required, Validators.min(0)]],
            manuallyEdited: [false],
            discount: [0],
            subtotal: [amount],
            specifications: this.fb.group({
                material: [''],
                size: [''],
                weight: [''],
                karatage: [''],
                notes: [`Entrega: ${deliveryDate}`]
            })
        });

        this.subscribeToItemChanges(itemGroup);
        this.items.push(itemGroup);
        this.calculateTotals();
        this.toastService.success('Taller agregado');
    }

    addItem(type: 'jewelry' | 'service' | 'custom' | 'external' = 'jewelry') {
        if (type === 'service') {
            this.openRepairModal();
            return;
        }

        if (type === 'custom') {
            this.openHechuraModal();
            return;
        }

        const itemGroup = this.fb.group({
            itemId: [null],
            itemModel: ['Single'],
            type: [type],
            name: ['', Validators.required],
            deliveryStatus: [this.saleType === 'consignment' ? 'pending' : 'immediate'],
            quantity: [1, [Validators.required, Validators.min(0.01)]],
            unitPrice: [0, [Validators.required, Validators.min(0)]],
            manuallyEdited: [false],
            discount: [0, [Validators.min(0)]],
            subtotal: [0],
            specifications: this.fb.group({
                material: [''],
                size: [''],
                weight: [''],
                karatage: [''],
                notes: ['']
            })
        });

        this.subscribeToItemChanges(itemGroup);
        this.items.push(itemGroup);
        this.calculateTotals();
    }

    markAsManuallyEdited(index: number) {
        const item = this.items.at(index);
        item.patchValue({ manuallyEdited: true }, { emitEvent: false });
    }

    subscribeToItemChanges(group: FormGroup) {
        group.valueChanges.subscribe(val => {
            const qty = val.quantity || 0;
            const price = val.unitPrice || 0;
            const discount = val.discount || 0 || 0;
            const sub = (qty * price) - discount;
            group.patchValue({ subtotal: sub > 0 ? sub : 0 }, { emitEvent: false });
            this.calculateTotals();
        });
    }

    removeItem(index: number) {
        this.items.removeAt(index);
        this.calculateTotals();
    }

    cleanCart() {
        while (this.items.length !== 0) {
            this.items.removeAt(0);
        }
        this.calculateTotals();
    }

    // --- Delivery Status Logic ---

    toggleDeliveryStatus(index: number) {
        const item = this.items.at(index);
        const current = item.get('deliveryStatus')?.value;
        const newStatus = current === 'immediate' ? 'pending' : 'immediate';
        item.patchValue({ deliveryStatus: newStatus });

        // Recalculate or re-validate if needed (e.g. min payment check depends on this)
        // We might want to trigger a check here. Use calculateTotals as a proxy to refresh UI/Getters if they depend on form values.
        // Actually getters usually pull fresh value. But let's safe trigger.
        this.calculateTotals();
    }

    get minRequiredPayment(): number {
        // Consignments require 0 payment upfront
        if (this.saleType === 'consignment') return 0;

        // Sum of all items marked as 'immediate' (must be fully paid)
        // Items marked as 'pending' (apartado) can be partially paid.
        const items = this.items.getRawValue();
        return items.reduce((acc: number, item: any) => {
            if (item.deliveryStatus === 'immediate') {
                return acc + (item.subtotal || 0);
            }
            return acc;
        }, 0);
    }

    // --- Financials ---

    calculateTotals() {
        const items = this.items.getRawValue();
        const subtotal = items.reduce((acc: number, item: any) => acc + (item.subtotal || 0), 0);
        const globalDiscount = this.noteForm.get('discount')?.value || 0;
        const total = subtotal - globalDiscount;

        this.noteForm.patchValue({
            subtotal: subtotal,
            total: total > 0 ? total : 0
        }, { emitEvent: false });

        this.calculateChange();
    }

    calculateChange() {
        const total = this.noteForm.get('total')?.value || 0;

        if (this.paymentMethod === 'card') {
            // Card payment is always exact
            this.noteForm.patchValue({
                receivedAmount: total,
                changeAmount: 0,
                cashAmount: 0,
                cardAmount: total,
                pointsAmount: 0
            }, { emitEvent: false });
            return;
        }

        if (this.paymentMethod === 'points') {
            const availablePoints = this.selectedClient?.points || 0;
            const pointsToUse = availablePoints >= total ? total : availablePoints;
            this.noteForm.patchValue({
                receivedAmount: pointsToUse,
                changeAmount: 0,
                cashAmount: 0,
                cardAmount: 0,
                pointsAmount: pointsToUse
            }, { emitEvent: false });
            return;
        }

        // Cash logic
        const received = this.noteForm.get('receivedAmount')?.value || 0;
        const change = received - total;

        this.noteForm.patchValue({
            changeAmount: change > 0 ? change : 0,
            cashAmount: received >= total ? total : received, // If partial, take all received. If over, cap at total
            cardAmount: 0,
            pointsAmount: 0
        }, { emitEvent: false });
    }

    // --- Submission ---

    get confirmButtonText(): string {
        if (this.saleType === 'consignment') return 'DAR A MAYOREO';

        const total = this.noteForm.get('total')?.value || 0;
        let paid = 0;
        if (this.paymentMethod === 'cash') {
            const received = this.noteForm.get('receivedAmount')?.value || 0;
            const change = this.noteForm.get('changeAmount')?.value || 0;
            paid = received - change; // Actual paid amount logic
            // Or simpler: Math.min(received, total) if logic holds
            paid = (received >= total) ? total : received;
        } else if (this.paymentMethod === 'card') {
            paid = this.noteForm.get('cardAmount')?.value || 0;
        } else if (this.paymentMethod === 'points') {
            paid = this.noteForm.get('pointsAmount')?.value || 0;
        }

        return (total - paid) > 0.01 ? 'GENERAR APARTADO' : 'CONFIRMAR VENTA';
    }

    get isPartialPayment(): boolean {
        return this.confirmButtonText === 'GENERAR APARTADO';
    }

    get isPaymentInsufficient(): boolean {
        if (this.saleType === 'consignment') return false; // Consignments can have 0 payment

        const formVal = this.noteForm.getRawValue();
        const totalPaying = (this.paymentMethod === 'cash' ? formVal.cashAmount : (this.paymentMethod === 'card' ? formVal.cardAmount : formVal.pointsAmount)) || 0;
        return totalPaying < (this.minRequiredPayment - 0.01);
    }

    onSubmit() {
        if (this.noteForm.invalid) {
            this.toastService.error('Por favor complete todos los campos requeridos');
            return;
        }

        if (this.folioStatus === 'taken') {
            this.toastService.error(`El folio "${this.customFolio}" ya está en uso. Elija otro.`);
            return;
        }
        if (this.folioStatus === 'checking') {
            this.toastService.warning('Verificando disponibilidad del folio, espere un momento.');
            return;
        }

        const formVal = this.noteForm.getRawValue();

        // Validate Min Payment Logic (Skip for Consignment)
        if (this.saleType === 'sale') {
            const totalPaying = (this.paymentMethod === 'cash' ? formVal.cashAmount : (this.paymentMethod === 'card' ? formVal.cardAmount : formVal.pointsAmount)) || 0;
            const minReq = this.minRequiredPayment;

            if (totalPaying < minReq - 0.01) { // 0.01 tolerance
                this.toastService.warning(`El pago ($${totalPaying}) no cubre los productos que se lleva de contado ($${minReq}). Aumente el pago o marque productos como apartado.`);
                return;
            }
        }

        this.isLoading = true;
        const currentUser = this.loginService.currentUser();
        const currentSucursal = this.loginService.currentSucursal();

        if (!currentUser || !currentSucursal) {
            this.toastService.error('Sesión inválida. Recargue la página.');
            this.isLoading = false;
            return;
        }

        // Prepare Payments Array
        const payments: any[] = [];
        // Only push one payment based on selected method (for now, simpler UX)
        // Consignments shouldn't have initial payment ideally, but if they do, we record it.
        if (this.paymentMethod === 'cash' && formVal.cashAmount > 0) {
            payments.push({ amount: formVal.cashAmount, method: 'cash' });
        } else if (this.paymentMethod === 'card' && formVal.cardAmount > 0) {
            payments.push({ amount: formVal.cardAmount, method: 'card', reference: formVal.reference });
        } else if (this.paymentMethod === 'points' && formVal.pointsAmount > 0) {
            payments.push({ amount: formVal.pointsAmount, method: 'points' });
        }


        // Calculate Financials for Payload (Backend also verifies)
        const total = formVal.total || 0;
        const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
        const balanceDue = total - totalPaid;

        // Construct Note Object
        const noteData: any = {
            sucursalId: currentSucursal._id || '',
            clientId: formVal.clientId,
            type: this.saleType,
            noteDate: new Date(this.noteDate).toISOString(),
            ...(this.customFolio.trim() && { customFolio: this.customFolio.trim() }),
            items: formVal.items.map((item: any) => ({
                itemId: item.itemId,
                itemModel: item.itemModel,
                type: item.type,
                name: item.name,
                quantity: item.quantity || 0,
                financials: {
                    unitPrice: item.unitPrice || 0,
                    discount: item.discount || 0,
                    tax: 0,
                    subtotal: item.subtotal || 0
                },
                specifications: item.specifications,
                deliveryStatus: item.deliveryStatus
            })),
            financials: {
                subtotal: formVal.subtotal || 0,
                globalDiscount: formVal.discount || 0,
                taxTotal: 0,
                total: total,
                balancePaid: totalPaid,
                balanceDue: balanceDue > 0 ? balanceDue : 0
            },
            payments: payments as any
        };

        console.log('Sending Note:', noteData);

        this.noteService.createNote(noteData).subscribe({
            next: (res) => {
                let action = '';
                if (this.saleType === 'consignment') action = 'Nota de Mayoreo creada';
                else action = (balanceDue > 0.01) ? 'Apartado generado' : 'Venta completada';

                this.toastService.success(`${action} exitosamente (Folio: ${res.data.folio})`);
                this.router.navigate(['/sales/history']);
            },
            error: (err) => {
                console.error('Error creating note', err);
                this.toastService.error('Error al crear la nota');
                this.isLoading = false;
            }
        });
    }
}
