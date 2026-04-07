export const SONS_ALERTA = [
  { id: 'duplo',     label: 'Bip duplo (padrão)' },
  { id: 'tres',      label: 'Três bips' },
  { id: 'sino',      label: 'Sino' },
  { id: 'campainha', label: 'Campainha' },
  { id: 'suave',     label: 'Alerta suave' },
]

export function tocarSom(tipo = 'duplo') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()

    function bip(freq, inicio, duracao, volume = 0.3, tipo = 'square') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = tipo
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = freq
      gain.gain.setValueAtTime(volume, ctx.currentTime + inicio)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + inicio + duracao)
      osc.start(ctx.currentTime + inicio)
      osc.stop(ctx.currentTime + inicio + duracao)
    }

    if (tipo === 'duplo') {
      bip(880, 0, 0.4)
      bip(1100, 0.35, 0.3)
    } else if (tipo === 'tres') {
      bip(900, 0,    0.12)
      bip(900, 0.18, 0.12)
      bip(900, 0.36, 0.12)
    } else if (tipo === 'sino') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(1400, ctx.currentTime)
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2)
      osc.start(); osc.stop(ctx.currentTime + 1.2)
    } else if (tipo === 'campainha') {
      bip(800,  0,    0.14, 0.3, 'sine')
      bip(1200, 0.18, 0.14, 0.3, 'sine')
      bip(800,  0.36, 0.14, 0.3, 'sine')
      bip(1200, 0.54, 0.14, 0.3, 'sine')
    } else if (tipo === 'suave') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(400, ctx.currentTime)
      osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.5)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
      osc.start(); osc.stop(ctx.currentTime + 0.6)
    }
  } catch {}
}
