import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '../../../shared/services/toast.service';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { PricingRuleService, PricingRule } from '../../../shared/services/pricing-rule.service';

@Component({
  selector: 'app-pricing-rules',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageBreadcrumbComponent],
  templateUrl: './pricing-rules.component.html',
  styleUrl: './pricing-rules.component.css'
})
export class PricingRulesComponent implements OnInit {
  private pricingService = inject(PricingRuleService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  rules: PricingRule[] = [];
  isLoading = true;
  isSubmitting = false;

  showForm = false;
  ruleForm: FormGroup;
  editingRuleId: string | null = null;

  constructor() {
    this.ruleForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      clientType: ['wholesale', Validators.required],
      criteriaType: ['CATEGORY', Validators.required],
      criteriaValue: ['', Validators.required],
      ruleType: ['DISCOUNT_PERCENTAGE', Validators.required],
      ruleValue: [0, [Validators.required, Validators.min(0)]],
      priority: [0, Validators.required],
      active: [true]
    });
  }

  ngOnInit(): void {
    this.loadRules();
  }

  loadRules(): void {
    this.isLoading = true;
    this.pricingService.getPricingRules().subscribe({
      next: (res: any) => {
        this.rules = res.data;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading rules', err);
        this.toastService.error('Error al cargar reglas de precio');
        this.isLoading = false;
      }
    });
  }

  openCreateForm(): void {
    this.ruleForm.reset({
      clientType: 'wholesale',
      criteriaType: 'CATEGORY',
      ruleType: 'DISCOUNT_PERCENTAGE',
      ruleValue: 0,
      priority: 0,
      active: true
    });
    this.editingRuleId = null;
    this.showForm = true;
  }

  openEditForm(rule: PricingRule): void {
    this.editingRuleId = rule._id || null;
    this.ruleForm.patchValue({
      name: rule.name,
      description: rule.description,
      clientType: rule.clientType,
      criteriaType: rule.criteriaType,
      criteriaValue: rule.criteriaValue,
      ruleType: rule.ruleType,
      ruleValue: rule.ruleValue,
      priority: rule.priority,
      active: rule.active
    });
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingRuleId = null;
  }

  onSubmit(): void {
    if (this.ruleForm.invalid) {
      this.ruleForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const ruleData: PricingRule = this.ruleForm.value;

    if (this.editingRuleId) {
      this.pricingService.updatePricingRule(this.editingRuleId, ruleData).subscribe({
        next: () => {
          this.toastService.success('Regla actualizada correctamente');
          this.loadRules();
          this.closeForm();
          this.isSubmitting = false;
        },
        error: (err: any) => {
          this.toastService.error(err.error?.message || 'Error al actualizar regla');
          this.isSubmitting = false;
        }
      });
    } else {
      this.pricingService.createPricingRule(ruleData).subscribe({
        next: () => {
          this.toastService.success('Regla creada correctamente');
          this.loadRules();
          this.closeForm();
          this.isSubmitting = false;
        },
        error: (err: any) => {
          this.toastService.error(err.error?.message || 'Error al crear regla');
          this.isSubmitting = false;
        }
      });
    }
  }

  toggleRuleStatus(rule: PricingRule): void {
    if (!rule._id) return;

    const updatedData = { active: !rule.active };
    this.pricingService.updatePricingRule(rule._id, updatedData as any).subscribe({
      next: () => {
        rule.active = !rule.active;
        this.toastService.success(rule.active ? 'Regla activada' : 'Regla desactivada');
      },
      error: () => {
        this.toastService.error('Error al cambiar el estado de la regla');
      }
    });
  }

  deleteRule(rule: PricingRule): void {
    if (!rule._id) return;

    if (confirm(`¿Estás seguro de eliminar la regla "${rule.name}"?`)) {
      this.pricingService.deletePricingRule(rule._id).subscribe({
        next: () => {
          this.toastService.success('Regla eliminada');
          this.loadRules();
        },
        error: () => {
          this.toastService.error('Error al eliminar la regla');
        }
      });
    }
  }
}
