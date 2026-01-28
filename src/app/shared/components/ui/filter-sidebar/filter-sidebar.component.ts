import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

export interface FilterOption {
    value: string | number | boolean;
    label: string;
}

export interface FilterConfig {
    key: string;
    label: string;
    type: 'select' | 'text' | 'number' | 'date';
    options?: FilterOption[];
    placeholder?: string;
    defaultValue?: any;
}

@Component({
    selector: 'app-filter-sidebar',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './filter-sidebar.component.html'
})
export class FilterSidebarComponent implements OnChanges {
    private fb = inject(FormBuilder);

    // Signals for Inputs
    isOpen = signal(false);
    title = signal('Filtros');
    filters = signal<FilterConfig[]>([]);

    // Inputs (Mapped to Signals for easier usage if needed, or straight usage)
    @Input({ alias: 'isOpen' }) set _isOpen(val: boolean) {
        this.isOpen.set(val);
    }
    @Input({ alias: 'title' }) set _title(val: string) {
        this.title.set(val);
    }
    @Input({ alias: 'filters' }) set _filters(val: FilterConfig[]) {
        this.filters.set(val);
        if (Object.keys(this.filterForm.controls).length === 0) {
            this.initForm();
        } else {
            this.updateForm(val);
        }
    }

    @Output() close = new EventEmitter<void>();
    @Output() apply = new EventEmitter<any>();
    @Output() valueChange = new EventEmitter<any>();

    filterForm: FormGroup = this.fb.group({});

    ngOnChanges(changes: SimpleChanges): void {
        // Handled by setters/signals mainly
    }

    private initForm() {
        const group: any = {};
        this.filters().forEach(filter => {
            group[filter.key] = [filter.defaultValue || ''];
        });
        this.filterForm = this.fb.group(group);

        // Listen to changes
        this.filterForm.valueChanges.subscribe(val => {
            this.valueChange.emit(val);
        });
    }

    private updateForm(newFilters: FilterConfig[]) {
        const currentControls = this.filterForm.controls;

        // Add new controls
        newFilters.forEach(filter => {
            if (!currentControls[filter.key]) {
                this.filterForm.addControl(filter.key, this.fb.control(filter.defaultValue || ''));
            }
        });

        // Remove old controls? (Optional, maybe we want to keep them if hidden)
        // For now, let's keep it simple and only add. 
        // If we strictly want to match config:
        /*
        Object.keys(currentControls).forEach(key => {
            if (!newFilters.find(f => f.key === key)) {
                this.filterForm.removeControl(key);
            }
        });
        */
    }

    onClose() {
        this.close.emit();
    }

    onClear() {
        this.filterForm.reset();
        // Determine if we should apply immediately or wait for user to click Apply
        // Usually "Clear" just resets the form. 
        // If we want to clear the actual list, user should probably click Apply after clearing?
        // Or we can auto-apply. Let's auto-apply for better UX on "Clear".
        this.apply.emit({});
    }

    onApply() {
        const formValue = this.filterForm.value;
        // Remove empty values
        const cleanValues: any = {};
        Object.keys(formValue).forEach(key => {
            if (formValue[key] !== '' && formValue[key] !== null && formValue[key] !== undefined) {
                cleanValues[key] = formValue[key];
            }
        });
        this.apply.emit(cleanValues);
        this.close.emit();
    }
}
