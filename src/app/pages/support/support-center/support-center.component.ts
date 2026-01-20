import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TicketListComponent } from '../tickets/ticket-list/ticket-list.component';
import { RoadmapViewComponent } from '../roadmap/roadmap-view/roadmap-view.component';

@Component({
    selector: 'app-support-center',
    standalone: true,
    imports: [CommonModule, RouterModule, TicketListComponent, RoadmapViewComponent],
    templateUrl: './support-center.component.html',
    styles: []
})
export class SupportCenterComponent {
    activeTab: 'tickets' | 'roadmap' = 'tickets';

    setActiveTab(tab: 'tickets' | 'roadmap') {
        this.activeTab = tab;
    }
}
