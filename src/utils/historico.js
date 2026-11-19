
const STATUS = {
  PRE_GUIA: 'Rascunho',
  COM_PENDENCIAS: 'Com pendências',
  VALIDADA: 'Validada (aguardando aprovação)',
  APROVADA: 'Aprovada',
  REPROVADA: 'Reprovada',
  EMITIDA: 'Guia emitida',
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

const ORIGEM = {
  'validacao-pre-guia': 'Validação da pré-guia pelo sistema',
  'aprovacao-medico': 'Aprovado pelo médico responsável',
  'aprovacao-chefe': 'Aprovado pelo Chefe do FUSEx',
  'reprovacao-pre-guia': 'Reprovado na análise da pré-guia',
  'emissao-da-guia': 'Guia emitida pelo FUSEx',
  'validacao-qrcode': 'Validado pela clínica por QR Code',
  'expiracao-de-guias': 'Prazo de validade vencido (expiração automática)',
  sistema: 'Registrado pelo sistema',
  'envio-pela-ocs': 'Enviado pela OCS',
  'reenvio-pela-ocs': 'Corrigido e reenviado pela OCS',
  auditoria: 'Auditoria',
  'aprovacao-do-espelho': 'Aberta com o primeiro espelho aprovado do mês',
  'encaminhamento-para-aprovacao': 'Encaminhada para aprovação',
  'regeracao-por-espelho-corrigido': 'Regerada após correção do espelho',
  'aprovacao-da-fatura': 'Fatura aprovada pelo auditor',
  'liquidacao-da-fatura': 'Pagamento da fatura registrado'
}

const ENTIDADE = {
  PRE_GUIA: 'Pré-guia',
  GUIA: 'Guia',
  GUIA_PROC: 'Procedimento',
  ESPELHO: 'Espelho',
  FATURA: 'Fatura'
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
const ETAPA = {
  SOLICITACAO: 'Solicitação',
  APROVACAO: 'Aprovação',
  EMISSAO: 'Emissão',
  ATENDIMENTO: 'Atendimento',
  ESPELHO: 'Espelho',
  FATURA: 'Fatura'
}

export function traduzirEtapaLinhaDoTempo(etapa) {
  return buscar(ETAPA, etapa, 'Etapa não informada', t => t.toUpperCase())
}