import { Injectable } from '@angular/core';

export interface ProductLabelData {
    barcode: string;
    description: string;
    price: number;
    category?: string;
    subcategory?: string;
    weight?: number | string;
    karatage?: string;
    printConfig?: {
        showPrice: boolean;
        showWeight: boolean;
        showKaratage: boolean;
        showDescription: boolean;
    };
}

@Injectable({
    providedIn: 'root'
})
export class LabelPrintingService {

    constructor() { }

    printLabels(products: ProductLabelData[]) {
        if (!products || products.length === 0) return;

        // 60mm x 20mm
        const pageW_mm = 60;
        const pageH_mm = 20;

        const printWindow = window.open('', '', `width=600,height=300`);
        if (!printWindow) return;

        let labelsHtml = '';

        products.forEach((product, index) => {
            const barcode = product.barcode;
            const price = product.price || 0;
            let description = product.description || '';
            const category = (product.category || '').toLowerCase();
            const weight = product.weight;
            const karatage = product.karatage;
            const config = product.printConfig;

            // Determining what to show
            let showPrice = true;
            let showWeight = false;
            let showKaratage = false;

            if (config) {
                // Use Configuration from Category
                showPrice = config.showPrice;
                showWeight = config.showWeight;
                showKaratage = config.showKaratage;
                // If config has showDescription, we could use it too, but assumed generally always shown.
                // If description is hidden?
                if (config.showDescription === false) {
                    description = '';
                }
            } else {
                // Fallback to hardcoded logic
                const isJoyeria = category.includes('joyeria') || category.includes('joyería');
                const isBroquel = category.includes('broquel');
                const isEstuche = category.includes('estuche');

                if (isJoyeria) {
                    showPrice = false;
                    showWeight = true;
                    showKaratage = true;
                } else if (isBroquel) {
                    showPrice = true;
                    showWeight = false;
                } else if (isEstuche) {
                    showPrice = true;
                    showWeight = false;
                }
            }

            // Truncate description slightly less if we have more space? 
            // Or maintain simple logic.
            if (description.length > 25) description = description.substring(0, 25) + '...';

            // Page break for subsequent pages
            const pageBreak = index < products.length - 1 ? 'page-break-after: always;' : '';

            // Construct Extra Info Line (Weight/Karatage)
            let extraInfoHtml = '';
            if (showWeight || showKaratage) {
                const weightStr = showWeight && weight ? `${weight}g` : '';
                const karatStr = showKaratage && karatage ? `${karatage}` : '';
                extraInfoHtml = `<div class="extra-info">${[karatStr, weightStr].filter(Boolean).join(' ')}</div>`;
            }

            const priceHtml = showPrice ? `<div class="price-text">$${price.toFixed(2)}</div>` : '';

            labelsHtml += `
                <div class="label-wrapper" style="${pageBreak}">
                    <div class="label-container">
                        <div class="top-section">
                            <svg id="barcode-${index}" class="barcode-svg" data-barcode="${barcode}"></svg>
                            <div class="barcode-text">${barcode}</div>
                        </div>
                        <div class="bottom-section">
                            <div class="desc-text">${description}</div>
                            ${extraInfoHtml}
                            ${priceHtml}
                        </div>
                    </div>
                </div>
            `;
        });

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Print Labels</title>
                    <style>
                        @media print {
                            @page {
                                size: ${pageW_mm}mm ${pageH_mm}mm;
                                margin: 0; 
                            }
                            html, body {
                                width: ${pageW_mm}mm;
                                height: ${pageH_mm}mm;
                                margin: 0 !important;
                                padding: 0 !important;
                            }
                            body * {
                                visibility: visible;
                                page-break-inside: avoid;
                            }
                            .label-wrapper {
                                width: ${pageW_mm}mm;
                                height: ${pageH_mm}mm;
                                position: relative;
                                overflow: hidden;
                            }
                        }
                        
                        body {
                            margin: 0;
                            padding: 0;
                            font-family: Arial, sans-serif;
                            background-color: white;
                        }
                        
                        .label-container {
                            position: absolute;
                            top: 0;
                            left: 50%;
                            width: 50%;
                            height: 100%;
                            display: flex;
                            flex-direction: column;
                            justify-content: flex-start; 
                            align-items: flex-start;
                            box-sizing: border-box;
                            padding: 1mm 1mm 1mm 0; 
                            transform: rotate(180deg); 
                        }

                        .top-section {
                            width: 100%;
                            height: 45%; 
                            display: flex;
                            flex-direction: column;
                            justify-content: flex-end; 
                            align-items: flex-start;
                            padding-left: 0;
                            padding-bottom: 1px;
                            margin-bottom: 1px;
                        }

                        .bottom-section {
                            width: 100%;
                            height: 55%; 
                            display: flex;
                            flex-direction: column;
                            justify-content: flex-start;
                            align-items: flex-start;
                            padding-top: 10px;
                        }

                        .barcode-svg {
                            width: 95%; 
                            height: 100%; 
                            max-height: 12px;
                            display: block;
                            margin: 0;
                        }

                        .barcode-text {
                            font-size: 10px; 
                            font-weight: bold;
                            text-align: left; 
                            width: 100%;
                            margin: 0;
                            font-family: monospace; 
                            line-height: 1;
                        }

                        .desc-text {
                            font-size: 10px; 
                            text-align: left;
                            width: 100%;
                            white-space: normal; 
                            overflow: hidden;
                            margin: 0;
                            line-height: 1.1;
                            margin-bottom: 2px;
                        }

                        .price-text {
                            font-size: 11px; 
                            font-weight: bold;
                            text-align: left;
                            width: 100%;
                            margin: 0;
                        }

                        .extra-info {
                             font-size: 9px;
                             width: 100%;
                             text-align: left;
                             margin-bottom: 1px;
                        }
                    </style>
                    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
                </head>
                <body>
                    ${labelsHtml}
                    
                    <script>
                        window.onload = function() {
                            try {
                                // Generate barcodes
                                var svgs = document.querySelectorAll('.barcode-svg');
                                svgs.forEach(function(svg) {
                                    var code = svg.getAttribute('data-barcode');
                                    JsBarcode(svg, code, {
                                        format: "CODE128",
                                        width: 1.5, 
                                        height: 25,
                                        displayValue: false, 
                                        margin: 0
                                    });
                                });

                                setTimeout(function() {
                                    window.print();
                                    window.close();
                                }, 500); 
                            } catch (e) {
                                document.body.innerHTML = "Error: " + e.message;
                            }
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }
}

