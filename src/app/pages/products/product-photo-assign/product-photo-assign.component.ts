import { Component, OnDestroy, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, firstValueFrom, switchMap, of, catchError } from 'rxjs';
import { ProductService, Product, ProductImage } from '../../../shared/services/product.service';
import { ToastService } from '../../../shared/services/toast.service';
import { compressImage } from '../../../shared/utils/image-compress';

type Mode = 'upload' | 'existing';

/**
 * Una foto para varias piezas: las piezas iguales se dan de alta por separado (se venden
 * por peso), así que se les pone la misma foto de una vez. El archivo se guarda una sola
 * vez en R2 y las piezas lo comparten.
 */
@Component({
    selector: 'app-product-photo-assign',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './product-photo-assign.component.html'
})
export class ProductPhotoAssignComponent implements OnDestroy {
    private productService = inject(ProductService);
    private toastService = inject(ToastService);

    productIds = input.required<string[]>();
    close = output<void>();
    done = output<void>();

    mode = signal<Mode>('upload');
    primary = signal(true);
    saving = signal(false);

    // Foto nueva
    file = signal<Blob | null>(null);
    preview = signal<string | null>(null);
    preparing = signal(false);

    // Foto de otra pieza
    term = signal('');
    searching = signal(false);
    results = signal<Product[]>([]);
    selected = signal<{ productId: string; image: ProductImage } | null>(null);
    private search$ = new Subject<string>();
    private searchSub = this.search$.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(term => {
            if (term.trim().length < 2) return of([] as Product[]);
            this.searching.set(true);
            return this.productService.getProducts({ search: term.trim(), status: 'all', limit: 12 }).pipe(
                switchMap((res: any) => of(((res.data || []) as Product[]).filter(p => p.images?.length))),
                catchError(() => of([] as Product[]))
            );
        })
    ).subscribe(products => {
        this.results.set(products);
        this.searching.set(false);
    });

    ngOnDestroy() {
        this.searchSub.unsubscribe();
        const url = this.preview();
        if (url) URL.revokeObjectURL(url);
    }

    onSearch(term: string) {
        this.term.set(term);
        this.search$.next(term);
    }

    async onFile(event: Event) {
        const inputEl = event.target as HTMLInputElement;
        const picked = inputEl.files?.[0];
        inputEl.value = '';
        if (!picked) return;
        this.preparing.set(true);
        try {
            const blob = await compressImage(picked);
            const old = this.preview();
            if (old) URL.revokeObjectURL(old);
            this.file.set(blob);
            this.preview.set(URL.createObjectURL(blob));
        } catch (err) {
            this.toastService.error((err as Error).message);
        } finally {
            this.preparing.set(false);
        }
    }

    canSave(): boolean {
        return !this.saving() && (this.mode() === 'upload' ? !!this.file() : !!this.selected());
    }

    async save() {
        if (!this.canSave()) return;
        this.saving.set(true);
        try {
            const ids = this.productIds();
            const res = this.mode() === 'upload'
                ? await firstValueFrom(this.productService.uploadImage(ids, this.file()!, this.primary()))
                : await firstValueFrom(this.productService.assignImage(
                    this.selected()!.productId, this.selected()!.image._id, ids, this.primary()));
            const count = res.data.products.length;
            this.toastService.success(count === 1 ? 'Foto asignada a 1 pieza' : `Foto asignada a ${count} piezas`);
            this.done.emit();
        } catch (err) {
            const e = err as { error?: { error?: { message?: string }; message?: string } };
            this.toastService.error(e?.error?.error?.message || e?.error?.message || 'No se pudo asignar la foto');
        } finally {
            this.saving.set(false);
        }
    }
}
