// Status das issues US005/US006.
const STATUS = {
  PRE_GUIA: { texto: 'Rascunho', classe: 'fx-selo-cinza' },
  COM_PENDENCIAS: { texto: 'Com pendências', classe: 'fx-selo-vermelho' },
  VALIDADA: { texto: 'Aguardando aprovação', classe: 'fx-selo-ambar' },
  APROVACAO_MEDICO_PENDENTE: { texto: 'Aguardando médico', classe: 'fx-selo-ambar' },
  APROVACAO_CHEFE_PENDENTE: { texto: 'Aguardando chefe', classe: 'fx-selo-ambar' },
  APROVADA: { texto: 'Aprovada', classe: 'fx-selo-verde' },
  REPROVADA: { texto: 'Reprovada', classe: 'fx-selo-vermelho' },
  EMITIDA: { texto: 'Guia emitida', classe: 'fx-selo-azul' }
}

export const EDITAVEIS = ['PRE_GUIA', 'COM_PENDENCIAS', 'REPROVADA']

export function ehAprovadaPeloMedico(preGuia) {
  if (!preGuia) return false
  if (preGuia.status === 'APROVACAO_MEDICO_PENDENTE') return false
  return Boolean(preGuia.medicoAprovou || preGuia.dataAprovacaoMedico)
}

export function ehAguardandoAprovacaoMedico(preGuia) {
  if (!preGuia) return false
  if (preGuia.status === 'REPROVADA' || preGuia.status === 'APROVADA' || preGuia.status === 'EMITIDA') return false
  if (preGuia.status === 'APROVACAO_MEDICO_PENDENTE') return true
  return (preGuia.status === 'VALIDADA' || !preGuia.status) && !ehAprovadaPeloMedico(preGuia)
}

export function ehAguardandoAprovacaoChefe(preGuia) {
  if (!preGuia) return false
  if (preGuia.status === 'REPROVADA' || preGuia.status === 'APROVADA' || preGuia.status === 'EMITIDA') return false
  if (preGuia.status === 'APROVACAO_MEDICO_PENDENTE') return false
  if (!ehAprovadaPeloMedico(preGuia)) return false
  const chefeAprovou = Boolean(preGuia.chefeAprovou || preGuia.dataAprovacaoChefe)
  return !chefeAprovou
}

export function filtrarFilaAprovacao(preGuias, perfil) {
  if (!Array.isArray(preGuias)) return []
  if (perfil === 'MEDICO') {
    return preGuias.filter(p => p.status !== 'REPROVADA')
  }
  if (perfil === 'CHEFE') {
    return preGuias.filter(p => p.status !== 'APROVACAO_MEDICO_PENDENTE' && p.status !== 'REPROVADA' && ehAprovadaPeloMedico(p))
  }
  return preGuias
}

export function filtrarFilaPendentes(preGuias, perfil) {
  if (!Array.isArray(preGuias)) return []
  if (perfil === 'MEDICO') {
    return preGuias.filter(ehAguardandoAprovacaoMedico)
  }
  if (perfil === 'CHEFE') {
    return preGuias.filter(ehAguardandoAprovacaoChefe)
  }
  return []
}

export function seloStatus(status) {
  return STATUS[status] || { texto: status, classe: 'fx-selo-cinza' }
}

// Situação de uma das duas aprovações (médico ou chefe) a partir do status e de quem já aprovou.
export function seloAprovacao(status, aprovou) {
  if (aprovou) return { texto: 'Aprovou', classe: 'fx-selo-verde' }
  if (status === 'VALIDADA' || status === 'APROVACAO_MEDICO_PENDENTE' || status === 'APROVACAO_CHEFE_PENDENTE') {
    return { texto: 'Pendente', classe: 'fx-selo-ambar' }
  }
  if (status === 'REPROVADA') return { texto: '—', classe: 'fx-selo-cinza' }
  return { texto: 'Aguardando envio', classe: 'fx-selo-cinza' }
}

// O back não tem número de pré-guia: o front mostra o id formatado.
export function numeroPreGuia(id) {
  return `PG ${String(id).padStart(3, '0')}`
}

// O back não tem número de guia: o front mostra o id da guia emitida formatado.
export function numeroGuia(id) {
  return `GE ${String(id).padStart(3, '0')}`
}
export const VALIDADE_DIAS = 60

export function somarDias(data, dias) {
  const resultado = new Date(`${data}T00:00:00`)
  resultado.setDate(resultado.getDate() + dias)
  return resultado.toISOString().slice(0, 10)
}
