import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CashCutService, ShiftReport } from '../../../shared/services/cash-cut.service';
import { LoginService } from '../../../shared/services/auth/login.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
    selector: 'app-cash-cut',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, CurrencyPipe, DatePipe],
    templateUrl: './cash-cut.component.html'
})
export class CashCutComponent implements OnInit {
    // Estado de la UI
    isLoading = true;
    hasOpenShift = false;
    report: ShiftReport | null = null;
    currentSucursalId = '';

    // Formularios
    openShiftForm: FormGroup;
    closeShiftForm: FormGroup;
    movementForm: FormGroup;

    // Modales
    showCloseModal = false;
    showMovementModal = false;
    movementType: 'IN' | 'OUT' = 'OUT'; // Para el modal de movimientos

    constructor(
        private fb: FormBuilder,
        private cashCutService: CashCutService,
        private loginService: LoginService,
        private toastService: ToastService
    ) {
        this.openShiftForm = this.fb.group({
            initialAmount: [0, [Validators.required, Validators.min(0)]]
        });

        this.closeShiftForm = this.fb.group({
            totalDeclared: [0, [Validators.required, Validators.min(0)]],
            notes: ['']
        });

        this.movementForm = this.fb.group({
            amount: [0, [Validators.required, Validators.min(0.01)]],
            description: ['', Validators.required],
            subtype: ['EXPENSE'],
            method: ['cash', Validators.required]
        });
    }

    ngOnInit(): void {
        const sucursal = this.loginService.currentSucursal();
        if (!sucursal) {
            this.toastService.error('No se detectó la sucursal. Recarga la página.');
            return;
        }
        this.currentSucursalId = sucursal._id || '';
        this.loadShiftStatus();
    }

    loadShiftStatus() {
        this.isLoading = true;
        this.cashCutService.getCurrentShift(this.currentSucursalId).subscribe({
            next: (res) => {
                this.report = res;
                this.hasOpenShift = true;
                this.isLoading = false;
            },
            error: (err) => {
                if (err.status === 404) {
                    this.hasOpenShift = false; // No hay caja abierta
                } else {
                    console.error('Error loading shift', err);
                    this.toastService.error('Error al cargar estado de caja');
                }
                this.isLoading = false;
            }
        });
    }

    // --- Acciones de Caja ---

    openShift() {
        if (this.openShiftForm.invalid) return;

        this.isLoading = true;
        const initialAmount = this.openShiftForm.value.initialAmount;

        this.cashCutService.openShift(this.currentSucursalId, initialAmount).subscribe({
            next: () => {
                this.toastService.success('Caja abierta correctamente');
                this.loadShiftStatus();
            },
            error: (err) => {
                console.error(err);
                this.toastService.error(err.error?.message || 'Error al abrir caja');
                this.isLoading = false;
            }
        });
    }

    closeShift() {
        if (this.closeShiftForm.invalid) return;

        this.isLoading = true;
        const { totalDeclared, notes } = this.closeShiftForm.value;

        this.cashCutService.closeShift(this.currentSucursalId, totalDeclared, notes).subscribe({
            next: () => {
                this.toastService.success('Caja cerrada con éxito');
                this.showCloseModal = false;
                this.hasOpenShift = false;
                this.report = null;
                this.isLoading = false;
            },
            error: (err) => {
                console.error(err);
                this.toastService.error('Error al cerrar caja');
                this.isLoading = false;
            }
        });
    }

    // --- Movimientos (Gastos/Ingresos) ---

    openMovementModal(type: 'IN' | 'OUT') {
        this.movementType = type;
        this.movementForm.reset({
            amount: 0,
            description: '',
            subtype: type === 'IN' ? 'DEPOSIT' : 'EXPENSE',
            method: 'cash'
        });
        this.showMovementModal = true;
    }

    submitMovement() {
        if (this.movementForm.invalid) return;

        const { amount, description, subtype, method } = this.movementForm.value;

        this.cashCutService.createMovement({
            sucursalId: this.currentSucursalId,
            type: this.movementType,
            subtype,
            amount,
            description,
            method
        }).subscribe({
            next: () => {
                this.toastService.success('Movimiento registrado');
                this.showMovementModal = false;
                this.loadShiftStatus(); // Recargar valores
            },
            error: (err) => {
                this.toastService.error('Error al guardar movimiento');
            }
        });
    }

    // --- Getters & Helpers ---

    // Calcula diferencia en tiempo real para el modal de cierre
    get calculatedDifference(): number {
        if (!this.report) return 0;
        const declared = this.closeShiftForm.get('totalDeclared')?.value || 0;
        const expected = this.report.financials.expectedCashInDrawer;
        return declared - expected;
    }
}
