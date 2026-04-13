// ESC/POS thermal printer utility via WebUSB or Web Serial

// ── ESC/POS command bytes ────────────────────────────────────────────────────
const ESC = 0x1b
const GS  = 0x1d
const LF  = 0x0a

const CMD = {
  init:        [ESC, 0x40],
  bold_on:     [ESC, 0x45, 0x01],
  bold_off:    [ESC, 0x45, 0x00],
  center:      [ESC, 0x61, 0x01],
  left:        [ESC, 0x61, 0x00],
  right:       [ESC, 0x61, 0x02],
  size_normal: [GS,  0x21, 0x00],
  size_big:    [GS,  0x21, 0x11],
  cut:         [GS,  0x56, 0x41, 0x10],
  feed2:       [ESC, 0x64, 0x02],
  feed4:       [ESC, 0x64, 0x04],
}

function enc(str) {
  return Array.from(new TextEncoder().encode(str))
}

function line(str = '') {
  return [...enc(str), LF]
}

function dashed(len = 32) {
  return line('-'.repeat(len))
}

function padRight(str, w) {
  return str.slice(0, w).padEnd(w, ' ')
}

function padLeft(str, w) {
  return str.slice(0, w).padStart(w, ' ')
}

function row(left, right, w = 32) {
  const r = String(right)
  const l = String(left).slice(0, w - r.length - 1)
  return line(l.padEnd(w - r.length, ' ') + r)
}

// ── Build comanda bytes ──────────────────────────────────────────────────────
export function buildComanda(pedido, pratos, nomeRestaurante = 'Restaurante') {
  const bytes = []
  const push  = (...cmds) => cmds.forEach(c => bytes.push(...c))

  push(CMD.init, CMD.center, CMD.size_big, CMD.bold_on)
  push(line(nomeRestaurante.slice(0, 16)))
  push(CMD.size_normal, CMD.bold_off)
  push(line('COMANDA'))
  push(CMD.left)
  push(dashed())

  const hora = pedido.hora || '--:--'
  const mesa = pedido.mesaId ? `Mesa: ${pedido.mesaId.slice(-4)}` : (pedido.canal === 'delivery' ? 'DELIVERY' : 'Balcão')
  push(row(`#${pedido.id.slice(-4).toUpperCase()}`, hora))
  push(line(mesa))
  if (pedido.clienteNome) push(line(`Cliente: ${pedido.clienteNome}`))
  if (pedido.enderecoEntrega) push(line(`End: ${pedido.enderecoEntrega.slice(0, 30)}`))
  push(dashed())

  ;(pedido.itens || []).forEach(item => {
    const prato = pratos.find(p => p.id === item.pratoId)
    const nome  = prato?.nome || item.pratoId
    push(CMD.bold_on)
    push(line(`x${item.quantidade} ${nome}`))
    push(CMD.bold_off)
    if (item.opcoes?.length) {
      item.opcoes.forEach(o => push(line(`  > ${o.nome}`)))
    }
  })

  if (pedido.obs) {
    push(dashed())
    push(CMD.bold_on, line('OBS:'), CMD.bold_off)
    push(line(pedido.obs.slice(0, 100)))
  }

  push(dashed(), CMD.feed4, CMD.cut)
  return new Uint8Array(bytes)
}

// ── WebUSB ───────────────────────────────────────────────────────────────────
let usbDevice = null

export async function conectarUSB() {
  try {
    usbDevice = await navigator.usb.requestDevice({ filters: [] })
    await usbDevice.open()
    if (usbDevice.configuration === null) await usbDevice.selectConfiguration(1)
    await usbDevice.claimInterface(0)
    return { ok: true }
  } catch (e) {
    return { ok: false, erro: e.message }
  }
}

export async function imprimirUSB(dados) {
  if (!usbDevice) return { ok: false, erro: 'Impressora não conectada' }
  try {
    const ep = usbDevice.configuration.interfaces[0].alternates[0].endpoints
      .find(e => e.direction === 'out')
    if (!ep) return { ok: false, erro: 'Endpoint OUT não encontrado' }
    await usbDevice.transferOut(ep.endpointNumber, dados)
    return { ok: true }
  } catch (e) {
    return { ok: false, erro: e.message }
  }
}

// ── Web Serial ───────────────────────────────────────────────────────────────
let serialPort = null

export async function conectarSerial() {
  try {
    serialPort = await navigator.serial.requestPort()
    await serialPort.open({ baudRate: 9600 })
    return { ok: true }
  } catch (e) {
    return { ok: false, erro: e.message }
  }
}

export async function imprimirSerial(dados) {
  if (!serialPort) return { ok: false, erro: 'Porta serial não conectada' }
  try {
    const writer = serialPort.writable.getWriter()
    await writer.write(dados)
    writer.releaseLock()
    return { ok: true }
  } catch (e) {
    return { ok: false, erro: e.message }
  }
}

// ── Detecta suporte ──────────────────────────────────────────────────────────
export const suportaUSB    = () => !!navigator.usb
export const suportaSerial = () => !!navigator.serial
export const usbConectado    = () => !!usbDevice
export const serialConectado = () => !!serialPort
