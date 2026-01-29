import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { NoteService, Note, NotePayment } from '../../../shared/services/note.service';
import { ToastService } from '../../../shared/services/toast.service';
import { FilterConfig, FilterSidebarComponent } from '../../../shared/components/ui/filter-sidebar/filter-sidebar.component';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-sales-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FilterSidebarComponent],
  templateUrl: './sales-history.component.html',
  styles: []
})
export class SalesHistoryComponent implements OnInit {
  notes = signal<Note[]>([]);
  loading = signal(false);

  // Filters & Search
  filterConfig = signal<FilterConfig[]>([]);
  showFilters = signal(false);
  activeFilters = signal<any>({});

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(20);
  totalItems = signal(0);
  totalPages = signal(0);

  // Payment Modal State
  isPaymentModalOpen = false;
  selectedNote: Note | null = null;
  paymentAmount: number = 0;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'deposit' | 'credit' | 'other' = 'cash';
  validPaymentMethods: ('cash' | 'card' | 'transfer' | 'deposit')[] = ['cash', 'card', 'transfer', 'deposit'];

  constructor(
    private noteService: NoteService,
    private toastService: ToastService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initFilterConfig();
    this.loadNotes();
  }

  viewNoteDetail(note: Note) {
    if (note.folio) {
      this.router.navigate(['/sales/note', note.folio]);
    }
  }

  initFilterConfig() {
    this.filterConfig.set([
      {
        key: 'term',
        label: 'Folio',
        type: 'text',
        placeholder: 'Buscar por folio...'
      },
      {
        key: 'status',
        label: 'Estado',
        type: 'select',
        options: [
          { value: 'PENDIENTE_PAGO', label: 'Pendiente de Pago' },
          { value: 'PAGADA', label: 'Pagada' },
          { value: 'ENTREGADA', label: 'Entregada' },
          { value: 'ANULADA', label: 'Anulada' },
          { value: 'BORRADOR', label: 'Borrador' }
        ],
        placeholder: 'Todos'
      },
      {
        key: 'startDate',
        label: 'Fecha Inicio',
        type: 'date'
      },
      {
        key: 'endDate',
        label: 'Fecha Fin',
        type: 'date'
      }
    ]);
  }

  loadNotes() {
    this.loading.set(true);
    const params = {
      limit: this.itemsPerPage(),
      skip: (this.currentPage() - 1) * this.itemsPerPage(),
      ...this.activeFilters()
    };

    this.noteService.getNotes(params)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.notes.set(res.data);
            if (res.pagination) {
              this.totalItems.set(res.pagination.total);
              this.totalPages.set(res.pagination.pages);
            }
          }
        },
        error: (err) => {
          console.error('Error loading notes', err);
          this.toastService.error('Error al cargar las notas');
        }
      });
  }

  onFilterApply(filters: any) {
    this.activeFilters.set(filters);
    this.currentPage.set(1);
    this.loadNotes();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadNotes();
  }

  onLimitChange(limit: number) {
    this.itemsPerPage.set(limit);
    this.currentPage.set(1);
    this.loadNotes();
  }

  openFilters() {
    this.showFilters.set(true);
  }

  closeFilters() {
    this.showFilters.set(false);
  }

  // Payment Logic
  openPaymentModal(note: Note) {
    this.selectedNote = note;
    this.paymentAmount = note.financials.balanceDue;
    this.paymentMethod = 'cash';
    this.isPaymentModalOpen = true;
  }

  closePaymentModal() {
    this.isPaymentModalOpen = false;
    this.selectedNote = null;
  }

  submitPayment() {
    if (!this.selectedNote || !this.selectedNote._id) return;
    if (this.paymentAmount <= 0) {
      this.toastService.warning('El monto debe ser mayor a 0');
      return;
    }

    const payment: NotePayment = {
      amount: this.paymentAmount,
      method: this.paymentMethod,
      date: new Date()
    };

    this.noteService.addPayment(this.selectedNote._id, payment).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.success('Pago registrado exitosamente');
          this.closePaymentModal();
          this.loadNotes(); // Refresh list
        }
      },
      error: (err) => {
        console.error('Error adding payment', err);
        this.toastService.error('Error al registrar el pago');
      }
    });
  }

  // Cancel Logic
  confirmCancel(note: Note) {
    if (!note._id) return;
    if (!confirm('¿Está seguro de anular esta nota? Esta acción restaurará el inventario.')) return;

    this.noteService.cancelNote(note._id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.success('Nota anulada exitosamente');
          this.loadNotes();
        }
      },
      error: (err) => {
        console.error('Error canceling note', err);
        this.toastService.error('Error al anular la nota');
      }
    });
  }
}
