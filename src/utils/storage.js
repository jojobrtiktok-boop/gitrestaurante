import { supabase } from '../lib/supabase.js'

/**
 * Faz upload de um arquivo para o Supabase Storage (bucket 'imagens')
 * e retorna a URL pública.
 *
 * @param {File} file - arquivo de imagem
 * @param {string} pasta - subpasta no bucket: 'pratos' | 'logos' | 'perfil'
 * @param {string} [nomeFixo] - se informado, usa esse nome (ex: logo-{userId}) e faz upsert
 * @returns {Promise<string>} URL pública permanente
 */
export async function uploadImagem(file, pasta = 'geral', nomeFixo = null) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const nome = nomeFixo
    ? `${pasta}/${nomeFixo}.${ext}`
    : `${pasta}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabase.storage
    .from('imagens')
    .upload(nome, file, {
      upsert: true,
      contentType: file.type || 'image/jpeg',
      cacheControl: '31536000', // 1 ano de cache no browser
    })

  if (error) throw new Error(`Upload falhou: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage
    .from('imagens')
    .getPublicUrl(data.path)

  return publicUrl
}

/**
 * Remove um arquivo do Supabase Storage dado sua URL pública.
 * Falha silenciosa — não quebra o fluxo se não conseguir remover.
 */
export async function removerImagem(url) {
  if (!url || url.startsWith('data:')) return // ignora base64 legado
  try {
    const path = url.split('/storage/v1/object/public/imagens/')[1]
    if (!path) return
    await supabase.storage.from('imagens').remove([path])
  } catch {}
}
