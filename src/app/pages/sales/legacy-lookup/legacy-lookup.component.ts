import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { LegacyLookupNote, LegacyLookupResult, NoteService } from '../../../shared/services/note.service';
import { ToastService } from '../../../shared/services/toast.service';

/**
 * Barcode lookup for migrated (legacy) notes.
 *
 * During inventory, staff find products that look available but were actually sold —
 * the payment was collected in the old system and never registered, so the note stayed
 * pending. Scanning the product here tells them which note it belongs to, so they can
 * pull the physical note and decide.
 */
@Component({
    selector: 'app-legacy-lookup',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './legacy-lookup.component.html'
})
export class LegacyLookupComponent {
    private noteService = inject(NoteService);
    private toastService = inject(ToastService);

    @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

    term = '';
    loading = signal(false);
    result = signal<LegacyLookupResult | null>(null);

    search(): void {
        const term = this.term.trim();
        if (!term) return;

        this.loading.set(true);
        this.result.set(null);

        this.noteService.legacyLookup(term)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res) => {
                    this.result.set(res.data);
                    // Barcode scanners send Enter after typing; clearing and re-focusing
                    // lets staff scan the next piece without touching the keyboard.
                    this.term = '';
                    this.searchInput?.nativeElement.focus();
                },
                error: (err) => {
                    this.toastService.error(err.error?.message || 'No se pudo realizar la búsqueda.');
                }
            });
    }

    matchedItems(note: LegacyLookupNote): string[] {
        return note.items.filter(item => item.isMatch).map(item => item.name);
    }

    legacyPaid(note: LegacyLookupNote): number {
        return note.payments
            .filter(payment => payment.isLegacy)
            .reduce((sum, payment) => sum + payment.amount, 0);
    }

    postMigrationPaid(note: LegacyLookupNote): number {
        return note.payments
            .filter(payment => !payment.isLegacy)
            .reduce((sum, payment) => sum + payment.amount, 0);
    }
}
