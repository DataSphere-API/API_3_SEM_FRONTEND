const STATUS = {
  PRE_GUIA: 'Rascunho',
  COM_PENDENCIAS: 'Com pendências',
  VALIDADA: 'Validada (aguardando aprovação)',
  APROVADA: 'Aprovada',
  REPROVADA: 'Reprovada',
  EMITIDA: 'Guia emitida',
  PARCIALMENTE_REALIZADA: 'Parcialmente realizada',
  FINALIZADA: 'Finalizada (todos os procedimentos realizados)',
  EXPIRADA: 'Expirada',
  PENDENTE: 'A realizar',
  EM_ANDAMENTO: 'Em andamento',
  REALIZADA: 'Realizado',
  REALIZADO: 'Realizado',
  FATURADA: 'Faturado',
  EM_ABERTO: 'Recebido para auditoria',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado e devolvido à OCS',
  FATURADO: 'Faturado',
  CANCELADO: 'Cancelado',
  ATIVA: 'Fatura aberta',
  REGERADA: 'Fatura regerada',
  ENCAMINHADA_APROVACAO: 'Encaminhada para aprovação',
  LIQUIDADA: 'Fatura liquidada'
}

// Origens gravadas pelo back em historico_status.
const ORIGEM = {
  'criacao-pre-guia': 'Criada pelo emissor',
  'edicao-pre-guia': 'Editada pelo emissor',
  'validacao-pre-guia': 'Validação da pré-guia pelo sistema',
  'aprovacao-medico': 'Aprovado pelo médico responsável',
  'aprovacao-chefe': 'Aprovado pelo Chefe do FUSEx',
  'reprovacao-pre-guia': 'Reprovado na análise da pré-guia',
  'emissao-da-guia': 'Guia emitida pelo FUSEx',
  'registro-sessao': 'Sessão registrada pela clínica',
  'validacao-qrcode': 'Validado pela clínica por QR Code',
  'expiracao-de-guias': 'Prazo de validade vencido (expiração automática)',
  'criacao-espelho': 'Enviado pela OCS',
  'auditoria-aprovacao': 'Aprovado na auditoria',
  'auditoria-reprovacao': 'Reprovado na auditoria',
  'reenvio-espelho': 'Corrigido e reenviado pela OCS',
  'inclusao-na-fatura': 'Incluído na fatura do mês',
  'aprovacao-do-espelho': 'Aberta com o primeiro espelho aprovado do mês',
  'encaminhamento-para-aprovacao': 'Encaminhada para aprovação',
  'aprovacao-da-fatura': 'Fatura aprovada pelo auditor',
  'liquidacao-da-fatura': 'Pagamento da fatura registrado',
  sistema: 'Registrado pelo sistema'
}

const ENTIDADE = {
  PRE_GUIA: 'Pré-guia',
  GUIA: 'Guia',
  GUIA_PROC: 'Procedimento',
  ESPELHO: 'Espelho',
  FATURA: 'Fatura'
}

// Título de cada evento: o que aconteceu, a partir da entidade e do status novo.
const TITULO = {
  PRE_GUIA: {
    PRE_GUIA: 'Pré-guia criada',
    COM_PENDENCIAS: 'Validação encontrou pendências',
    VALIDADA: 'Pré-guia validada',
    APROVADA: 'Pré-guia aprovada',
    REPROVADA: 'Pré-guia reprovada',
    EMITIDA: 'Pré-guia virou guia'
  },
  GUIA: {
    EMITIDA: 'Guia emitida',
    PARCIALMENTE_REALIZADA: 'Guia parcialmente realizada',
    FINALIZADA: 'Todos os procedimentos realizados',
    EXPIRADA: 'Guia expirada'
  },
  GUIA_PROC: {
    PENDENTE: 'Procedimento liberado para a clínica',
    EM_ANDAMENTO: 'Primeira sessão realizada',
    REALIZADA: 'Baixa final por QR Code',
    FATURADA: 'Procedimento faturado',
    EXPIRADA: 'Procedimento expirado'
  },
  ESPELHO: {
    EM_ABERTO: 'Espelho enviado para auditoria',
    APROVADO: 'Espelho aprovado',
    REPROVADO: 'Espelho devolvido à OCS',
    FATURADO: 'Espelho incluído na fatura',
    CANCELADO: 'Espelho cancelado'
  },
  FATURA: {
    ATIVA: 'Fatura do mês aberta',
    ENCAMINHADA_APROVACAO: 'Fatura encaminhada para aprovação',
    APROVADA: 'Fatura aprovada',
    LIQUIDADA: 'Fatura liquidada'
  }
}

function buscar(mapa, valor, vazio, normalizar) {
  const original = String(valor ?? '').trim()
  if (!original) return vazio
  return mapa[original] ?? mapa[normalizar(original)] ?? original
}

export function traduzirStatusHistorico(status) {
  return buscar(STATUS, status, 'Status não informado', t => t.toUpperCase())
}

export function traduzirOrigemHistorico(origem) {
  return buscar(ORIGEM, origem, 'Origem não informada', t => t.toLowerCase())
}

export function traduzirEntidadeHistorico(tipo) {
  return buscar(ENTIDADE, tipo, '', t => t.toUpperCase())
}

export function tituloDoEvento(evento) {
  const entidade = String(evento?.entidadeTipo ?? '').toUpperCase()
  const status = String(evento?.statusNovo ?? '').toUpperCase()
  if (entidade === 'PRE_GUIA' && status === 'PRE_GUIA' && evento.statusAnterior) return 'Pré-guia editada'
  if (entidade === 'ESPELHO' && status === 'EM_ABERTO' && evento.statusAnterior) return 'Espelho corrigido e reenviado'
  const titulo = TITULO[entidade]?.[status]
  if (titulo) return titulo
  const nome = traduzirEntidadeHistorico(entidade)
  return nome ? `${nome} · ${traduzirStatusHistorico(status)}` : traduzirStatusHistorico(status)
}
