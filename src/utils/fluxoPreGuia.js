// Status das issues US005/US006.
const STATUS = {
  PRE_GUIA: { texto: 'Rascunho', classe: 'fx-selo-cinza' },
  COM_PENDENCIAS: { texto: 'Com pendências', classe: 'fx-selo-vermelho' },
  VALIDADA: { texto: 'Aguardando aprovação', classe: 'fx-selo-ambar' },
  APROVADA: { texto: 'Aprovada', classe: 'fx-selo-verde' },
  REPROVADA: { texto: 'Reprovada', classe: 'fx-selo-vermelho' },
  EMITIDA: { texto: 'Guia emitida', classe: 'fx-selo-azul' }
}

export const EDITAVEIS = ['PRE_GUIA', 'COM_PENDENCIAS']

export function seloStatus(status) {
  return STATUS[status] || { texto: status, classe: 'fx-selo-cinza' }
}

// Situação de uma das duas aprovações (médico ou chefe) a partir do status e de quem já aprovou.
export function seloAprovacao(status, aprovou) {
  if (aprovou) return { texto: 'Aprovou', classe: 'fx-selo-verde' }
  if (status === 'VALIDADA') return { texto: 'Pendente', classe: 'fx-selo-ambar' }
  if (status === 'REPROVADA') return { texto: '—', classe: 'fx-selo-cinza' }
  return { texto: 'Aguardando envio', classe: 'fx-selo-cinza' }
}

// O back não tem número de pré-guia: o front mostra o id formatado.
export function numeroPreGuia(id) {
  return `PG ${String(id).padStart(3, '0')}`
}

export const VALIDADE_DIAS = 60

export function somarDias(data, dias) {
  const resultado = new Date(`${data}T00:00:00`)
  resultado.setDate(resultado.getDate() + dias)
  return resultado.toISOString().slice(0, 10)
}
