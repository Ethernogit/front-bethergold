import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { NoteService, Note, NoteItem } from '../../../shared/services/note.service';
import { ClientService } from '../../../shared/services/client.service';
import { ProductService, Product } from '../../../shared/services/product.service';
import { LoginService } from '../../../shared/services/auth/login.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, catchError, filter } from 'rxjs/operators';
import { of } from 'rxjs';

import { RouterModule } from '@angular/router';

// Imports for UI components (assuming they exist or will be used directly)
// import { ClientSelectorComponent } from ...

@Component({
    selector: 'app-new-note',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './new-note.component.html'
})
export class NewNoteComponent implements OnInit {
    noteForm: FormGroup;
    searchControl = new FormControl('');
    isLoading = false;

    // Lists
    clients: any[] = [];
    searchResults: Product[] = [];
    isSearching = false;

    // UX State
    showPaymentModal = false;
    currentDate = new Date();

    constructor(
        private fb: FormBuilder,
        private noteService: NoteService,
        private clientService: ClientService,
        private productService: ProductService,
        private loginService: LoginService,
        private toastService: ToastService,
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
            transferAmount: [0]
        });
    }

    ngOnInit(): void {
        this.loadClients();
        this.setupSearch();
    }

    setupSearch() {
        this.searchControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            filter(term => (term || '').length > 2),
            switchMap(term => {
                this.isSearching = true;
                return this.productService.searchProductsByQR(term || '').pipe(
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

    // --- Item Management ---

    selectProduct(product: Product) {
        // Determine item type based on product category/attributes logic (simplified for now)
        const type = 'jewelry';

        const itemGroup = this.fb.group({
            itemId: [product._id],
            itemModel: ['Product'],
            type: [type],
            name: [product.name || product.description || 'Producto sin nombre', Validators.required],
            quantity: [1, [Validators.required, Validators.min(0.01)]],
            unitPrice: [product.price || 0, [Validators.required, Validators.min(0)]],
            discount: [0, [Validators.min(0)]],
            subtotal: [product.price || 0],
            specifications: this.fb.group({
                material: [product.jewelryDetails?.goldType || ''],
                size: [''],
                weight: [product.specifications?.weight || ''],
                karatage: [product.jewelryDetails?.karatage || ''],
                notes: [product.sku ? `SKU: ${product.sku}` : '']
            })
        });

        this.subscribeToItemChanges(itemGroup);
        this.items.push(itemGroup);

        // Clear search
        this.searchControl.setValue('', { emitEvent: false });
        this.searchResults = [];
        this.calculateTotals();
        this.toastService.success('Producto agregado');
    }

    addItem(type: 'jewelry' | 'service' | 'custom' | 'external' = 'jewelry') {
        const itemGroup = this.fb.group({
            itemId: [null],
            itemModel: ['Custom'],
            type: [type === 'external' ? 'custom' : type], // Map external to custom for now
            name: ['', Validators.required],
            quantity: [1, [Validators.required, Validators.min(0.01)]],
            unitPrice: [0, [Validators.required, Validators.min(0)]],
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
        const received = this.noteForm.get('receivedAmount')?.value || 0;
        const change = received - total;

        this.noteForm.patchValue({
            changeAmount: change > 0 ? change : 0
        }, { emitEvent: false });

        // Auto-fill cash amount for backend logic
        if (received > 0) {
            const payVal = received >= total ? total : received;
            this.noteForm.patchValue({ cashAmount: payVal }, { emitEvent: false });
        }
    }

    // --- Submission ---

    onSubmit() {
        if (this.noteForm.invalid) {
            this.toastService.error('Por favor complete todos los campos requeridos');
            return;
        }

        this.isLoading = true;
        const formVal = this.noteForm.getRawValue();
        const currentUser = this.loginService.currentUser();
        const currentSucursal = this.loginService.currentSucursal();

        if (!currentUser || !currentSucursal) {
            this.toastService.error('Sesión inválida. Recargue la página.');
            this.isLoading = false;
            return;
        }

        // Prepare Payments Array
        const payments: any[] = [];
        if (formVal.cashAmount > 0) payments.push({ amount: formVal.cashAmount || 0, method: 'cash' });
        if (formVal.cardAmount > 0) payments.push({ amount: formVal.cardAmount || 0, method: 'card' });
        if (formVal.transferAmount > 0) payments.push({ amount: formVal.transferAmount || 0, method: 'transfer' });


        // Construct Note Object
        const noteData: Note = {
            sucursalId: currentSucursal._id || '',
            clientId: formVal.clientId,
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
                specifications: item.specifications
            })),
            financials: {
                subtotal: formVal.subtotal || 0,
                globalDiscount: formVal.discount || 0,
                taxTotal: 0,
                total: formVal.total || 0,
                balancePaid: 0,
                balanceDue: 0
            },
            payments: payments as any
        };

        console.log('Sending Note:', noteData);

        this.noteService.createNote(noteData).subscribe({
            next: (res) => {
                this.toastService.success(`Nota ${res.data.folio} creada exitosamente`);
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
