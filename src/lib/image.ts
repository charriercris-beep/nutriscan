// Compression d'image côté client avant envoi à l'API ou stockage local.

export interface ImageCompressee {
  blob: Blob
  base64: string // sans préfixe data:...;base64,
  dataUrl: string
}

export async function compresserImage(
  fichier: File | Blob,
  maxDimension = 1024,
  qualite = 0.8,
): Promise<ImageCompressee> {
  const dataUrlOriginal = await lireFichierEnDataUrl(fichier)
  const img = await chargerImage(dataUrlOriginal)

  let { width, height } = img
  if (width > maxDimension || height > maxDimension) {
    if (width >= height) {
      height = Math.round((height * maxDimension) / width)
      width = maxDimension
    } else {
      width = Math.round((width * maxDimension) / height)
      height = maxDimension
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error("Impossible d'obtenir le contexte canvas")
  ctx.drawImage(img, 0, 0, width, height)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Échec de compression'))),
      'image/jpeg',
      qualite,
    )
  })

  const dataUrl = await blobEnDataUrl(blob)
  const base64 = dataUrl.split(',')[1] ?? ''

  return { blob, base64, dataUrl }
}

function lireFichierEnDataUrl(fichier: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(fichier)
  })
}

function blobEnDataUrl(blob: Blob): Promise<string> {
  return lireFichierEnDataUrl(blob)
}

function chargerImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
