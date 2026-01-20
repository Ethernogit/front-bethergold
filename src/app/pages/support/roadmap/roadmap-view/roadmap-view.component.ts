import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupportService } from '../../../../services/support.service';

@Component({
    selector: 'app-roadmap-view',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './roadmap-view.component.html',
    styles: []
})
export class RoadmapViewComponent implements OnInit {
    items: any[] = [];
    isLoading = true;

    constructor(private supportService: SupportService) { }

    ngOnInit() {
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

    getItemsByStatus(status: string) {
        return this.items.filter(item => item.status === status && item.isVisible);
    }
}
