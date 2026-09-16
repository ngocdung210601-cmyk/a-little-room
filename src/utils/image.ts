export const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "That file type isn't supported. Try JPG, PNG, WEBP, or GIF."
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'That image is a little too large. Keep it under 10MB.'
  }
  return null
}

/**
 * Downscales large raster images client-side before upload. GIFs are passed through
 * untouched so animation is preserved.
 */
export async function compressImageIfNeeded(file: File, maxDimension = 1600): Promise<File> {
  if (file.type === 'image/gif') return file
  if (file.size < 600 * 1024) return file

  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  if (scale >= 1) return file

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85)
  )
  if (!blob) return file
  return new File([blob], file.name, { type: blob.type })
}

export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}
