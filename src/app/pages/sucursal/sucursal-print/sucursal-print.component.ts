import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SucursalService } from '../../../shared/services/sucursal.service';
import { ToastService } from '../../../shared/services/toast.service';
import { LoginService } from '../../../shared/services/auth/login.service';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-sucursal-print',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './sucursal-print.component.html'
})
export class SucursalPrintConfigComponent implements OnInit {
    configForm: FormGroup;
    currentSucursalId: string | null = null;
    isLoading = false;
    currentSucursal: any = null;

    selectedFile: File | null = null;
    previewLogoUrl: string | null = null;

    showPreviewModal = false;
    @ViewChild('previewFrame') previewFrame!: ElementRef;

    constructor(
        private fb: FormBuilder,
        private sucursalService: SucursalService,
        private toastService: ToastService,
        private loginService: LoginService
    ) {
        this.configForm = this.fb.group({
            printLogoUrl: [''],
            printHeaderText: [''],
            printFooterText: ['¡Gracias por su compra!'],
            printShowAddress: [true],
            printShowPhone: [true],
            printShowClient: [true],
            printShowSeller: [true],
            printTicketWidth: ['80mm'],
            printFontFamily: ['Courier'],
            printWebsite: [''],
            printFacebook: [''],
            printInstagram: ['']
        });
    }

    ngOnInit(): void {
        this.loadUserData();
    }

    loadUserData() {
        const sucursal = this.loginService.currentSucursal();
        if (sucursal && sucursal._id) {
            this.currentSucursalId = sucursal._id;
            this.loadSucursalConfig();
        } else {
            this.toastService.error('No se pudo identificar la sucursal del usuario.');
        }
    }

