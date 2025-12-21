
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ClientService, Client } from '../../../shared/services/client.service';
import { ToastService } from '../../../shared/services/toast.service';
import { finalize } from 'rxjs';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-client-list',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
    templateUrl: './client-list.component.html'
})
export class ClientListComponent implements OnInit {
    private clientService = inject(ClientService);
    private toastService = inject(ToastService);
    private fb = inject(FormBuilder);

    // Signals
    clients = signal<Client[]>([]);
    loading = signal(false);

    // Pagination
    currentPage = signal(1);
    itemsPerPage = signal(10);
    totalItems = signal(0);

    searchForm: FormGroup;
    protected Math = Math;

    constructor() {
        this.searchForm = this.fb.group({
            searchTerm: ['']
        });
    }

    ngOnInit() {
        this.loadClients();
    }

    loadClients() {
        this.loading.set(true);
        const params: any = {
            limit: this.itemsPerPage(),
            skip: (this.currentPage() - 1) * this.itemsPerPage(),
        };

        const searchValue = this.searchForm.get('searchTerm')?.value;
        if (searchValue) params.q = searchValue;

        this.clientService.getClients(params)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res: any) => {
                    if (res.success) {
                        this.clients.set(res.data.clients);
                        if (res.data.total !== undefined) {
                            this.totalItems.set(res.data.total);
                        }
                    } else {
                        this.clients.set([]);
                    }
                },
                error: (err) => {
                    console.error('Error loading clients', err);
                    this.toastService.error('Error al cargar clientes');
                }
            });
    }

    onPageChange(page: number) {
        this.currentPage.set(page);
        this.loadClients();
    }

    onLimitChange(limit: number) {
        this.itemsPerPage.set(Number(limit));
        this.currentPage.set(1);
        this.loadClients();
    }

    onSearch() {
        this.currentPage.set(1);
        this.loadClients();
    }

    deleteClient(clientId: string | undefined) {
        if (!clientId) return;

        if (confirm('¿Estás seguro de eliminar este cliente?')) {
            this.loading.set(true);
            this.clientService.deleteClient(clientId)
                .pipe(finalize(() => this.loading.set(false)))
                .subscribe({
                    next: () => {
                        this.toastService.success('Cliente eliminado');
                        this.loadClients();
                    },
                    error: () => this.toastService.error('Error al eliminar')
                });
        }
    }

    get totalPages(): number {
        return Math.ceil(this.totalItems() / this.itemsPerPage());
    }

    get pages(): number[] {
        return Array(this.totalPages).fill(0).map((x, i) => i + 1);
    }
}
