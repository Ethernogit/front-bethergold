import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProviderService } from '../../shared/services/provider.service';
import { ToastService } from '../../shared/services/toast.service';
import {
  Provider,
  ProviderType,
  MaterialType,
  ProviderStatus,
  PaymentTerms,
  CreateProviderRequest,
  UpdateProviderRequest,
  ProviderFilters,
  ProviderTableItem
} from '../../shared/interfaces/provider.interfaces';
import { finalize } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { SubcategoryService } from '../../shared/services/subcategory.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-providers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './providers.component.html',
  styleUrl: './providers.component.css'
})
export class ProvidersComponent implements OnInit {
  private providerService = inject(ProviderService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private subcategoryService = inject(SubcategoryService);
  private http = inject(HttpClient);

  // Signals for reactive state
  providers = signal<ProviderTableItem[]>([]);
  providerTypes = signal<ProviderType[]>([]);
  materialTypes = signal<MaterialType[]>([]);
  loading = signal(false);
  showModal = signal(false);
  showDeleteModal = signal(false);
  showPriceModal = signal(false);
  editingProvider = signal<Provider | null>(null);
  deletingProvider = signal<Provider | null>(null);
  pricingProvider = signal<Provider | null>(null);
  currentProviderPrices = signal<any[]>([]);

  // Rule Signals
  showRulesModal = signal(false);
  rules = signal<any[]>([]);
  subcategories = signal<any[]>([]);
  ruleForm: FormGroup;

  // Forms
  providerForm: FormGroup;
  priceForm: FormGroup;
  searchForm: FormGroup;

  // Constants
  readonly ProviderStatus = ProviderStatus;
  readonly PaymentTerms = PaymentTerms;
  readonly paymentTermsOptions = [
    { value: PaymentTerms.CASH, label: 'Contado' },
    { value: PaymentTerms.CREDIT_7, label: 'Crédito 7 días' },
    { value: PaymentTerms.CREDIT_15, label: 'Crédito 15 días' },
    { value: PaymentTerms.CREDIT_30, label: 'Crédito 30 días' },
    { value: PaymentTerms.CREDIT_60, label: 'Crédito 60 días' },
    { value: PaymentTerms.CREDIT_90, label: 'Crédito 90 días' }
  ];

  constructor() {
    this.providerForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      code: ['', [Validators.required, Validators.maxLength(20)]],
      providerTypeId: ['', Validators.required],
      profitMargin: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      paymentTerms: [PaymentTerms.CASH],
      creditDays: [0, [Validators.min(0)]],
      notes: ['', Validators.maxLength(1000)],
      // Contact
      contactName: ['', Validators.maxLength(100)],
      contactEmail: ['', [Validators.email, Validators.maxLength(100)]],
      contactPhone: ['', Validators.maxLength(20)],
      contactMobile: ['', Validators.maxLength(20)],
      // Address
      street: [''],
      city: [''],
      state: [''],
      country: ['México'],
      zipCode: [''],
      // Tax
      rfc: ['', [Validators.maxLength(13), Validators.pattern(/^[A-ZÑ&]{3,4}\d{6}(?:[A-Z\d]{3})?$/)]],
      businessName: ['', Validators.maxLength(200)]
    });

    this.priceForm = this.fb.group({
      subcategoryId: [''], // Opcional
      materialTypeId: ['', Validators.required],
      pricePerGram: [0, [Validators.required, Validators.min(0.01)]],
      profitMargin: [0, [Validators.required, Validators.min(0), Validators.max(100)]]
    });

    this.searchForm = this.fb.group({
      search: [''],
      status: [''],
      providerTypeId: ['']
    });

