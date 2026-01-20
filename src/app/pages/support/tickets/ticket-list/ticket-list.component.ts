import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupportService } from '../../../../services/support.service';
import { TicketCreateComponent } from '../ticket-create/ticket-create.component';

@Component({
    selector: 'app-ticket-list',
    standalone: true,
    imports: [CommonModule, TicketCreateComponent],
    templateUrl: './ticket-list.component.html',
    styles: []
})
export class TicketListComponent implements OnInit {
    tickets: any[] = [];
    isLoading = true;
    showCreateModal = false;
    currentPage = 1;
    totalPages = 1;

    constructor(private supportService: SupportService) { }

    ngOnInit() {
        this.loadTickets();
    }

    loadTickets() {
        this.isLoading = true;
        this.supportService.getTickets(this.currentPage).subscribe({
            next: (res) => {
                this.tickets = res.data.tickets;
                this.totalPages = res.data.totalPages;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading tickets', err);
                this.isLoading = false;
            }
        });
    }

    openCreateModal() {
        this.showCreateModal = true;
    }

    closeCreateModal(created: boolean) {
        this.showCreateModal = false;
        if (created) {
            this.loadTickets(); // Refresh list
        }
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'open': return 'bg-success/10 text-success';
            case 'in_progress': return 'bg-warning/10 text-warning';
            case 'resolved': return 'bg-primary/10 text-primary';
            case 'closed': return 'bg-danger/10 text-danger';
            default: return 'bg-gray-100 text-gray-600';
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'open': return 'Abierto';
            case 'in_progress': return 'En Proceso';
            case 'resolved': return 'Resuelto';
            case 'closed': return 'Cerrado';
            default: return status;
        }
    }
}
