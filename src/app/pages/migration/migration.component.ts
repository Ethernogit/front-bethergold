import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MigrationService } from '../../shared/services/migration.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
    selector: 'app-migration',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './migration.component.html'
})
export class MigrationComponent {
    isLoading = false;
    importResults: any = null;
    selectedFile: File | null = null;

    constructor(
        private migrationService: MigrationService,
        private toastService: ToastService
    ) { }

    onFileSelected(event: any) {
        this.selectedFile = event.target.files[0];
    }

    onImport() {
        if (!this.selectedFile) {
            this.toastService.error('Por favor selecciona un archivo JSON primero.');
            return;
        }

        this.isLoading = true;
        this.importResults = null;

        const fileReader = new FileReader();
        fileReader.onload = (e) => {
            try {
                const jsonData = JSON.parse(fileReader.result as string);
                this.migrationService.importData(jsonData).subscribe({
                    next: (res) => {
                        this.isLoading = false;
                        this.importResults = res.results;
                        this.toastService.success('Migración completada con éxito.');
                    },
                    error: (err) => {
                        console.error('Migration error', err);
                        this.isLoading = false;
                        this.toastService.error('Error durante la migración: ' + (err.error?.message || err.message));
                    }
                });
            } catch (parseError) {
                this.isLoading = false;
                this.toastService.error('El archivo no es un JSON válido.');
            }
        };
        fileReader.readAsText(this.selectedFile);
    }

    objectKeys(obj: any) {
        return Object.keys(obj);
    }
}
