const STATUS = {
  AGUARDANDO_APROVACAO: { texto: 'Aguardando aprovação', classe: 'fx-selo-ambar' },
  DEVOLVIDA: { texto: 'Devolvida para correção', classe: 'fx-selo-vermelho' },
  APROVADA: { texto: 'Aprovada', classe: 'fx-selo-verde' },
  REPROVADA: { texto: 'Negada', classe: 'fx-selo-vermelho' },
  EMITIDA: { texto: 'Guia emitida', classe: 'fx-selo-azul' }
}

const DECISAO = {
  PENDENTE: { texto: 'Pendente', classe: 'fx-selo-ambar' },
  APROVADA: { texto: 'Aprovou', classe: 'fx-selo-verde' },
  DEVOLVIDA: { texto: 'Devolveu', classe: 'fx-selo-vermelho' },
  NEGADA: { texto: 'Negou', classe: 'fx-selo-vermelho' }
}

export const CARATER = {
  ELETIVO: 'Eletivo',
  URGENCIA: 'Urgência'
}

export function seloStatus(status) {
  return STATUS[status] || { texto: status, classe: 'fx-selo-cinza' }
}

export function seloDecisao(decisao) {
  return DECISAO[decisao] || { texto: decisao, classe: 'fx-selo-cinza' }
}

// Observações de quem devolveu ou negou, para o emissor saber o que corrigir.
export function apontamentos(preGuia) {
  return [
    { quem: 'Médico', ...preGuia.aprovacaoMedico },
    { quem: 'Chefe do FUSEx', ...preGuia.aprovacaoChefe }
  ].filter(a => a.observacao)
}
