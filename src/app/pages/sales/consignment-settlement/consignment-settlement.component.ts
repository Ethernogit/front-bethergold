import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NoteService, Note, NoteItem } from '../../../shared/services/note.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

@Component({
  selector: 'app-consignment-settlement',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PageBreadcrumbComponent],
  templateUrl: './consignment-settlement.component.html',
  styleUrl: './consignment-settlement.component.css'
})
export class ConsignmentSettlementComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private noteService = inject(NoteService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  noteId: string | null = null;
  note: Note | null = null;
  isLoading = true;
  isSubmitting = false;

  // UI State
  activeTab: 'products' | 'payments' = 'products';

  // Processing state
  returnedItemIds: Set<string> = new Set();
  soldItems: NoteItem[] = [];
  returnedItems: NoteItem[] = [];

  // Scanning
  scanForm: FormGroup;

  // Payment
  paymentMethod: 'cash' | 'card' | 'points' = 'cash';
  paymentForm: FormGroup;

  // Totals
  totalDue = 0;
  changeAmount = 0;

  constructor() {
    this.scanForm = this.fb.group({
      barcode: ['']
    });

    this.paymentForm = this.fb.group({
      receivedAmount: [null],
      cardAmount: [null],
      pointsAmount: [null],
      reference: ['']
    });
  }

  ngOnInit(): void {
    this.noteId = this.route.snapshot.paramMap.get('id');
    if (this.noteId) {
      this.loadNote();
    } else {
      this.toastService.error('ID de nota no proporcionado');
      this.router.navigate(['/sales/history']);
    }
  }

  loadNote(): void {
    this.isLoading = true;
    this.noteService.getNoteById(this.noteId!).subscribe({
      next: (res: any) => {
        this.note = res.data;
        if (this.note) {
          this.note.items.forEach(item => {
            if (item.returned) {
              this.returnedItemIds.add((item as any)._id);
            }
          });
        }
        this.recalculateLists();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading note:', err);
        this.toastService.error('Error al cargar la nota de mayoreo');
        this.isLoading = false;
        this.router.navigate(['/sales/history']);
      }
    });
  }

  onScanSubmit(): void {
    const rawValue = this.scanForm.get('barcode')?.value;
    if (!rawValue) return;

    const barcode = rawValue.trim();
    if (barcode === '') return;

    // Find in original note items
    const foundItem = this.note?.items.find(item => {
      // We look for itemId object if populated, otherwise the string
      let itemBarcode = '';
      if (item.itemId && typeof item.itemId === 'object') {
        itemBarcode = (item.itemId as any).barcode;
      } else {
        // Fallback to checking note specifications if barcode wasn't populated
        itemBarcode = item.specifications?.notes || '';
      }
      return itemBarcode === barcode;
    });

    if (foundItem && (foundItem as any)._id) {
      const idStr = (foundItem as any)._id;

      if (this.returnedItemIds.has(idStr)) {
        this.toastService.warning('El artículo ya fue escaneado como devuelto');
      } else {
        this.returnedItemIds.add(idStr);
        this.recalculateLists();
        this.toastService.success('Artículo marcado para devolución');
      }
    } else {
      this.toastService.error('El código no pertenece a esta venta de mayoreo');
    }

    this.scanForm.reset();
    // Focus back to input (handled by template usually or ViewChild)
  }

  toggleReturnStatus(item: NoteItem): void {
    const idStr = (item as any)._id;
    if (!idStr) return;

    if (this.returnedItemIds.has(idStr)) {
      this.returnedItemIds.delete(idStr);
    } else {
      this.returnedItemIds.add(idStr);
    }
    this.recalculateLists();
  }

  isItemReturned(item: NoteItem): boolean {
    const idStr = (item as any)._id;
    if (!idStr) return false;
    return this.returnedItemIds.has(idStr);
  }

  recalculateLists(): void {
    if (!this.note) return;

    this.soldItems = [];
    this.returnedItems = [];
    this.totalDue = 0;

    this.note.items.forEach(item => {
      const idStr = (item as any)._id;
      if (!idStr) return;

      if (this.returnedItemIds.has(idStr)) {
        this.returnedItems.push(item);
      } else {
        this.soldItems.push(item);
        this.totalDue += item.financials.subtotal;
      }
    });

    if (this.paymentMethod === 'card') {
      this.paymentForm.patchValue({ cardAmount: this.calculateRemainingBalance() });
    } else if (this.paymentMethod === 'points') {
      const remaining = this.calculateRemainingBalance();
      const points = (this.note?.clientId as any)?.points || 0;
      this.paymentForm.patchValue({ pointsAmount: Math.min(remaining > 0 ? remaining : 0, points) });
    }

    this.calculateChange();
  }

  calculateRemainingBalance(): number {
    const totalSold = this.totalDue;
    const previouslyPaid = this.note?.financials?.balancePaid || 0;
    // Allow negative remainder to indicate overpayment/points
    return totalSold - previouslyPaid;
  }

  get clientPoints(): number {
    return (this.note?.clientId as any)?.points || 0;
  }

  setPaymentMethod(method: 'cash' | 'card' | 'points'): void {
    this.paymentMethod = method;
    this.paymentForm.reset();
    if (method === 'card') {
      this.paymentForm.patchValue({ cardAmount: this.calculateRemainingBalance() });
    } else if (method === 'points') {
      const remaining = this.calculateRemainingBalance();
      const points = (this.note?.clientId as any)?.points || 0;
      this.paymentForm.patchValue({ pointsAmount: Math.min(remaining > 0 ? remaining : 0, points) });
    }
    this.calculateChange();
  }

  pointsToGenerate: number = 0;

  calculateChange(): void {
    const remaining = this.calculateRemainingBalance();

    // If the remaining balance is negative, it means they overpaid previously
    // and those are strictly points now. No new payment is needed.
    if (remaining < 0) {
      this.changeAmount = 0;
      this.pointsToGenerate = Math.abs(remaining);
      return;
    }

    if (this.paymentMethod === 'cash') {
      const received = this.paymentForm.get('receivedAmount')?.value || 0;
      this.changeAmount = received - remaining;
      this.pointsToGenerate = 0; // In cash, change is given back
    } else if (this.paymentMethod === 'card') {
      const cardAmount = this.paymentForm.get('cardAmount')?.value || 0;
      this.changeAmount = cardAmount - remaining;
      // In card/electronic, overpayment might not be given back as change, but let's assume standard change logic for now
      // Or in this specific context, any overpayment during settlement becomes points.
      this.pointsToGenerate = this.changeAmount > 0 ? this.changeAmount : 0;
    } else if (this.paymentMethod === 'points') {
      const pointsAmount = this.paymentForm.get('pointsAmount')?.value || 0;
      this.changeAmount = pointsAmount - remaining;
      this.pointsToGenerate = 0; // Points cannot generate more points
    }
  }

  showPointsWarning = signal<boolean>(false);

  onSubmit(): void {
    if (!this.noteId || !this.note) return;
    const remaining = this.calculateRemainingBalance();

    // Validation
    if (remaining > 0) {
      if (this.paymentMethod === 'card') {
        const ref = this.paymentForm.get('reference')?.value;
        const cardAmount = this.paymentForm.get('cardAmount')?.value || 0;

        if (cardAmount > 0 && (!ref || ref.trim() === '')) {
          this.toastService.error('Debe ingresar la referencia o voucher del pago con tarjeta');
          return;
        }
      }
    }

    // Check if points will be generated (either by previous overpayment or current overpayment)
    if (this.pointsToGenerate > 0 || remaining < 0) {
      this.showPointsWarning.set(true);
      return;
    }

    this.confirmPointsAndSubmit();
  }

  confirmPointsAndSubmit(): void {
    this.showPointsWarning.set(false);
    this.isSubmitting = true;

    const remaining = Math.max(0, this.calculateRemainingBalance());

    // Prepare payload
    let payments: any[] = [];
    if (remaining > 0) {
      // Logic if they still owed money and are paying now
      if (this.paymentMethod === 'cash') {
        const received = this.paymentForm.get('receivedAmount')?.value || 0;
        // In cash, we only register the exact amount owed, the rest is change given to customer
        const paymentAmount = received > remaining ? remaining : received;
        if (paymentAmount > 0) {
          payments.push({
            amount: paymentAmount,
            method: 'cash'
          });
        }
      } else if (this.paymentMethod === 'card') {
        const cardAmount = this.paymentForm.get('cardAmount')?.value || 0;
        // If card overpays, the whole card amount is registered and the excess becomes points (calculated in backend)
        const paymentAmount = cardAmount;
        if (paymentAmount > 0) {
          payments.push({
            amount: paymentAmount,
            method: 'card',
            reference: this.paymentForm.get('reference')?.value || 'MAYOREO'
          });
        }
      } else if (this.paymentMethod === 'points') {
        const pointsAmount = this.paymentForm.get('pointsAmount')?.value || 0;
        const paymentAmount = pointsAmount > remaining ? remaining : pointsAmount;
        if (paymentAmount > 0) {
          payments.push({
            amount: paymentAmount,
            method: 'points'
          });
        }
      }
    }

    const payload = {
      returnedItemIds: Array.from(this.returnedItemIds),
      payments: payments
    };

    this.noteService.settleConsignment(this.noteId!, payload).subscribe({
      next: (res: any) => {
        if (res.data?.pointsGenerated) {
          this.toastService.success(`Corte realizado. El cliente ganó ${res.data.pointsGenerated} Puntos Sucursal`);
        } else {
          this.toastService.success('Corte de mayoreo realizado correctamente');
        }
        const clientId = typeof this.note!.clientId === 'object' ? (this.note!.clientId as any)._id : this.note!.clientId;
        this.router.navigate(['/clients', clientId]);
      },
      error: (err: any) => {
        console.error('Error settling consignment:', err);
        this.toastService.error(err.error?.message || 'Error al procesar el corte');
        this.isSubmitting = false;
      }
    });
  }

  getProductName(item: NoteItem): string {
    return item.name || 'Producto';
  }

  getClientName(): string {
    if (!this.note || !this.note.clientId) return 'Cargando...';
    if (typeof this.note.clientId === 'object' && this.note.clientId.name) {
      return this.note.clientId.name;
    }
    return 'Cargando...';
  }

  getItemBarcode(item: NoteItem): string {
    if (item.itemId && typeof item.itemId === 'object') {
      return (item.itemId as any).barcode || 'N/A';
    }
    return item.specifications?.notes || 'N/A';
  }
}
