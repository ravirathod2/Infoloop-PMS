const MAX_SOURCE_BYTES = 8 * 1024 * 1024;

/**
 * Turns a picked image file into a small square JPEG data URL (centre-cropped, 256px by default).
 * Small enough (about 10 to 30 KB) to live on the member/client record itself.
 */
export async function fileToAvatar(file, size = 256) {
  if (!file || !file.type.startsWith('image/')) throw new Error('Please choose an image file (JPG, PNG, WebP).');
  if (file.size > MAX_SOURCE_BYTES) throw new Error('That image is larger than 8 MB. Choose a smaller one.');

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('That file could not be read as an image.'));
      el.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    // Portrait photos: bias the crop upward so faces are not cut off.
    const sy = img.naturalHeight > img.naturalWidth ? (img.naturalHeight - side) * 0.2 : (img.naturalHeight - side) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1e1f21';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
