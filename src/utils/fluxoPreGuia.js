const STATUS = {
  PRE_GUIA: { texto: 'Rascunho', classe: 'fx-selo-cinza' },
  COM_PENDENCIAS: { texto: 'Com pendências', classe: 'fx-selo-vermelho' },
  VALIDADA: { texto: 'Aguardando aprovação', classe: 'fx-selo-ambar' },
  APROVADA: { texto: 'Aprovada', classe: 'fx-selo-verde' },
  REPROVADA: { texto: 'Reprovada', classe: 'fx-selo-vermelho' },
  EMITIDA: { texto: 'Guia emitida', classe: 'fx-selo-azul' }
}

// A reprovada pode ser editada: ao salvar ela volta a rascunho e precisa de nova aprovação.
export const EDITAVEIS = ['PRE_GUIA', 'COM_PENDENCIAS', 'REPROVADA']
// Só rascunho e com pendências são enviados direto; a reprovada passa antes pela edição.
export const ENVIAVEIS = ['PRE_GUIA', 'COM_PENDENCIAS']

export function seloStatus(status) {
  return STATUS[status] || { texto: status, classe: 'fx-selo-cinza' }
}

export function seloAprovacao(preGuia) {
  const aprovada = ['APROVADA', 'EMITIDA'].includes(preGuia.status)
  if (aprovada && preGuia.medicoAprovou) return { texto: 'Aprovada pelo médico', classe: 'fx-selo-verde' }
  if (aprovada && preGuia.chefeAprovou) return { texto: 'Aprovada pelo chefe', classe: 'fx-selo-verde' }
  if (aprovada) return { texto: 'Aprovada', classe: 'fx-selo-verde' }
  if (preGuia.status === 'VALIDADA') return { texto: 'Aguardando médico ou chefe', classe: 'fx-selo-ambar' }
  if (preGuia.status === 'REPROVADA') return { texto: 'Reprovada', classe: 'fx-selo-vermelho' }
  return { texto: 'Aguardando envio', classe: 'fx-selo-cinza' }
}

const CARGO_DA_ASSINATURA = {
  MEDICO: 'Médico responsável',
  CHEFE: 'Chefe do FUSEx'
}

export function cargoDaAssinatura(perfil) {
  return CARGO_DA_ASSINATURA[perfil] || perfil
}

export function numeroPreGuia(id) {
  return `PG ${String(id).padStart(3, '0')}`
}

export function numeroGuia(id) {
  return `GE ${String(id).padStart(3, '0')}`
}
export const VALIDADE_DIAS = 60

export function somarDias(data, dias) {
  const resultado = new Date(`${data}T00:00:00`)
  resultado.setDate(resultado.getDate() + dias)
  return resultado.toISOString().slice(0, 10)
}
