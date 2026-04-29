import { supabase } from '../lib/supabase.js'

// Comprime e redimensiona imagem via canvas antes do upload
async function comprimirImagem(file, maxW = 500, maxH = 500, quality = 0.72) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      const ratio = Math.min(maxW / width, maxH / height, 1)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => resolve(blob || file), 'image/webp', quality)
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

export async function uploadImagem(file, pasta = 'geral', nomeFixo = null, opcoes = {}) {
  const { maxW = 500, maxH = 500, quality = 0.72 } = opcoes
  const compressed = await comprimirImagem(file, maxW, maxH, quality)
  const nome = nomeFixo
    ? `${pasta}/${nomeFixo}.webp`
    : `${pasta}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`

  const { data, error } = await supabase.storage
    .from('imagens')
    .upload(nome, compressed, {
      upsert: true,
      contentType: 'image/webp',
      cacheControl: '31536000',
    })

  if (error) throw new Error(`Upload falhou: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage
    .from('imagens')
    .getPublicUrl(data.path)

  return publicUrl
}

/**
 * Retorna a URL da imagem — mantém a original pois as fotos já são
 * comprimidas em WebP 500px no upload (Storage transform é Pro only).
 */
export function imgSrc(url, _width) {
  return url || ''
}

/**
 * Remove um arquivo do Supabase Storage dado sua URL pública.
 * Falha silenciosa — não quebra o fluxo se não conseguir remover.
 */
export async function removerImagem(url) {
  if (!url || url.startsWith('data:')) return
  try {
    const path = url.split('/storage/v1/object/public/imagens/')[1]
    if (!path) return
    await supabase.storage.from('imagens').remove([path])
  } catch {}
}