    loadSucursalConfig() {
        if (!this.currentSucursalId) return;

        this.isLoading = true;
        this.sucursalService.getSucursalById(this.currentSucursalId).subscribe({
            next: (response) => {
                this.currentSucursal = response.data;
                const printConfig = response.data.printConfig;

                if (printConfig) {
                    this.configForm.patchValue({
                        printLogoUrl: printConfig.logoUrl || '',
                        printHeaderText: printConfig.headerText || '',
                        printFooterText: printConfig.footerText || '',
                        printShowAddress: printConfig.showAddress ?? true,
                        printShowPhone: printConfig.showPhone ?? true,
                        printShowClient: printConfig.showClient ?? true,
                        printShowSeller: printConfig.showSeller ?? true,
                        printTicketWidth: printConfig.ticketWidth || '80mm',
                        printFontFamily: printConfig.fontFamily || 'Courier',
                        printWebsite: printConfig.website || '',
                        printFacebook: printConfig.facebook || '',
                        printInstagram: printConfig.instagram || ''
                    });

                    if (printConfig.logoUrl) {
                        this.previewLogoUrl = environment.apiUrl.replace('/api/v1', '') + printConfig.logoUrl;
                    }
                }
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading sucursal config', error);
                this.toastService.error('Error al cargar la configuración');
                this.isLoading = false;
            }
        });
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.selectedFile = file;
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.previewLogoUrl = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    openPreviewModal() {
        this.showPreviewModal = true;
        setTimeout(() => {
            if (this.previewFrame) {
                const doc = this.previewFrame.nativeElement.contentWindow.document;
                doc.open();
                doc.write(this.generateTicketHtml());
                doc.close();
            }
        }, 100);
    }

    closePreviewModal() {
        this.showPreviewModal = false;
    }

    generateTicketHtml(): string {
        const formValue = this.configForm.value;
        const sucursal = this.currentSucursal;

        const mockItems = [
            { qty: 1, desc: 'Anillo de Oro 10k', price: 1500.00, total: 1500.00 },
            { qty: 2, desc: 'Limpieza de Joyería', price: 50.00, total: 100.00 },
        ];
        const subtotal = 1600.00;
        const total = 1600.00;

        let logoSrc = this.previewLogoUrl || '';
        if (!logoSrc && formValue.printLogoUrl) {
            logoSrc = environment.apiUrl.replace('/api/v1', '') + formValue.printLogoUrl;
        }

        const width = formValue.printTicketWidth || '80mm';
        const fontFamily = formValue.printFontFamily || 'Courier';
        const showAddress = formValue.printShowAddress;
        const showPhone = formValue.printShowPhone;
        const showClient = formValue.printShowClient;
        const showSeller = formValue.printShowSeller;

        const orgName = sucursal?.name || 'Joyería Demo';
        const headerText = formValue.printHeaderText || '';
        const footerText = formValue.printFooterText || '';
        const website = formValue.printWebsite || '';

        const addressLine = (showAddress && sucursal?.address) ?
            `${sucursal.address.street || ''}, ${sucursal.address.city || ''}` : '';
        const phoneLine = (showPhone && sucursal?.phone) ? sucursal.phone : '';

        return `
            <html>
            <head>
                <style>
                    body { 
                        font-family: '${fontFamily}', monospace; 
                        margin: 0; padding: 10px; box-sizing: border-box; 
                        font-size: 12px;
                        width: ${width}; 
                        background: white;
                    }
                    .header { text-align: center; margin-bottom: 10px; }
                    .logo { max-width: 80%; max-height: 80px; margin: 0 auto 5px; display: block; }
                    .org-name { font-size: 14px; font-weight: bold; text-transform: uppercase; }
                    .meta { font-size: 10px; margin-bottom: 5px; color: #333; }
                    .divider { border-top: 1px dashed #000; margin: 5px 0; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; }
                    th { text-align: left; border-bottom: 1px dashed #000; }
                    td { vertical-align: top; padding: 2px 0; }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .totals { margin-top: 10px; font-weight: bold; }
                    .footer { text-align: center; margin-top: 15px; font-size: 10px; }
                    .fontlittle { font-size: 9px; line-height: 1.1; margin: 0; padding: 0; }
                    ul.fontlittle { text-align: left; padding-left: 15px; margin: 5px 0; }
                    ul.fontlittle li { margin-bottom: 2px; }
                    .footer p { margin: 5px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    ${logoSrc ? `<img src="${logoSrc}" class="logo" />` : ''}
                    <div class="org-name">${orgName}</div>
                    ${headerText ? `<div>${headerText}</div>` : ''}
                    ${addressLine ? `<div>${addressLine}</div>` : ''}
                    ${phoneLine ? `<div>Tel: ${phoneLine}</div>` : ''}
                </div>

                <div class="divider"></div>
                
                <div class="meta">
                    <div>Folio: PREVIEW-001</div>
                    <div>Fecha: ${new Date().toLocaleDateString()}</div>
                    ${showClient ? '<div>Cliente: Juan Pérez (Demo)</div>' : ''}
                    ${showSeller ? '<div>Vendedor: Vendedor A</div>' : ''}
                </div>

                <div class="divider"></div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 15%">Cant</th>
                            <th style="width: 55%">Desc</th>
                            <th class="text-right" style="width: 30%">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mockItems.map(item => `
                            <tr>
                                <td class="text-center">${item.qty}</td>
                                <td>${item.desc}</td>
                                <td class="text-right">$${item.total.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="divider"></div>

                <div class="totals">
                    <div style="display:flex; justify-content:space-between">
                        <span>Total:</span>
                        <span>$${total.toFixed(2)}</span>
                    </div>
                </div>

                <div class="footer">
                    <div>${footerText}</div>
                    ${website ? `<div>${website}</div>` : ''}
                    <div style="margin-top: 10px; font-size: 9px;">*** VISTA PREVIA ***</div>
                </div>
            </body>
            </html>
        `;
    }

    async onSubmit() {
        if (this.configForm.invalid) return;
        if (!this.currentSucursalId) return;

        this.isLoading = true;

        try {
            let logoUrl = this.configForm.get('printLogoUrl')?.value;
            if (this.selectedFile) {
                const uploadRes = await this.sucursalService.uploadLogo(this.selectedFile).toPromise();
                if (uploadRes && uploadRes.success) {
                    logoUrl = uploadRes.data.logoUrl;
                }
            }

            const formValue = this.configForm.value;
            const printConfig = {
                logoUrl: logoUrl,
                headerText: formValue.printHeaderText,
                footerText: formValue.printFooterText,
                showAddress: formValue.printShowAddress,
                showPhone: formValue.printShowPhone,
                showClient: formValue.printShowClient,
                showSeller: formValue.printShowSeller,
                ticketWidth: formValue.printTicketWidth,
                fontFamily: formValue.printFontFamily,
                website: formValue.printWebsite,
                facebook: formValue.printFacebook,
                instagram: formValue.printInstagram
            };

            const updateData = {
                printConfig: printConfig
            };

            this.sucursalService.updateSucursal(this.currentSucursalId, updateData).subscribe({
                next: () => {
                    this.toastService.success('Configuración de impresión actualizada');
                    this.isLoading = false;
                },
                error: (err) => {
                    console.error('Error updating sucursal', err);
                    this.toastService.error('Error al actualizar');
                    this.isLoading = false;
                }
            });

        } catch (error) {
            console.error('Error', error);
            this.toastService.error('Error al procesar la solicitud');
            this.isLoading = false;
        }
    }
}
