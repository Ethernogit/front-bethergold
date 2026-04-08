import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ReportsService } from '../../shared/services/reports.service';
import { LoginService } from '../../shared/services/auth/login.service';
import { ToastService } from '../../shared/services/toast.service';

type Tab = 'ventas' | 'inventario' | 'caja';

const ITEM_TYPE_LABELS: Record<string, string> = {
    jewelry:    'Joyería / Venta Express',
    custom:     'Hechuras',
    pawn:       'Préstamos / Empeños',
    repair:     'Taller / Reparaciones',
    service:    'Taller / Reparaciones',
    gold_buying:'Compra de Oro',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    cash:     'Efectivo',
    card:     'Tarjeta',
    transfer: 'Transferencia',
    points:   'Puntos',
    deposit:  'Depósito',
    credit:   'Crédito',
    other:    'Otro',
};

@Component({
    selector: 'app-reportes',
    standalone: true,
    imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, DecimalPipe, NgApexchartsModule],
    templateUrl: './reportes.component.html'
})
export class ReportesComponent implements OnInit {
    activeTab: Tab = 'ventas';

    // Date filters — default: last 30 days
    startDate: string;
    endDate: string;

    loading = false;
    salesData: any = null;
    inventoryData: any = null;
    cashData: any = null;

    currentSucursalId = '';

    // Chart configs
    dailySalesChart: any = null;
    itemTypeChart: any = null;
    paymentMethodChart: any = null;
    categoryChart: any = null;
    karatageChart: any = null;
    cashDailyChart: any = null;

    readonly itemTypeLabels = ITEM_TYPE_LABELS;
    readonly paymentMethodLabels = PAYMENT_METHOD_LABELS;

    constructor(
        private reportsService: ReportsService,
        private loginService: LoginService,
        private toastService: ToastService
    ) {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        this.endDate = this.formatDate(today);
        this.startDate = this.formatDate(thirtyDaysAgo);
    }

    ngOnInit(): void {
        const sucursal = this.loginService.currentSucursal();
        if (sucursal) {
            this.currentSucursalId = sucursal._id || '';
        }
        this.loadActiveTab();
    }

    setTab(tab: Tab): void {
        this.activeTab = tab;
        this.loadActiveTab();
    }

    loadActiveTab(): void {
        if (this.activeTab === 'ventas') this.loadSales();
        else if (this.activeTab === 'inventario') this.loadInventory();
        else if (this.activeTab === 'caja') this.loadCash();
    }

    onFilterChange(): void {
        this.loadActiveTab();
    }

    // ──────────────────── VENTAS ────────────────────

    loadSales(): void {
        this.loading = true;
        this.salesData = null;
        this.reportsService.getSalesReport({
            startDate: this.startDate,
            endDate: this.endDate,
            sucursalId: this.currentSucursalId || undefined
        }).subscribe({
            next: (res) => {
                this.salesData = res.data;
                this.buildSalesCharts(res.data);
                this.loading = false;
            },
            error: () => {
                this.toastService.error('Error al cargar reporte de ventas');
                this.loading = false;
            }
        });
    }

    buildSalesCharts(data: any): void {
        // Daily timeline
        const days = (data.dailyTimeline || []).map((d: any) => d._id);
        const totals = (data.dailyTimeline || []).map((d: any) => d.total);

        this.dailySalesChart = {
            series: [{ name: 'Ingresos', data: totals }],
            chart: { type: 'area', height: 220, toolbar: { show: false }, fontFamily: 'Instrument Sans, sans-serif' },
            xaxis: { categories: days, axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { fontSize: '11px' } } },
            yaxis: { labels: { formatter: (v: number) => `$${v.toLocaleString()}` } },
            colors: ['#C69214'],
            fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
            stroke: { curve: 'smooth', width: 2 },
            dataLabels: { enabled: false },
            grid: { strokeDashArray: 4, borderColor: '#E8D9A0' },
            tooltip: { y: { formatter: (v: number) => `$${v.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` } }
        };

        // Item type donut
        const itemLabels = (data.byItemType || []).map((i: any) => ITEM_TYPE_LABELS[i._id] || i._id || 'Otro');
        const itemValues = (data.byItemType || []).map((i: any) => i.total);

        this.itemTypeChart = {
            series: itemValues,
            chart: { type: 'donut', height: 260, fontFamily: 'Instrument Sans, sans-serif' },
            labels: itemLabels,
            colors: ['#C69214', '#F5A623', '#F7CA56', '#8B6914', '#D4A843', '#A67C28'],
            legend: { position: 'bottom', fontSize: '12px' },
            dataLabels: { enabled: false },
            plotOptions: { pie: { donut: { size: '65%' } } },
            tooltip: { y: { formatter: (v: number) => `$${v.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` } }
        };

