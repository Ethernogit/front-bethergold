import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../../shared/services/inventory.service';

@Component({
    selector: 'app-inventory-summary-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './inventory-summary-modal.component.html'
})
export class InventorySummaryModalComponent implements OnChanges, OnInit {
    @Input() isOpen = false;
    @Input() filters: any = {};
    @Output() close = new EventEmitter<void>();

    private inventoryService = inject(InventoryService);

    loading = signal(true);
    stats = signal<any>(null);

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
            this.loadStats();
        }
    }

    ngOnInit() {
        if (this.isOpen) {
            this.loadStats();
        }
    }

    loadStats() {
        this.loading.set(true);
        console.log('Loading stats with filters:', this.filters);
        this.inventoryService.getInventoryStats(this.filters).subscribe({
            next: (res: any) => {
                this.stats.set(res.data);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading stats', err);
                this.loading.set(false);
            }
        });
    }
}
