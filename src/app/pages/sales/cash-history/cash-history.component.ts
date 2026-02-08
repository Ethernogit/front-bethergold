import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CashCutService, CashCut } from '../../../shared/services/cash-cut.service';
import { LoginService } from '../../../shared/services/auth/login.service';
import { ToastService } from '../../../shared/services/toast.service';
import { SucursalService } from '../../../shared/services/sucursal.service';

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

    // Print Data
    sucursalDetails: any = null;

    constructor(
        private cashCutService: CashCutService,
        private loginService: LoginService,
        private toastService: ToastService,
        private sucursalService: SucursalService
    ) { }

    ngOnInit(): void {
        const sucursal = this.loginService.currentSucursal();
        if (sucursal) {
            this.currentSucursalId = sucursal._id || '';
            this.loadHistory();
            this.loadSucursalDetails(this.currentSucursalId);
        }
    }

    loadSucursalDetails(id: string) {
        this.sucursalService.getSucursalById(id).subscribe({
            next: (res) => this.sucursalDetails = res.data,
            error: () => console.warn('Could not load sucursal details for printing')
        });
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

    // Modal Details Logic
    selectedShiftDetails: any = null;
    loadingDetails = false;
    showDetailsModal = false;

    openDetails(shift: CashCut) {
        if (!shift._id) return;
        this.showDetailsModal = true;
        this.loadingDetails = true;
        this.selectedShiftDetails = null; // Reset

        this.cashCutService.getShiftDetails(shift._id).subscribe({
            next: (res) => {
                this.selectedShiftDetails = res;
                this.loadingDetails = false;
            },
            error: (err) => {
                console.error('Error loading shift details', err);
                this.toastService.error('Error al cargar detalles del corte');
                this.loadingDetails = false;
                this.showDetailsModal = false;
            }
        });
    }

    closeDetails() {
        this.showDetailsModal = false;
        this.selectedShiftDetails = null;
    }

    printShift() {
        if (!this.selectedShiftDetails) return;

        const details = this.selectedShiftDetails;
        const shift = details.shift;
        const summary = details.details.summary;

        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) return;

        const sucursal = this.sucursalDetails;
        const printConfig = sucursal?.printConfig;

        // Logo
        // Typically user might want logo. Let's try to get it from config or use text.
        // Assuming environment import is not easy here without adding it, let's skip dynamic logo URL for now 
        // or just use org name.
        const orgName = sucursal?.name || 'Joyería';

        const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
        const dateFmt = (d: any) => new Date(d).toLocaleString();

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Corte de Caja</title>
                <style>
                    body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; margin: 0; padding: 5mm; }
                    .header { text-align: center; margin-bottom: 5mm; }
                    .title { font-weight: bold; font-size: 14px; margin-bottom: 2mm; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 1mm; }
                    .divider { border-top: 1px dashed #000; margin: 2mm 0; }
                    .section { margin-bottom: 3mm; }
                    .section-title { font-weight: bold; margin-bottom: 1mm; text-align: center; background: #eee; }
                    .total-row { font-weight: bold; font-size: 14px; margin-top: 2mm; }
                    .footer { text-align: center; margin-top: 10mm; }
                    .signature { border-top: 1px solid #000; width: 80%; margin: 10mm auto 2mm; pt: 2mm; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">${orgName}</div>
                    <div>CORTE DE CAJA</div>
                    <div>${dateFmt(shift.startDate)}</div>
                </div>

                <div class="divider"></div>

                <div class="section">
                    <div class="row"><span>Abierto Por:</span> <span>${shift.openedBy?.profile?.firstName || '---'}</span></div>
                    <div class="row"><span>Cerrado Por:</span> <span>${shift.closedBy?.profile?.firstName || '---'}</span></div>
                    <div class="row"><span>Fecha Cierre:</span> <span>${shift.endDate ? dateFmt(shift.endDate) : '---'}</span></div>
                </div>

                <div class="divider"></div>

                <div class="section">
                    <div class="section-title">RESUMEN</div>
                    <div class="row"><span>Fondo Inicial:</span> <span>${formatter.format(summary.initialAmount || 0)}</span></div>
                    <div class="row"><span>+ Ventas (Efectivo):</span> <span>${formatter.format(summary.salesCash || 0)}</span></div>
                    <div class="row"><span>+ Entradas Extra:</span> <span>${formatter.format(summary.movementsIn || 0)}</span></div>
                    <div class="row"><span>- Gastos (Efectivo):</span> <span>${formatter.format(summary.movementsOut || 0)}</span></div>
                    <div class="divider"></div>
                    <div class="row total-row">
                        <span>TOTAL EN CAJA:</span>
                        <span>${formatter.format(summary.expectedCashInDrawer || 0)}</span>
                    </div>
                </div>

                <div class="section">
                    <div class="row"><span>Declarado:</span> <span>${formatter.format(shift.totals?.totalDeclared || 0)}</span></div>
                    <div class="row"><span>Diferencia:</span> <span>${formatter.format(shift.totals?.difference || 0)}</span></div>
                </div>

                <div class="divider"></div>

                <div class="section">
                    <div class="section-title">OTROS MÉTODOS</div>
                    <div class="row"><span>Tarjetas:</span> <span>${formatter.format(summary.salesCard || 0)}</span></div>
                    <div class="row"><span>Transferencias:</span> <span>${formatter.format(summary.salesTransfer || 0)}</span></div>
                </div>

                <div class="footer">
                    <div class="signature"></div>
                    <div>Firma de Conformidad</div>
                    <div style="margin-top: 5mm;">Impreso: ${new Date().toLocaleString()}</div>
                </div>

                <script>
                    window.onload = function() { window.print(); setTimeout(() => window.close(), 500); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    }
}
