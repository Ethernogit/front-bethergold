
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ClientService } from '../../../shared/services/client.service';
import { ToastService } from '../../../shared/services/toast.service';
import { finalize } from 'rxjs';

import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { BehaviorSubject } from 'rxjs';

@Component({
    selector: 'app-client-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        PageBreadcrumbComponent,
        LabelComponent,
        InputFieldComponent
    ],
    templateUrl: './client-form.component.html'
})
export class ClientFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private clientService = inject(ClientService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private toastService = inject(ToastService);

    clientForm: FormGroup;
    isEditMode = signal(false);
    loading = signal(false);
    clientId: string | null = null;
    submitted = false;
    errorSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

    constructor() {
        this.clientForm = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(100)]],
            type: ['individual', Validators.required],
            taxId: ['', [Validators.maxLength(20)]],
            email: ['', [Validators.email]],
            phone: ['', [Validators.maxLength(20)]],
            status: ['active', Validators.required],
            address: this.fb.group({
                street: [''],
                city: [''],
                state: [''],
                country: [''],
                zipCode: ['']
            }),
            creditLimit: [0, [Validators.min(0)]],
            isWholesale: [false],
            notes: ['', [Validators.maxLength(1000)]]
        });
    }

    ngOnInit() {
        this.clientId = this.route.snapshot.paramMap.get('id');
        if (this.clientId) {
            this.isEditMode.set(true);
            this.loadClient(this.clientId);
        }
    }

    loadClient(id: string) {
        this.loading.set(true);
        this.clientService.getClient(id)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res: any) => {
                    if (res.success) {
                        this.clientForm.patchValue(res.data);
                    }
                },
                error: (err) => {
                    this.toastService.error('Error al cargar cliente');
                    this.router.navigate(['/clients']);
                }
            });
    }

    onSubmit() {
        this.submitted = true;
        if (this.clientForm.invalid) return;

        this.loading.set(true);
        const clientData = this.clientForm.value;

        const request$ = this.isEditMode()
            ? this.clientService.updateClient(this.clientId!, clientData)
            : this.clientService.createClient(clientData);

        request$
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: () => {
                    this.toastService.success(
                        `Cliente ${this.isEditMode() ? 'actualizado' : 'creado'} correctamente`
                    );
                    this.router.navigate(['/clients']);
                },
                error: (err) => {
                    console.error(err);
                    this.toastService.error('Error al guardar cliente');
                }
            });
    }
}
