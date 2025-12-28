import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError, map } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { ClientService, Client } from '../../../../../shared/services/client.service';

@Component({
    selector: 'app-client-selection-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './client-selection-modal.component.html'
})
export class ClientSelectionModalComponent implements OnInit {
    @Output() select = new EventEmitter<Client>();
    @Output() close = new EventEmitter<void>();

    view: 'search' | 'create' = 'search';
    searchControl = new FormControl('');

    // Search Results
    searchResults$: Observable<Client[]>;
    isLoadingSearch = false;

    // Create Form
    createForm: FormGroup;
    isCreating = false;

    constructor(
        private clientService: ClientService,
        private fb: FormBuilder
    ) {
        this.createForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            phone: [''],
            email: ['', [Validators.email]],
            type: ['individual']
        });

        // Setup Search Stream
        this.searchResults$ = this.searchControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(term => {
                if (!term || term.length < 2) return of([]);
                this.isLoadingSearch = true;
                return this.clientService.getClients({ search: term }).pipe(
                    map((response: any) => {
                        // Backend returns { success: true, data: { clients: [], total: ... } }
                        // Or sometimes plain array if service was different, but controller confirms nested
                        if (response.data && Array.isArray(response.data.clients)) {
                            return response.data.clients;
                        }
                        if (Array.isArray(response.data)) {
                            return response.data;
                        }
                        return [];
                    }),
                    catchError(() => of([])),
                    map(results => {
                        this.isLoadingSearch = false;
                        return results;
                    })
                );
            })
        );
    }

    ngOnInit() {
        // Focus search on open
    }

    onSelect(client: Client) {
        this.select.emit(client);
    }

    toggleView() {
        this.view = this.view === 'search' ? 'create' : 'search';
        if (this.view === 'create') {
            const searchTerm = this.searchControl.value;
            if (searchTerm) {
                this.createForm.patchValue({ name: searchTerm });
            }
        }
    }

    onSubmitCreate() {
        if (this.createForm.invalid) {
            this.createForm.markAllAsTouched();
            return;
        }

        this.isCreating = true;
        const newClient: Partial<Client> = {
            ...this.createForm.value,
            status: 'active'
        };

        this.clientService.createClient(newClient).subscribe({
            next: (client: Client) => {
                this.isCreating = false;
                this.select.emit(client);
            },
            error: (err: any) => {
                console.error('Error creating client', err);
                this.isCreating = false;
            }
        });
    }

    onCancel() {
        this.close.emit();
    }
}
