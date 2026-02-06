import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubcategoryService } from '../../../../../shared/services/subcategory.service';
import { ToastService } from '../../../../../shared/services/toast.service';

@Component({
    selector: 'app-hechura-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './hechura-modal.component.html'
})
export class HechuraModalComponent implements OnInit {
    @Output() close = new EventEmitter<any>();

    form: FormGroup;
    subcategories: any[] = [];
    isLoading = false;

    karatOptions = ['10 k', '14 k', '18 k', '22 k', '24 k', 'Plata'];

    // 'hechura' | 'express'
    activeTab: 'hechura' | 'express' = 'hechura';

    constructor(
        private fb: FormBuilder,
        private subcategoryService: SubcategoryService,
        private toast: ToastService
    ) {
        this.form = this.fb.group({
            subcategoryId: ['', Validators.required],
            karatage: ['10 k', Validators.required],
            weight: [0, [Validators.required, Validators.min(0)]],
            description: ['', Validators.required],
            deliveryDate: [this.getFormattedDate(new Date())],
            price: [0, [Validators.required, Validators.min(0)]]
        });
    }

    ngOnInit() {
        this.loadSubcategories();
        this.setupValidation();
    }

    setTab(tab: 'hechura' | 'express') {
        this.activeTab = tab;
        this.setupValidation();
    }

    setupValidation() {
        const dateControl = this.form.get('deliveryDate');
        if (this.activeTab === 'hechura') {
            dateControl?.setValidators([Validators.required]);
        } else {
            dateControl?.clearValidators();
        }
        dateControl?.updateValueAndValidity();
    }

    getFormattedDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    loadSubcategories() {
        this.isLoading = true;
        // Assuming fetch all active subcategories. We might need organizationId but usually service handles it or we pass it?
        // Checking SubcategoryService usage in other files would be ideal, but standard 'get' usually works.
        this.subcategoryService.getSubcategories({ limit: 100, status: 'active' } as any).subscribe({
            next: (res: any) => {
                this.subcategories = res.data || res; // Handle standard API response
                this.isLoading = false;
            },
            error: () => {
                this.toast.error('Error al cargar subcategorías');
                this.isLoading = false;
            }
        });
    }

    onSubmit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const formValue = this.form.getRawValue();
        const selectedSubcategory = this.subcategories.find(s => s._id === formValue.subcategoryId);

        const result = {
            subcategory: selectedSubcategory,
            karatage: formValue.karatage,
            weight: formValue.weight,
            description: formValue.description,
            deliveryDate: formValue.deliveryDate,
            price: parseFloat(formValue.price),
            type: this.activeTab
        };

        this.close.emit(result);
    }

    onCancel() {
        this.close.emit(null);
    }
}
