import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NoteService, Note, NotePayment } from '../../../shared/services/note.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-sales-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-history.component.html',
  styles: []
})
export class SalesHistoryComponent implements OnInit {
  notes: Note[] = [];
  searchTerm: string = '';

  // Payment Modal State
  isPaymentModalOpen = false;
  selectedNote: Note | null = null;
  paymentAmount: number = 0;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'deposit' | 'credit' | 'other' = 'cash';
  validPaymentMethods: ('cash' | 'card' | 'transfer' | 'deposit')[] = ['cash', 'card', 'transfer', 'deposit'];

  constructor(
    private noteService: NoteService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.loadNotes();
  }

  loadNotes() {
    this.noteService.getNotes({ term: this.searchTerm }).subscribe({
      next: (res) => {
        if (res.success) {
          this.notes = res.data;
        }
      },
      error: (err) => {
        console.error('Error loading notes', err);
        this.toastService.error('Error al cargar las notas');
      }
    });
  }

  searchNotes() {
    this.loadNotes();
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
