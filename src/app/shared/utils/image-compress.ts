/**
 * Reduce una foto en el navegador antes de subirla: las del celular o las que pasaron por
 * una IA pesan varios MB y suben lento con datos. El back la vuelve a procesar (1600 px,
 * sin metadatos), así que aquí basta con dejarla en un tamaño razonable.
 *
 * - Aplica la rotación de la cámara (EXIF) al dibujarla.
 * - El fondo transparente queda blanco, igual que en el back.
 * - Sale en JPEG: pdfmake no acepta WebP.
 */
export async function compressImage(file: Blob, maxSide = 2000, quality = 0.9): Promise<Blob> {
    let bitmap: ImageBitmap;
    try {
        bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
        throw new Error('No se pudo leer la imagen. Usa una foto JPG o PNG.');
    }

    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            blob => (blob ? resolve(blob) : reject(new Error('No se pudo preparar la imagen'))),
            'image/jpeg',
            quality
        );
    });
}
