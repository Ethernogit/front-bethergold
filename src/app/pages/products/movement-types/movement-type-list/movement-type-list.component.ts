import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MovementTypeService } from '../../../../shared/services/movement-type.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ModalService } from '../../../../shared/services/modal.service';
import { MovementTypeFormComponent } from '../movement-type-form/movement-type-form.component';

@Component({
    selector: 'app-movement-type-list',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, MovementTypeFormComponent],
    templateUrl: './movement-type-list.component.html'
})
export class MovementTypeListComponent implements OnInit {
    types: any[] = [];
    isLoading = false;
    searchControl = new FormControl('');

    // Modal State
    showModal = false;
    scrolled = false;
    selectedId: string | null = null;

    constructor(
        private service: MovementTypeService,
        private toast: ToastService,
        private modalService: ModalService // Assuming generic modal service exists or I handle manually
    ) { }

    ngOnInit() {
        this.loadTypes();
        this.setupSearch();
    }

    setupSearch() {
        this.searchControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(val => {
            this.loadTypes(val || '');
        });
    }

    loadTypes(q: string = '') {
        this.isLoading = true;
        this.service.getTypes({ q }).subscribe({
            next: (res: any) => {
                this.types = res.data;
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
                this.toast.error('Error al cargar tipos');
            }
        });
    }

    openModal(id: string | null = null) {
        this.selectedId = id;
        this.showModal = true;
    }

    closeModal(refresh: boolean = false) {
        this.showModal = false;
        this.selectedId = null;
        if (refresh) this.loadTypes();
    }

    deleteType(id: string) {
        if (!confirm('¿Estás seguro de eliminar este tipo?')) return;

        this.service.deleteType(id).subscribe({
            next: () => {
                this.toast.success('Eliminado correctamente');
                this.loadTypes();
            },
            error: () => this.toast.error('Error al eliminar')
        });
    }
}
