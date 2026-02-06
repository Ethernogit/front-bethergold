import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CashCutService, CashCut } from '../../../shared/services/cash-cut.service';
import { LoginService } from '../../../shared/services/auth/login.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
    selector: 'app-cash-history',
    standalone: true,
    imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
    templateUrl: './cash-history.component.html'
})
export class CashHistoryComponent implements OnInit {
    // History State
    history: CashCut[] = [];
    historyLoading = false;
    historyPage = 1;
    historyLimit = 10;
    historyTotal = 0;

    // Filters
    filterStartDate: string | null = null;
    filterEndDate: string | null = null;
    filterStatus: string = ''; // ''=All, 'open'=Abiertas, 'closed'=Cerradas

    currentSucursalId = '';

    constructor(
        private cashCutService: CashCutService,
        private loginService: LoginService,
        private toastService: ToastService
    ) { }

    ngOnInit(): void {
        const sucursal = this.loginService.currentSucursal();
        if (sucursal) {
            this.currentSucursalId = sucursal._id || '';
            this.loadHistory();
        }
    }

    loadHistory() {
        this.historyLoading = true;
        this.cashCutService.getHistory(
            this.currentSucursalId,
            this.historyPage,
            this.historyLimit,
            this.filterStartDate || undefined,
            this.filterEndDate || undefined,
            this.filterStatus || undefined
        ).subscribe({
            next: (res) => {
                this.history = res.data;
                this.historyTotal = res.meta.total;
                this.historyLoading = false;
            },
            error: (err) => {
                console.error('Error loading history', err);
                this.toastService.error('Error al cargar historial');
                this.historyLoading = false;
            }
        });
    }

    onFilterChange() {
        this.historyPage = 1;
        this.loadHistory();
    }

    changePage(page: number) {
        this.historyPage = page;
        this.loadHistory();
    }

    // Logic to update/close stale shifts if needed (optional for future)
    closeStaleShift(shift: CashCut) {
        // Implement if user wants to close from here or redirect to main cash cut with ID
    }
}
