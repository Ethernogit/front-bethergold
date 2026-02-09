import { Injectable } from '@angular/core';

export interface ProductLabelData {
    barcode: string;
    description: string;
    price: number;
    category?: string;
    subcategory?: string;
    weight?: number | string;
    karatage?: string;
    material?: string;
    printConfig?: {
        showPrice: boolean;
        showWeight: boolean;
        showKaratage: boolean;
        showGoldType: boolean;
        showMaterial: boolean;
        showIntegerWeight: boolean;
        showDescription: boolean;
        // Support for snake_case coming from backend
        show_price?: boolean;
        show_weight?: boolean;
        show_karatage?: boolean;
        show_gold_type?: boolean;
        show_material?: boolean;
        show_integer_weight?: boolean;
        show_description?: boolean;
    };
    goldType?: string;
}

@Injectable({
    providedIn: 'root'
})
export class LabelPrintingService {

    constructor() { }

    printLabels(products: ProductLabelData[]) {
        if (!products || products.length === 0) return;

        const pageW_mm = 60;
        const pageH_mm = 20;

        // SCALING: 1mm = 10 units
        // Total viewbox: 600 x 200

        // Target area: 30mm width -> 300 units
        // Reset to exactly 300 (Fold Line) to avoid crossing into the other half.
        // This fills the Right Half (30mm-60mm) fully.
        const startX = 300;
        const contentW = 300;
        const contentH = 200;

        // Rotation center: middle of the content box
        const centerX = startX + (contentW / 2); // 300 + 150 = 450
        const centerY = contentH / 2;            // 100

        // Create a hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';
        iframe.style.visibility = 'hidden'; // Use visibility hidden to be safe
        document.body.appendChild(iframe);

        const printWindow = iframe.contentWindow;
        if (!printWindow) {
            document.body.removeChild(iframe);
            return;
        }

        let labelsSvgContent = '';

        console.log('Printing Products:', products);

        const toBoolean = (val: any, defaultVal: boolean): boolean => {
            if (val === undefined || val === null) return defaultVal;
            if (typeof val === 'boolean') return val;
            if (typeof val === 'number') return val !== 0;
            if (typeof val === 'string') {
                const lower = val.toLowerCase();
                return lower !== 'false' && lower !== '0' && lower !== '';
            }
            return defaultVal;
        };

        products.forEach((product, index) => {
            const barcode = product.barcode;
            const price = product.price || 0;
            let description = product.description || '';
            const category = (product.category || '').toLowerCase();
            const weight = product.weight;
            const karatage = product.karatage;
            const goldType = product.goldType;
            const config = product.printConfig;

            // Determining what to show
            let showPrice = true;
            let showWeight = false;
            let showKaratage = false;
            let showGoldType = false;
            let showMaterial = false;
            let showIntegerWeight = false;

            if (config) {
                // Handle both camelCase and snake_case
                const c = config as any;

                showPrice = toBoolean(c.showPrice !== undefined ? c.showPrice : c.show_price, true);
                showWeight = toBoolean(c.showWeight !== undefined ? c.showWeight : c.show_weight, false);
                showKaratage = toBoolean(c.showKaratage !== undefined ? c.showKaratage : c.show_karatage, false);
                showGoldType = toBoolean(c.showGoldType !== undefined ? c.showGoldType : c.show_gold_type, false);
                showMaterial = toBoolean(c.showMaterial !== undefined ? c.showMaterial : c.show_material, false);
                showIntegerWeight = toBoolean(c.showIntegerWeight !== undefined ? c.showIntegerWeight : c.show_integer_weight, false);

                const showDescription = toBoolean(c.showDescription !== undefined ? c.showDescription : c.show_description, true);
                if (!showDescription) {
                    description = '';
                }
            } else {
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

            // Description truncation removed to allow full text


            const pageBreak = index < products.length - 1 ? 'page-break-after: always;' : '';

            let extraInfoHtml = '';
            const infoParts: string[] = [];

            if (showKaratage && karatage) {
                infoParts.push(karatage);
            }

            if (showMaterial && product.material) {
                infoParts.push(product.material);
            }

            if (showGoldType && goldType) {
                infoParts.push(goldType);
            }

            if (showWeight && weight) {
                let weightDisplay = weight;
                if (showIntegerWeight) {
                    const val = parseFloat(weight.toString());
                    if (!isNaN(val)) {
                        weightDisplay = Math.round(val * 10);
                    }
                }
                infoParts.push(`${weightDisplay}${showIntegerWeight ? '' : 'g'}`);
            }

            if (infoParts.length > 0) {
                extraInfoHtml += `<div class="extra-info no-wrap" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; font-size: 18px;">${infoParts.join(' ')}</div>`;
            }

            const priceHtml = showPrice ? `<div class="price-text">$${price.toFixed(2)}</div>` : '';

            // HTML Content to go inside SVG
            const innerHtml = `
                <div class="label-content">
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
            `;

            // SVG wrapper for this label
            // We use a container div with page-break for the print layout, 
            // but the content is an SVG image.
            labelsSvgContent += `
                <div class="label-wrapper" style="${pageBreak}">
                    <svg class="label-svg" width="${pageW_mm}mm" height="${pageH_mm}mm" viewBox="0 0 600 200">
                        <!-- Rotation Group: Rotates 180 degrees around the center of the print area -->
                        <g transform="rotate(180, ${centerX}, ${centerY})">
                            <foreignObject x="${startX}" y="0" width="${contentW}" height="${contentH}">
                                <div xmlns="http://www.w3.org/1993/xhtml" class="foreign-div">
                                    ${innerHtml}
                                </div>
                            </foreignObject>
                        </g>
                    </svg>
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

                        /* SVG Container Styles */
                        .label-svg {
                            display: block;
                            width: 100%;
                            height: 100%;
                        }

                        /* Foreign Object Content Styles */
                        .foreign-div {
                            width: 100%;
                            height: 100%;
                            box-sizing: border-box;
                            padding: 5px; /* Scaled padding */
                            display: flex;
                            flex-direction: column;
                            /* Force black for high contrast */
                            color: black !important;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        
                        .label-content {
                            width: 100%;
                            height: 100%;
                            display: flex;
                            flex-direction: column;
                        }

                        /* High contrast settings */
                        * {
                            -webkit-font-smoothing: none;
                            -moz-osx-font-smoothing: grayscale;
                            text-rendering: optimizeLegibility;
                        }

                        .top-section {
                            width: 100%;
                            height: 40%; /* Reduced from 48% to give more space below */
                            display: flex;
                            flex-direction: column;
                            justify-content: flex-start; /* Push to TOP edge (away from center) */
                            align-items: flex-start;
                            padding-top: 2px; /* Reduced padding */
                        }

                        .bottom-section {
                            width: 100%;
                            height: 58%; /* Increased from 48% */
                            display: flex;
                            flex-direction: column;
                            justify-content: flex-end; /* Push to BOTTOM edge (away from center) */
                            align-items: flex-start;
                            padding-bottom: 2px; /* Padding from edge - Reduced to lower text */
                        }

                        .barcode-svg {
                            width: auto;      
                            height: 100%; 
                            max-width: 100%;
                            max-height: 40px; /* Reduced max height */
                            display: block;
                            margin: 0;
                            shape-rendering: crispEdges; 
                        }

                        .barcode-text {
                            font-size: 24px;   /* ~2.4mm height */
                            font-weight: bold;  
                            text-align: left;   
                            width: 100%;
                            margin: 0;
                            font-family: Arial, sans-serif; 
                            line-height: 1;
                            color: black;
                            padding-left: 5px;
                            letter-spacing: -1px;
                        }

                        .desc-text {
                            font-size: 18px; /* Reduced to fit more text */
                            font-weight: bold; 
                            text-align: left;
                            width: 100%;
                            display: -webkit-box;
                            -webkit-line-clamp: 3; /* Increased to 3 lines */
                            -webkit-box-orient: vertical;
                            overflow: hidden;
                            margin: 0;
                            line-height: 0.95; /* Tighter line height */
                            margin-bottom: 2px;
                            color: black;
                        }

                        .price-text {
                            font-size: 24px; /* Reduced from 28px */
                            font-weight: 900; 
                            text-align: left;
                            width: 100%;
                            margin: 0;
                            color: black;
                        }

                        .extra-info {
                             font-size: 22px; /* ~2.2mm height */
                             font-weight: 700;
                             width: 100%;
                             text-align: left;
                             margin-bottom: 2px;
                             color: black;
                        }
                    </style>
                    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
                </head>
                <body>
                    ${labelsSvgContent}
                    
                    <script>
                        window.onload = function() {
                            try {
                                // Generate barcodes inside SVG foreignObject
                                var svgs = document.querySelectorAll('.barcode-svg');
                                svgs.forEach(function(svg) {
                                    var code = svg.getAttribute('data-barcode');
                                    JsBarcode(svg, code, {
                                        format: "CODE128",
                                        width: 1.8,   /* Further reduced density to prevent spillover */
                                        height: 35,   /* Reduced height to fit in smaller top section */
                                        displayValue: false, 
                                        margin: 0
                                    });
                                });

                                setTimeout(function() {
                                    window.focus();
                                    window.print();
                                    // With iframe, we don't close the window, we remove the iframe
                                    // But we can't do it from check here easily unless we communicate up
                                    // or just wait ample time.
                                    // However, the cleanest way in Angular service is to listen to the iframe.
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

        // Remove iframe after printing
        // Note: It's hard to catch exactly when user closes print dialog cross-browser for iframes
        // We will use a long timeout to clean up.
        // Or cleaner: in the service we can keep track of it.
        // For now, let's leave it in DOM invisible or remove after a very long delay (10 mins) or rely on next print to clean up?
        // Better: Remove it after 10 seconds. Most users won't take that long to *start* printing?
        // Actually, removing the iframe while print dialog is open might close the dialog in some browsers.
        // It is safer to leave it, or remove it on next call.
        // Let's implement a 'cleanup previous' strategy.
        const id = 'print-iframe-' + Date.now();
        iframe.id = id;

        // Cleanup old iframes
        const oldIframes = document.querySelectorAll('iframe[id^="print-iframe-"]');
        oldIframes.forEach(f => {
            if (f.id !== id) {
                document.body.removeChild(f);
            }
        });

        // Also setup a delayed cleanup just in case
        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        }, 60000 * 5); // 5 minutes safety cleanup
    }
}
