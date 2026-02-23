import { Injectable } from '@angular/core';
import { driver, DriveStep } from 'driver.js';


@Injectable({
    providedIn: 'root'
})
export class TourService {
    private driverObj: any;
    private isTourActive = false;

    constructor() {
        this.driverObj = driver({
            showProgress: true,
            animate: true,
            allowClose: true,
            doneBtnText: 'Finalizar',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            onDestroyStarted: () => {
                this.isTourActive = false;
                this.driverObj.destroy();
            },
        });
    }

    isActive(): boolean {
        return this.isTourActive;
    }

    startCategoryTour() {
        this.isTourActive = true;
        this.driverObj.setSteps([
            {
                element: '#btn-new-category',
                popover: {
                    title: 'Crear Nueva Categoría',
                    description: 'Haga clic en este botón para abrir el formulario de creación de categorías. El tour continuará automáticamente cuando se abra el modal.',
                    side: 'left',
                    align: 'center'
                }
            }
        ]);
        this.driverObj.drive();
    }

    continueCategoryModalTour() {
        if (!this.isTourActive) return;

        // Destroy previous instance to avoid double popovers/overlays
        this.driverObj.destroy();

        // Re-initialize for the next phase
        // We need to set isTourActive back to true because destroy() sets it to false via the callback
        this.isTourActive = true;

        // Small delay to ensure modal is rendered and previous driver is fully cleaned up
        setTimeout(() => {
            this.driverObj.setSteps([
                {
                    element: '#modal-category-form',
                    popover: {
                        title: 'Formulario de Categoría',
                        description: 'Aquí puede ingresar los datos generales de la categoría. Es fundamental llenar correctamente estos campos.',
                        side: 'right',
                        align: 'start'
                    }
                },
                {
                    element: '#input-code',
                    popover: {
                        title: 'Código',
                        description: 'Asigne un código único para identificar esta categoría en el sistema (ej: ANILLOS-ORO).',
                        side: 'right'
                    }
                },
                {
                    element: '#input-name',
                    popover: {
                        title: 'Nombre',
                        description: 'El nombre que se mostrará en los reportes y filtros.',
                        side: 'left'
                    }
                },
                {
                    element: '#input-status',
                    popover: {
                        title: 'Estado',
                        description: 'Define si la categoría está activa para su uso en nuevos productos.',
                        side: 'top'
                    }
                },
                {
                    element: '#print-config-section',
                    popover: {
                        title: 'Configuración de Impresión',
                        description: 'Esta es la sección más importante para las etiquetas. Aquí decide qué información aparecerá impresa.',
                        side: 'top',
                        align: 'center'
                    }
                },
                {
                    element: '#check-show-price',
                    popover: {
                        title: 'Mostrar Precio',
                        description: 'Active esta casilla si desea que el precio de venta aparezca en la etiqueta.',
                        side: 'top'
                    }
                },
                {
                    element: '#check-show-weight',
                    popover: {
                        title: 'Mostrar Peso',
                        description: 'Útil para joyería. Muestra el peso en gramos.',
                        side: 'top'
                    }
                },
                {
                    element: '#check-show-gold-type',
                    popover: {
                        title: 'Variante',
                        description: 'Característica o subtipo del producto (ej. Amarillo, Madera).',
                        side: 'top'
                    }
                },
                {
                    element: '#btn-save-category',
                    popover: {
                        title: 'Guardar',
                        description: 'Una vez configurado, guarde la categoría para aplicar los cambios.',
                        side: 'top'
                    }
                }
            ]);
            this.driverObj.drive();
        }, 500);
    }
    startProductTour() {
        this.isTourActive = true;
        this.driverObj.setSteps([
            {
                element: '#btn-new-product',
                popover: {
                    title: 'Nuevo Producto',
                    description: 'Haga clic aquí para registrar un nuevo producto. El tutorial le guiará a través del formulario.',
                    side: 'left',
                    align: 'center'
                }
            }
        ]);
        this.driverObj.drive();
    }

