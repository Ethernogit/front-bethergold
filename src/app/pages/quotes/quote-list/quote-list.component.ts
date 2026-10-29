import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { QuoteService } from '../../../shared/services/quote.service';
import { PermissionService } from '../../../shared/services/auth/permission.service';
import { ToastService } from '../../../shared/services/toast.service';
import { FilterConfig, FilterSidebarComponent } from '../../../shared/components/ui/filter-sidebar/filter-sidebar.component';
import { QuoteEffectiveStatus, QuoteListItem, QuoteListParams } from '../../../shared/interfaces/quote.interfaces';

interface QuoteFilters {
    term?: string;
    status?: QuoteEffectiveStatus;
    startDate?: string;
    endDate?: string;
}

@Component({
    selector: 'app-quote-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, FilterSidebarComponent],
    templateUrl: './quote-list.component.html',
    styles: [`:host { display: flex; flex-direction: column; height: 100%; }`]
})
export class QuoteListComponent implements OnInit {
    private quoteService = inject(QuoteService);
    private toastService = inject(ToastService);
    readonly permissionService = inject(PermissionService);

    quotes = signal<QuoteListItem[]>([]);
    loading = signal(false);

    filterConfig = signal<FilterConfig[]>([]);
    showFilters = signal(false);
    activeFilters = signal<QuoteFilters>({});

    currentPage = signal(1);
    itemsPerPage = signal(20);
    totalItems = signal(0);
    totalPages = signal(0);

    ngOnInit(): void {
        this.filterConfig.set([
            { key: 'term', label: 'Buscar', type: 'text', placeholder: 'Folio, cliente o prospecto...' },
            {
                key: 'status',
                label: 'Estado',
                type: 'select',
                options: [
                    { value: 'VIGENTE', label: 'Vigente' },
                    { value: 'VENCIDA', label: 'Vencida' },
                    { value: 'CONVERTIDA', label: 'Convertida' },
                    { value: 'CANCELADA', label: 'Cancelada' }
                ],
                placeholder: 'Todos'
            },
            { key: 'startDate', label: 'Creada desde', type: 'date' },
            { key: 'endDate', label: 'Creada hasta', type: 'date' }
        ]);
        this.loadQuotes();
    }

    loadQuotes() {
        const { term, status, startDate, endDate } = this.activeFilters();
        // El filtro da YYYY-MM-DD; el back recibe los límites del día en hora local
        const params: QuoteListParams = {
            term,
            status,
            startDate: startDate ? new Date(`${startDate}T00:00:00`).toISOString() : undefined,
            endDate: endDate ? new Date(`${endDate}T23:59:59.999`).toISOString() : undefined,
            page: this.currentPage(),
            limit: this.itemsPerPage()
        };

        this.loading.set(true);
        this.quoteService.getQuotes(params)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res) => {
                    this.quotes.set(res.data.quotes);
                    this.totalItems.set(res.data.pagination.totalItems);
                    this.totalPages.set(res.data.pagination.totalPages);
                },
                error: () => this.toastService.error('Error al cargar las cotizaciones')
            });
    }

    customerName(quote: QuoteListItem): string {
        return quote.clientId?.name || quote.prospect?.name || '—';
    }

    onFilterApply(filters: QuoteFilters) {
        this.activeFilters.set(filters);
        this.currentPage.set(1);
        this.loadQuotes();
    }

    onPageChange(page: number) {
        this.currentPage.set(page);
        this.loadQuotes();
    }

    onLimitChange(limit: number) {
        this.itemsPerPage.set(Number(limit));
        this.currentPage.set(1);
        this.loadQuotes();
    }

    hasActiveFilters(): boolean {
        return Object.values(this.activeFilters()).some(v => !!v);
    }
}
