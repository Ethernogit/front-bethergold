import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupportService } from '../../../../services/support.service';

@Component({
    selector: 'app-roadmap-view',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './roadmap-view.component.html',
    styles: []
})
export class RoadmapViewComponent implements OnInit {
    items: any[] = [];
    isLoading = true;
    newItem = {
        title: '',
        description: '',
        status: 'planned'
    };
    isSubmitting = false;
    showForm = false;

    constructor(private supportService: SupportService) { }

    ngOnInit() {
        this.loadItems();
    }

    loadItems() {
        this.isLoading = true;
        this.supportService.getRoadmapItems().subscribe({
            next: (res) => {
                this.items = res.data;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading roadmap', err);
                this.isLoading = false;
            }
        });
    }

    createItem() {
        if (!this.newItem.title) return;

        this.isSubmitting = true;
        this.supportService.createRoadmapItem(this.newItem).subscribe({
            next: (res) => {
                this.items.push(res.data);
                this.newItem = { title: '', description: '', status: 'planned' };
                this.showForm = false;
                this.isSubmitting = false;
                this.loadItems(); // Reload to ensure order/consistency if needed
            },
            error: (err) => {
                console.error('Error creating item', err);
                this.isSubmitting = false;
            }
        });
    }

    getItemsByStatus(status: string) {
        return this.items.filter(item => item.status === status && item.isVisible);
    }
}
