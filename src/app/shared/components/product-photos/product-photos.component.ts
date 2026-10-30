import { Component, inject, input, linkedSignal, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ProductService, ProductImage } from '../../services/product.service';
import { ToastService } from '../../services/toast.service';
import { compressImage } from '../../utils/image-compress';

interface PendingPhoto {
    blob: Blob;
    preview: string;
}

/**
 * Fotos de una pieza. Con `productId` cada cambio se guarda al momento; sin él (pieza
 * nueva) las fotos esperan a que la pieza se dé de alta y el formulario llama a `uploadPending`.
 */
@Component({
    selector: 'app-product-photos',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './product-photos.component.html'
})
export class ProductPhotosComponent {
    private productService = inject(ProductService);
    private toastService = inject(ToastService);

    productId = input<string | null>(null);
    initialImages = input<ProductImage[] | undefined>([], { alias: 'images' });
    changed = output<void>();

    images = linkedSignal(() => this.initialImages() ?? []);
    pending = signal<PendingPhoto[]>([]);
    busyText = signal<string | null>(null);
    confirmingRemoveId = signal<string | null>(null);

    async onFiles(event: Event) {
        const inputEl = event.target as HTMLInputElement;
        const files = Array.from(inputEl.files ?? []);
        inputEl.value = '';
        if (files.length === 0) return;

        for (const [index, file] of files.entries()) {
            this.busyText.set(files.length > 1 ? `Subiendo ${index + 1} de ${files.length}…` : 'Subiendo…');
            try {
                const blob = await compressImage(file);
                const productId = this.productId();
                if (!productId) {
                    this.pending.update(list => [...list, { blob, preview: URL.createObjectURL(blob) }]);
                    continue;
                }
                const res = await firstValueFrom(this.productService.uploadImage([productId], blob));
                this.images.set(res.data.products[0]?.images ?? this.images());
                this.changed.emit();
            } catch (err) {
                this.toastService.error(this.errorMessage(err, 'No se pudo subir la foto'));
            }
        }
        this.busyText.set(null);
    }

    async setPrimary(image: ProductImage) {
        const productId = this.productId();
        if (!productId || image.isPrimary) return;
        try {
            const res = await firstValueFrom(this.productService.setPrimaryImage(productId, image._id));
            this.images.set(res.data.product.images);
            this.changed.emit();
        } catch (err) {
            this.toastService.error(this.errorMessage(err, 'No se pudo cambiar la foto principal'));
        }
    }

    /** Primer clic pide confirmación; el segundo quita la foto */
    async remove(image: ProductImage) {
        const productId = this.productId();
        if (!productId) return;
        if (this.confirmingRemoveId() !== image._id) {
            this.confirmingRemoveId.set(image._id);
            return;
        }
        this.confirmingRemoveId.set(null);
        try {
            const res = await firstValueFrom(this.productService.removeImage(productId, image._id));
            this.images.set(res.data.product.images);
            this.changed.emit();
        } catch (err) {
            this.toastService.error(this.errorMessage(err, 'No se pudo quitar la foto'));
        }
    }

    removePending(index: number) {
        this.pending.update(list => {
            URL.revokeObjectURL(list[index].preview);
            return list.filter((_, i) => i !== index);
        });
    }

    /** Sube las fotos elegidas antes de dar de alta la pieza; regresa cuántas fallaron */
    async uploadPending(productId: string): Promise<number> {
        let failed = 0;
        for (const photo of this.pending()) {
            try {
                await firstValueFrom(this.productService.uploadImage([productId], photo.blob));
            } catch {
                failed++;
            }
            URL.revokeObjectURL(photo.preview);
        }
        this.pending.set([]);
        return failed;
    }

    private errorMessage(err: unknown, fallback: string): string {
        const e = err as { error?: { error?: { message?: string }; message?: string }; message?: string };
        return e?.error?.error?.message || e?.error?.message || e?.message || fallback;
    }
}
