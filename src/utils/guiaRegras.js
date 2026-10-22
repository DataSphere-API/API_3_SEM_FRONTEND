export function semAcento(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
}

function statusComecaCom(status, prefixo) {
  return semAcento(status).startsWith(prefixo)
}

export function guiaExpirada(guia) {
  return statusComecaCom(guia?.status, 'EXPIRAD')
}

export function paraNumero(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return null
  }

  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : null
}

export function rotuloStatus(status) {
  const texto = String(status ?? '').trim().replace(/_/g, ' ').toLowerCase()

  if (!texto) {
    return 'Sem status'
  }

  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function tomStatus(status) {
  if (statusComecaCom(status, 'EXPIRAD')) {
    return 'vermelho'
  }

  if (statusComecaCom(status, 'REALIZAD')) {
    return 'verde'
  }

  if (!semAcento(status)) {
    return 'cinza'
  }

  return 'azul'
}

export function resumoSessoes(procedimento) {
  const realizada = paraNumero(procedimento?.qtdRealizada)
  const autorizada = paraNumero(procedimento?.qtdAutorizada)

  if (realizada === null || autorizada === null || autorizada <= 0) {
    return { realizada, autorizada, texto: 'Sessões não informadas', percentual: 0 }
  }

  const percentual = Math.min(100, Math.max(0, Math.round((realizada / autorizada) * 100)))

  return { realizada, autorizada, texto: `${realizada}/${autorizada} sessões`, percentual }
}

export function alertaValidade(guia) {
  const dias = paraNumero(guia?.diasRestantes)

  if (dias === null || dias >= 10 || guiaExpirada(guia)) {
    return ''
  }

  if (dias < 0) {
    return 'A validade desta guia já terminou.'
  }

  if (dias === 0) {
    return 'Atenção: a guia vence hoje.'
  }

  if (dias === 1) {
    return 'Atenção: a guia vence em 1 dia.'
  }

  return `Atenção: a guia vence em ${dias} dias.`
}

export function situacaoQr(guia, procedimento) {
  if (guiaExpirada(guia)) {
    return { exibir: false, mensagem: 'Guia expirada: QR Code indisponível.' }
  }

  if (statusComecaCom(procedimento?.status, 'REALIZAD')) {
    return { exibir: false, mensagem: 'Procedimento já realizado: QR Code indisponível.' }
  }

  if (statusComecaCom(procedimento?.status, 'EXPIRAD')) {
    return { exibir: false, mensagem: 'Procedimento expirado: QR Code indisponível.' }
  }

  const realizada = paraNumero(procedimento?.qtdRealizada)
  const autorizada = paraNumero(procedimento?.qtdAutorizada)

  if (realizada === null || autorizada === null || autorizada <= 0) {
    return { exibir: false, mensagem: 'Quantidade de sessões não informada.' }
  }

  if (realizada < autorizada) {
    const faltam = autorizada - realizada
    const mensagem = faltam === 1 ? 'Falta 1 sessão.' : `Faltam ${faltam} sessões.`
    return { exibir: false, mensagem }
  }

  if (realizada > autorizada) {
    return { exibir: false, mensagem: 'Dados de sessões inconsistentes.' }
  }

  if (procedimento?.atendimentoId === null || procedimento?.atendimentoId === undefined) {
    return { exibir: false, mensagem: 'Atendimento não identificado.' }
  }

  return { exibir: true, mensagem: '' }
}