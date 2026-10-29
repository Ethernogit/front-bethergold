import { Injectable, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

/**
 * Avisa cuando se publicó un build nuevo del front mientras el usuario seguía
 * con la pestaña abierta. Sin esto, el service worker sigue sirviendo la versión
 * vieja hasta que se cierran todas las pestañas del sitio.
 *
 * Solo funciona con service worker (producción). En `ng serve` está apagado y
 * no hay aviso. Darafe además consulta un `version.json`, pero eso requiere
 * cambiar el comando de build de Vercel. Con el worker activo, además, ese
 * polling ve el build nuevo antes de que el worker lo descargue, y el aviso
 * reaparece en bucle.
 */
@Injectable({ providedIn: 'root' })
export class VersionCheckService {
    private swUpdate = inject(SwUpdate);

    readonly updateAvailable = signal(false);

    private started = false;
    private readonly CHECK_INTERVAL_MS = 5 * 60 * 1000;

    start(): void {
        if (this.started || !this.swUpdate.isEnabled) return;
        this.started = true;

        // VERSION_READY = el worker ya descargó todo el build nuevo; antes de eso recargar no cambia nada
        this.swUpdate.versionUpdates.subscribe(evt => {
            if (evt.type === 'VERSION_READY') this.updateAvailable.set(true);
        });

        // Al worker le faltan archivos que ya no existen en el servidor: solo se sale recargando
        this.swUpdate.unrecoverable.subscribe(() => window.location.reload());

        setInterval(() => this.check(), this.CHECK_INTERVAL_MS);

        // Al volver a una pestaña que estuvo en segundo plano es cuando más se nota lo viejo
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') this.check();
        });
    }

    /**
     * Recargar solo no basta: el worker viejo seguiría sirviendo los archivos viejos.
     * Primero se activa la versión descargada y luego se recarga.
     */
    reload(): void {
        if (!this.swUpdate.isEnabled) {
            window.location.reload();
            return;
        }
        this.swUpdate.activateUpdate()
            .catch(() => undefined)
            .then(() => window.location.reload());
    }

    private check(): void {
        if (this.updateAvailable()) return;
        // Si hay un ngsw.json nuevo, el worker lo descarga en segundo plano y llega VERSION_READY
        this.swUpdate.checkForUpdate().catch(() => false);
    }
}
