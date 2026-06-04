/**
 * Compresses an image file client-side using the Canvas API.
 * Resizes the image if it exceeds max dimensions (e.g., 600px width/height)
 * and outputs a compressed JPEG/PNG blob.
 */
export async function compressImage(file: File, maxDimension = 600, quality = 0.7): Promise<File> {
  return new Promise((resolve, reject) => {
    // Only compress image files
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize logic if width or height exceeds maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file);
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Retain original type, or convert to jpeg if not png/webp
        const outputType = file.type === 'image/png' || file.type === 'image/webp' ? file.type : 'image/jpeg';

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            // Create a new File object from the blob
            const compressedFile = new File([blob], file.name, {
              type: outputType,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          outputType,
          quality
        );
      };
      img.onloadstart = () => {};
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