    continueProductFormTour() {
        if (!this.isTourActive) return;

        this.driverObj.destroy();
        this.isTourActive = true;

        setTimeout(() => {
            this.driverObj.setSteps([
                {
                    element: '#product-barcode',
                    popover: { title: 'Código de Barras', description: 'Ingrese o escanee el código único del producto. Puede usar el botón de imprimir para probar etiquetas.', side: 'bottom' }
                },
                {
                    element: '#product-provider',
                    popover: { title: 'Proveedor', description: 'Seleccione el proveedor. Esto puede cargar precios predeterminados.', side: 'bottom' }
                },
                {
                    element: '#product-category',
                    popover: { title: 'Categoría', description: 'Clasifique el producto. Esto afectará la generación de códigos y reportes.', side: 'bottom' }
                },
                {
                    element: '#product-subcategory',
                    popover: { title: 'Subcategoría', description: 'Refine la clasificación para una mejor organización.', side: 'bottom' }
                },
                {
                    element: '#product-material',
                    popover: { title: 'Material', description: 'Indique el kilataje (10k, 14k, etc.) si aplica.', side: 'top' }
                },
                {
                    element: '#product-gold-type',
                    popover: { title: 'Variante', description: 'Atributo adicional (Amarillo, Madera).', side: 'top' }
                },
                {
                    element: '#product-weight',
                    popover: { title: 'Peso', description: 'Peso en gramos. Fundamental para el cálculo del costo.', side: 'top' }
                },
                {
                    element: '#product-cost',
                    popover: { title: 'Costo', description: 'Costo de adquisición. Se puede calcular automáticamente según el peso y precio del proveedor.', side: 'top' }
                },
                {
                    element: '#product-price',
                    popover: { title: 'Precio de Venta', description: 'Precio final al público.', side: 'top' }
                },
                {
                    element: '#product-unique',
                    popover: { title: 'Pieza Única', description: 'Marque si es una pieza única (Stock = 1). Desmarque para productos con múltiples unidades.', side: 'top' }
                },
                {
                    element: '#product-submit',
                    popover: { title: 'Guardar', description: 'Finalice el registro guardando el producto.', side: 'left' }
                }
            ]);
            this.driverObj.drive();
        }, 500);
    }
    startInventoryTour() {
        this.isTourActive = true;
        this.driverObj.setSteps([
            {
                element: '#tour-inventory-scanner-toggle',
                popover: {
                    title: 'Modo Escáner',
                    description: 'Active este interruptor para habilitar el modo de revisión rápida. Al escanear un código, el sistema marcará el producto como "Revisado" automáticamente.',
                    side: 'bottom',
                    align: 'start'
                }
            },
            {
                element: '#tour-inventory-search',
                popover: {
                    title: 'Búsqueda / Escaneo',
                    description: 'En modo normal, busca productos por nombre o código. En modo escáner, aquí se ingresa el código para marcarlo como revisado.',
                    side: 'bottom'
                }
            },
            {
                element: '#tour-inventory-filter',
                popover: {
                    title: 'Filtros Avanzados',
                    description: 'Utilice estos filtros para ver productos "Faltantes" (No Revisados), "Revisados", "Apartados" o por Categoría.',
                    side: 'bottom'
                }
            },
            {
                element: '#tour-inventory-summary',
                popover: {
                    title: 'Resumen de Progreso',
                    description: 'Haga clic aquí para ver gráficamente cuánto lleva avanzado del inventario (Total vs Revisados).',
                    side: 'bottom'
                }
            },
            {
                element: '#tour-inventory-table',
                popover: {
                    title: 'Listado y Estado',
                    description: 'Aquí verá sus productos. Los marcados como "Apartado" tienen una etiqueta especial. Puede validar manualmente el estado de revisión usando el check (si está habilitado).',
                    side: 'top'
                }
            }
        ]);
        this.driverObj.drive();
    }
}