    this.ruleForm = this.fb.group({
      subcategoryId: ['', Validators.required],
      providerTypeId: ['', Validators.required],
      price10k: [0, [Validators.required, Validators.min(0)]],
      price14k: [0, [Validators.required, Validators.min(0)]],
      price18k: [0, [Validators.required, Validators.min(0)]],
      profitMargin: [0, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  ngOnInit() {
    this.loadInitialData();
  }

  private loadInitialData() {
    this.loadProviders();
    this.loadProviderTypes();
    this.loadMaterialTypes();
    this.loadSubcategories();
  }

  loadSubcategories() {
    this.subcategoryService.getSubcategories().subscribe({
      next: (res: any) => {
        this.subcategories.set(res.data || res);
      },
      error: (err) => console.error('Error loading subcategories', err)
    });
  }

  loadProviders() {
    this.loading.set(true);
    const filters: ProviderFilters = {};

    const searchValue = this.searchForm.get('search')?.value;
    const statusValue = this.searchForm.get('status')?.value;
    const providerTypeValue = this.searchForm.get('providerTypeId')?.value;

    if (searchValue) filters.search = searchValue;
    if (statusValue) filters.status = statusValue;
    if (providerTypeValue) filters.providerTypeId = providerTypeValue;

    this.providerService.getProviders(filters)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success) {
            const transformedProviders = response.data.map(provider => ({
              ...provider,
              id: provider._id || provider.id || '',
              // Handle populated fields
              providerTypeId: (provider.providerTypeId as any)?._id || (provider.providerTypeId as any)?.id || provider.providerTypeId,
              sucursalId: (provider.sucursalId as any)?._id || (provider.sucursalId as any)?.id || provider.sucursalId,
              // Extract names from populated fields
              providerTypeName: (provider.providerTypeId as any)?.name || 'N/A',
              sucursalName: (provider.sucursalId as any)?.name || 'N/A',
              finalProfitMargin: `${provider.profitMargin}%`,
              contactInfo: provider.contact?.name || provider.contact?.email || 'N/A',
              statusDisplay: this.providerService.getStatusDisplay(provider.status)
            }));
            this.providers.set(transformedProviders);
          }
        },
        error: (error) => {
          console.error('Error loading providers:', error);
          console.error('Error loading providers:', error);
          this.toastService.error('Error al cargar los proveedores');
        }
      });
  }

  loadProviderTypes() {
    this.providerService.getProviderTypes() // Remove filter to show all types
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.providerTypes.set(response.data);
          }
        },
        error: (error) => {
          console.error('Error loading provider types:', error);
        }
      });
  }

  loadMaterialTypes() {
    this.providerService.getMaterialTypes({ status: 'active' })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.materialTypes.set(response.data);
          }
        },
        error: (error) => {
          console.error('Error loading material types:', error);
        }
      });
  }

  // =============== PROVIDER CRUD OPERATIONS ===============

  openCreateModal() {
    this.editingProvider.set(null);
    this.providerForm.reset({
      paymentTerms: PaymentTerms.CASH,
      creditDays: 0,
      country: 'México',
      profitMargin: 0
    });
    this.showModal.set(true);
  }

  openEditModal(provider: Provider) {
    this.editingProvider.set(provider);
    this.providerForm.patchValue({
      name: provider.name,
      code: provider.code,
      providerTypeId: typeof provider.providerTypeId === 'object' ? (provider.providerTypeId as any)._id || (provider.providerTypeId as any).id : provider.providerTypeId,
      profitMargin: provider.profitMargin,
      paymentTerms: provider.paymentTerms,
      creditDays: provider.creditDays,
      notes: provider.notes,
      contactName: provider.contact?.name || '',
      contactEmail: provider.contact?.email || '',
      contactPhone: provider.contact?.phone || '',
      contactMobile: provider.contact?.mobile || '',
      street: provider.address?.street || '',
      city: provider.address?.city || '',
      state: provider.address?.state || '',
      country: provider.address?.country || 'México',
      zipCode: provider.address?.zipCode || '',
      rfc: provider.tax?.rfc || '',
      businessName: provider.tax?.businessName || ''
    });
    this.showModal.set(true);
  }

  saveProvider() {
    if (this.providerForm.invalid) {
      this.markFormGroupTouched(this.providerForm);
      return;
    }

    const formData = this.providerForm.value;
    const baseProviderData = {
      name: formData.name,
      code: formData.code,
      providerTypeId: formData.providerTypeId,
      profitMargin: formData.profitMargin,
      paymentTerms: formData.paymentTerms,
      creditDays: formData.creditDays,
      notes: formData.notes,
      contact: {
        name: formData.contactName,
        email: formData.contactEmail,
        phone: formData.contactPhone,
        mobile: formData.contactMobile
      },
      address: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        zipCode: formData.zipCode
      },
      tax: {
        rfc: formData.rfc,
        businessName: formData.businessName
      }
    };

    this.loading.set(true);
    const operation = this.editingProvider()
      ? this.providerService.updateProvider(this.editingProvider()!.id!, baseProviderData as UpdateProviderRequest)
      : this.providerService.createProvider(baseProviderData as CreateProviderRequest);

    operation
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.closeModal();
            this.loadProviders();
            this.closeModal();
            this.loadProviders();
            this.toastService.success(
              this.editingProvider()
                ? 'Proveedor actualizado exitosamente'
                : 'Proveedor creado exitosamente'
            );
          }
        },
        error: (error) => {
          console.error('Error saving provider:', error);
          this.toastService.error('Error al guardar el proveedor');
        }
      });
  }

  openDeleteModal(provider: Provider) {
    this.deletingProvider.set(provider);
    this.showDeleteModal.set(true);
  }

  confirmDelete() {
    const provider = this.deletingProvider();
    if (!provider) return;

    this.loading.set(true);
    this.providerService.deleteProvider(provider.id!)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showDeleteModal.set(false);
            this.deletingProvider.set(null);
            this.loadProviders();
            this.showDeleteModal.set(false);
            this.deletingProvider.set(null);
            this.loadProviders();
            this.toastService.success('Proveedor eliminado exitosamente');
          }
        },
        error: (error) => {
          console.error('Error deleting provider:', error);
          this.toastService.error('Error al eliminar el proveedor');
        }
      });
  }

  // =============== PRICE MANAGEMENT ===============

  openPriceModal(provider: Provider) {
    this.pricingProvider.set(provider);
    this.loadProviderPrices(provider.id!);
    this.priceForm.reset({
      profitMargin: provider.profitMargin || 0
    });
    this.showPriceModal.set(true);
  }

  loadProviderPrices(providerId: string) {
    this.providerService.getProviderPrices(providerId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.currentProviderPrices.set(response.data);
          }
        },
        error: (error) => {
          console.error('Error loading provider prices:', error);
        }
      });
  }

  addPrice() {
    if (this.priceForm.invalid) {
      this.markFormGroupTouched(this.priceForm);
      return;
    }

    const provider = this.pricingProvider();
    if (!provider) return;

    const priceData = this.priceForm.value;
    this.loading.set(true);

    this.providerService.setProviderPrice(provider.id!, priceData)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.priceForm.reset();
            this.loadProviderPrices(provider.id!);
            this.priceForm.reset();
            this.loadProviderPrices(provider.id!);
            this.toastService.success('Precio agregado exitosamente');
          }
        },
        error: (error) => {
          console.error('Error adding price:', error);
          this.toastService.error('Error al agregar el precio');
        }
      });
  }

  deletePrice(priceId: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar este precio?')) {
      return;
    }

    this.providerService.deleteProviderPrice(priceId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            const provider = this.pricingProvider();
            if (provider) {
              this.loadProviderPrices(provider.id!);
            }
            if (provider) {
              this.loadProviderPrices(provider.id!);
            }
            this.toastService.success('Precio eliminado exitosamente');
          }
        },
        error: (error) => {
          console.error('Error deleting price:', error);
          this.toastService.error('Error al eliminar el precio');
        }
      });
  }

  calculateFinalPrice(pricePerGram: number, profitMargin?: number): number {
    const provider = this.pricingProvider();
    if (!provider) return 0;

    // Si se proporciona un margen específico (del precio), usarlo. Si no, usar el del proveedor.
    const margin = profitMargin !== undefined ? profitMargin : provider.profitMargin;
    return this.providerService.calculateFinalPrice(pricePerGram, margin);
  }

  // =============== RULES MANAGEMENT ===============

  openRulesModal() {
    this.showRulesModal.set(true);
    this.loadRules();
    this.ruleForm.reset({
      price10k: 0,
      price14k: 0,
      price18k: 0,
      profitMargin: 0
    });
  }

  closeRulesModal() {
    this.showRulesModal.set(false);
  }

  loadRules() {
    this.http.get<any>(`${environment.apiUrl}/providers/rules`).subscribe({
      next: (res) => {
        if (res.success) {
          this.rules.set(res.data);
        }
      },
      error: (err) => console.error('Error loading rules', err)
    });
  }

  saveRule() {
    if (this.ruleForm.invalid) {
      this.ruleForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const val = this.ruleForm.value;
    const payload = {
      providerTypeId: val.providerTypeId,
      subcategoryId: val.subcategoryId,
      prices: {
        k10: val.price10k,
        k14: val.price14k,
        k18: val.price18k
      },
      profitMargin: val.profitMargin
    };

    this.http.post<any>(`${environment.apiUrl}/providers/rules`, payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.success('Regla guardada exitosamente');
            this.ruleForm.reset({
              price10k: 0,
              price14k: 0,
              price18k: 0,
              profitMargin: 0
            });
            this.loadRules();
          }
        },
        error: (err) => {
          console.error('Error saving rule', err);
          this.toastService.error(err.error?.message || 'Error al guardar la regla');
        }
      });
  }

  deleteRule(rule: any) {
    if (!confirm('¿Eliminar esta regla?')) return;

    this.http.delete<any>(`${environment.apiUrl}/providers/rules/${rule._id}`)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.success('Regla eliminada');
            this.loadRules();
          }
        },
        error: (err) => this.toastService.error('Error al eliminar')
      });
  }

  // =============== UTILITY METHODS ===============

  onSearch() {
    this.loadProviders();
  }

  resetFilters() {
    this.searchForm.reset();
    this.loadProviders();
  }

  closeModal() {
    this.showModal.set(false);
    this.editingProvider.set(null);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.deletingProvider.set(null);
  }

  closePriceModal() {
    this.showPriceModal.set(false);
    this.pricingProvider.set(null);
    this.currentProviderPrices.set([]);
  }

  getStatusClass(status: string): string {
    return this.providerService.getStatusClass(status);
  }

  getPaymentTermsDisplay(paymentTerms: string): string {
    return this.providerService.getPaymentTermsDisplay(paymentTerms);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string, form: FormGroup = this.providerForm): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string, form: FormGroup = this.providerForm): string {
    const field = form.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Este campo es requerido';
      if (field.errors['email']) return 'Email inválido';
      if (field.errors['maxlength']) return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      if (field.errors['min']) return `Valor mínimo: ${field.errors['min'].min}`;
      if (field.errors['max']) return `Valor máximo: ${field.errors['max'].max}`;
      if (field.errors['pattern']) return 'Formato inválido';
    }
    return '';
  }
}
