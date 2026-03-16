import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ClientService } from '../../../shared/services/client.service';
import { NoteService, Note } from '../../../shared/services/note.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

@Component({
  selector: 'app-client-details',
  standalone: true,
  imports: [CommonModule, RouterModule, PageBreadcrumbComponent],
  templateUrl: './client-details.component.html',
  styleUrl: './client-details.component.css'
})
export class ClientDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private clientService = inject(ClientService);
  private noteService = inject(NoteService);
  private toastService = inject(ToastService);

  clientId: string | null = null;
  client: any = null;

  // Consignments
  consignments: Note[] = [];
  isLoadingConsignments = false;
  activeTab: 'info' | 'consignments' = 'consignments';

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id');
    if (this.clientId) {
      this.loadClientData();
      this.loadConsignments();
    }
  }

  loadClientData(): void {
    this.clientService.getClient(this.clientId!).subscribe({
      next: (res: any) => {
        this.client = res.data;
      },
      error: (err: any) => {
        console.error('Error loading client details:', err);
        this.toastService.error('Error al cargar datos del cliente');
      }
    });
  }

  loadConsignments(): void {
    this.isLoadingConsignments = true;
    this.noteService.getNotes({ clientId: this.clientId!, type: 'consignment' }).subscribe({
      next: (res: any) => {
        this.consignments = res.data || [];
        this.isLoadingConsignments = false;
      },
      error: (err: any) => {
        console.error('Error loading consignments:', err);
        this.isLoadingConsignments = false;
      }
    });
  }

  setTab(tab: 'info' | 'consignments'): void {
    this.activeTab = tab;
  }

  goToSettlement(noteId: string | undefined): void {
    if (noteId) {
      this.router.navigate(['/sales/consignment-settlement', noteId]).then(success => {
        if (!success) {
          console.error('Navigation to settlement failed');
        }
      }).catch(err => {
        console.error('Navigation error:', err);
      });
    }
  }
}
