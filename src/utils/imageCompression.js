/**
 * Image compression utility
 * Automatically compresses images if they're too large
 */

export const compressImage = (file, maxSizeKB = 500, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions to maintain aspect ratio
      let { width, height } = img;
      const maxWidth = 1200;
      const maxHeight = 1200;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      // Try different quality levels until we get under the size limit
      const tryCompress = (currentQuality) => {
        canvas.toBlob((blob) => {
          if (blob && (blob.size / 1024 <= maxSizeKB || currentQuality <= 0.1)) {
            // Convert blob back to base64
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({
                dataUrl: e.target.result,
                size: blob.size,
                compressed: blob.size < file.size,
                originalSize: file.size,
                compressionRatio: ((file.size - blob.size) / file.size * 100).toFixed(1)
              });
            };
            reader.readAsDataURL(blob);
          } else {
            // Try with lower quality
            tryCompress(currentQuality - 0.1);
          }
        }, 'image/jpeg', currentQuality);
      };
      
      tryCompress(quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const shouldCompressImage = (file, maxSizeKB = 500) => {
  return file.size > maxSizeKB * 1024;
};
