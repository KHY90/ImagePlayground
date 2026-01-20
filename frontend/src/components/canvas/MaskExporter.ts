/**
 * Utility functions for exporting canvas mask data.
 */

/**
 * Export a canvas element to base64 PNG data URL.
 */
export function canvasToDataURL(
  canvas: HTMLCanvasElement,
  format: 'image/png' | 'image/jpeg' = 'image/png',
  quality = 1.0
): string {
  return canvas.toDataURL(format, quality);
}

/**
 * Export a canvas element to a Blob.
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: 'image/png' | 'image/jpeg' = 'image/png',
  quality = 1.0
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), format, quality);
  });
}

/**
 * Convert a data URL to base64 string (without the prefix).
 */
export function dataURLToBase64(dataURL: string): string {
  const parts = dataURL.split(',');
  return parts.length > 1 ? parts[1] : dataURL;
}

/**
 * Convert a data URL to Blob.
 */
export function dataURLToBlob(dataURL: string): Blob {
  const parts = dataURL.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(parts[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);

  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }

  return new Blob([u8arr], { type: mime });
}

/**
 * Create a grayscale mask from a colored canvas.
 * White pixels indicate masked areas, black indicates unmasked.
 */
export function createGrayscaleMask(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Create a new canvas for the grayscale mask
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = canvas.width;
  maskCanvas.height = canvas.height;
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) return '';

  const maskImageData = maskCtx.createImageData(canvas.width, canvas.height);
  const maskData = maskImageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Check if pixel has any alpha (is painted)
    const alpha = data[i + 3];
    const value = alpha > 0 ? 255 : 0;

    maskData[i] = value;     // R
    maskData[i + 1] = value; // G
    maskData[i + 2] = value; // B
    maskData[i + 3] = 255;   // A
  }

  maskCtx.putImageData(maskImageData, 0, 0);
  return maskCanvas.toDataURL('image/png');
}

/**
 * Resize a mask to match target dimensions.
 */
export async function resizeMask(
  maskDataURL: string,
  targetWidth: number,
  targetHeight: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Use nearest neighbor interpolation for mask
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load mask image'));
    img.src = maskDataURL;
  });
}

/**
 * Combine multiple masks using OR operation.
 */
export function combineMasks(masks: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    if (masks.length === 0) {
      reject(new Error('No masks provided'));
      return;
    }

    const loadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;

    masks.forEach((maskDataURL, index) => {
      const img = new Image();
      img.onload = () => {
        loadedImages[index] = img;
        loadedCount++;

        if (loadedCount === masks.length) {
          // All images loaded, combine them
          const canvas = document.createElement('canvas');
          canvas.width = loadedImages[0].width;
          canvas.height = loadedImages[0].height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Draw each mask with additive blending
          loadedImages.forEach((loadedImg) => {
            ctx.globalCompositeOperation = 'lighter';
            ctx.drawImage(loadedImg, 0, 0);
          });

          resolve(canvas.toDataURL('image/png'));
        }
      };
      img.onerror = () => reject(new Error(`Failed to load mask ${index}`));
      img.src = maskDataURL;
    });
  });
}

/**
 * Invert a mask (swap black and white).
 */
export async function invertMask(maskDataURL: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];       // R
        data[i + 1] = 255 - data[i + 1]; // G
        data[i + 2] = 255 - data[i + 2]; // B
        // Keep alpha unchanged
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load mask image'));
    img.src = maskDataURL;
  });
}

/**
 * Blur mask edges for smoother transitions.
 */
export async function blurMask(
  maskDataURL: string,
  blurRadius: number = 5
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Apply blur filter
      ctx.filter = `blur(${blurRadius}px)`;
      ctx.drawImage(img, 0, 0);
      ctx.filter = 'none';

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load mask image'));
    img.src = maskDataURL;
  });
}

export default {
  canvasToDataURL,
  canvasToBlob,
  dataURLToBase64,
  dataURLToBlob,
  createGrayscaleMask,
  resizeMask,
  combineMasks,
  invertMask,
  blurMask,
};