        // Payment method donut
        const pmLabels = (data.byPaymentMethod || []).map((p: any) => PAYMENT_METHOD_LABELS[p._id] || p._id);
        const pmValues = (data.byPaymentMethod || []).map((p: any) => p.total);

        this.paymentMethodChart = {
            series: pmValues,
            chart: { type: 'donut', height: 260, fontFamily: 'Instrument Sans, sans-serif' },
            labels: pmLabels,
            colors: ['#22C55E', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#6B7280'],
            legend: { position: 'bottom', fontSize: '12px' },
            dataLabels: { enabled: false },
            plotOptions: { pie: { donut: { size: '65%' } } },
            tooltip: { y: { formatter: (v: number) => `$${v.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` } }
        };
    }

    // ──────────────────── INVENTARIO ────────────────────

    loadInventory(): void {
        this.loading = true;
        this.inventoryData = null;
        this.reportsService.getInventoryReport({
            sucursalId: this.currentSucursalId || undefined
        }).subscribe({
            next: (res) => {
                this.inventoryData = res.data;
                this.buildInventoryCharts(res.data);
                this.loading = false;
            },
            error: () => {
                this.toastService.error('Error al cargar reporte de inventario');
                this.loading = false;
            }
        });
    }

    buildInventoryCharts(data: any): void {
        // Stock by category
        const catLabels = (data.byCategory || []).map((c: any) => c.categoryName);
        const catValues = (data.byCategory || []).map((c: any) => c.totalPieces);

        this.categoryChart = {
            series: [{ name: 'Piezas', data: catValues }],
            chart: { type: 'bar', height: 260, toolbar: { show: false }, fontFamily: 'Instrument Sans, sans-serif' },
            xaxis: { categories: catLabels, axisBorder: { show: false }, axisTicks: { show: false } },
            plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
            colors: ['#C69214'],
            dataLabels: { enabled: false },
            grid: { strokeDashArray: 4, borderColor: '#E8D9A0' }
        };

        // By karatage donut
        const karLabels = (data.byKaratage || []).map((k: any) => k._id);
        const karValues = (data.byKaratage || []).map((k: any) => k.totalPieces);

        this.karatageChart = {
            series: karValues,
            chart: { type: 'donut', height: 260, fontFamily: 'Instrument Sans, sans-serif' },
            labels: karLabels,
            colors: ['#C69214', '#F5A623', '#F7CA56', '#8B6914', '#D4A843', '#A67C28'],
            legend: { position: 'bottom', fontSize: '12px' },
            dataLabels: { enabled: false },
            plotOptions: { pie: { donut: { size: '65%' } } }
        };
    }

    // ──────────────────── CAJA ────────────────────

    loadCash(): void {
        this.loading = true;
        this.cashData = null;
        this.reportsService.getCashReport({
            startDate: this.startDate,
            endDate: this.endDate,
            sucursalId: this.currentSucursalId || undefined
        }).subscribe({
            next: (res) => {
                this.cashData = res.data;
                this.buildCashCharts(res.data);
                this.loading = false;
            },
            error: () => {
                this.toastService.error('Error al cargar reporte de caja');
                this.loading = false;
            }
        });
    }

    buildCashCharts(data: any): void {
        const days = (data.dailyChart || []).map((d: any) => d._id);
        const cashValues = (data.dailyChart || []).map((d: any) => d.totalCash);
        const totalValues = (data.dailyChart || []).map((d: any) => d.totalSales);

        this.cashDailyChart = {
            series: [
                { name: 'Total Ventas', data: totalValues },
                { name: 'Efectivo', data: cashValues }
            ],
            chart: { type: 'bar', height: 260, toolbar: { show: false }, fontFamily: 'Instrument Sans, sans-serif' },
            xaxis: { categories: days, axisBorder: { show: false }, axisTicks: { show: false } },
            colors: ['#C69214', '#22C55E'],
            plotOptions: { bar: { borderRadius: 4, columnWidth: '50%' } },
            dataLabels: { enabled: false },
            grid: { strokeDashArray: 4, borderColor: '#E8D9A0' },
            legend: { position: 'top' },
            tooltip: { y: { formatter: (v: number) => `$${v.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` } }
        };
    }

    // ──────────────────── UTILS ────────────────────

    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    labelForItemType(type: string): string {
        return ITEM_TYPE_LABELS[type] || type;
    }

    labelForPaymentMethod(method: string): string {
        return PAYMENT_METHOD_LABELS[method] || method;
    }

    totalRevenue(byItemType: any[]): number {
        return (byItemType || []).reduce((acc, i) => acc + (i.total || 0), 0);
    }
}
