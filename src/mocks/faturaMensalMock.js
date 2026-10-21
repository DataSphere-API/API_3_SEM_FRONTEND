// Fatura mensal por OCS: quando o auditor aprova um espelho, os itens dele entram na fatura da OCS
// no mês do espelho. Não existe mais "gerar" nem "regerar" fatura pela tela.
// No banco: Item_Fatura → Espelho_Item já liga itens de vários espelhos; a competência sai do período
// dos espelhos (todos do mesmo mês), sem coluna nova.
import { banco, persistir, proximoId, copiar, registrarHistorico, valorContratadoDoAtendimento } from './bancoMock.js'
import { erroHttp, esperar } from './auxiliares.js'
import { competenciaDe, mesEncerrado } from '../utils/competencia.js'

const PENDENTES = ['EM_ABERTO', 'REPROVADO']

// Chamado pela aprovação do espelho (PATCH /espelhos/{id}/aprovar).
export function incluirEspelhoNaFatura(espelho) {
  const db = banco()
  const competencia = competenciaDe(espelho.dataInicio)
  let fatura = db.faturas.find(f => f.ocsId === espelho.ocsId && f.competencia === competencia)
  if (fatura && fatura.status !== 'ATIVA') {
    throw erroHttp(409, { codigo: 'FATURA_JA_ENCAMINHADA', mensagem: 'A fatura deste mês já foi encaminhada.' })
  }
  if (!fatura) {
    fatura = {
      id: proximoId(db.faturas),
      ocsId: espelho.ocsId,
      competencia,
      espelhoId: espelho.id,
      guiaProcId: espelho.atendimentoId,
      status: 'ATIVA',
      dataGeracao: new Date().toISOString(),
      dataEncaminhamento: null
    }
    db.faturas.push(fatura)
    registrarHistorico('FATURA', fatura.id, null, 'ATIVA', 'aprovacao-do-espelho')
  }
  let proximoItem = proximoId(db.itensFatura)
  db.espelhoItens
    .filter(i => i.espelhoId === espelho.id)
    .forEach(item => {
      const valorContratado = valorContratadoDoAtendimento(item.atendimentoId)
      db.itensFatura.push({
        id: proximoItem++,
        faturaId: fatura.id,
        espelhoItemId: item.id,
        valorApresentado: item.valor,
        valorContratado,
        divergenciaValor: valorContratado === null ? null : item.valor - valorContratado
      })
    })
  return fatura
}

function espelhosDa(fatura) {
  const db = banco()
  const ids = new Set(
    db.itensFatura
      .filter(i => i.faturaId === fatura.id)
      .map(i => db.espelhoItens.find(e => e.id === i.espelhoItemId)?.espelhoId)
  )
  return db.espelhos.filter(e => ids.has(e.id))
}

// Espelhos da mesma OCS e mês que ainda estão na auditoria ou voltaram para correção.
function espelhosPendentes(fatura) {
  return banco().espelhos.filter(
    e => e.ocsId === fatura.ocsId && competenciaDe(e.dataInicio) === fatura.competencia && PENDENTES.includes(e.status)
  )
}

function resumo(fatura) {
  const db = banco()
  const itens = db.itensFatura.filter(i => i.faturaId === fatura.id)
  return {
    id: fatura.id,
    ocsId: fatura.ocsId,
    ocsNome: db.ocs.find(o => o.cnpj === fatura.ocsId)?.nome || fatura.ocsId,
    competencia: fatura.competencia,
    status: fatura.status,
    quantidadeEspelhos: espelhosDa(fatura).length,
    quantidadeItens: itens.length,
    valorApresentado: itens.reduce((soma, i) => soma + i.valorApresentado, 0),
    valorContratado: itens.reduce((soma, i) => soma + (i.valorContratado ?? 0), 0),
    espelhosPendentes: espelhosPendentes(fatura).length,
    dataGeracao: fatura.dataGeracao,
    dataEncaminhamento: fatura.dataEncaminhamento
  }
}

function encontrar(id) {
  const fatura = banco().faturas.find(f => f.id === Number(id))
  if (!fatura) {
    throw erroHttp(404, { codigo: 'FATURA_NAO_ENCONTRADA', mensagem: 'Fatura não encontrada.' })
  }
  return fatura
}

export async function mockListarFaturas({ cnpj, competencia } = {}) {
  await esperar(300)
  return banco()
    .faturas.filter(f => (!cnpj || f.ocsId === cnpj) && (!competencia || f.competencia === competencia))
    .map(resumo)
}

// Detalhe: os espelhos da fatura com os itens (cobrado x contrato).
export async function mockBuscarFatura(id) {
  await esperar(250)
  const fatura = encontrar(id)
  const db = banco()
  const itens = db.itensFatura.filter(i => i.faturaId === fatura.id)
  return copiar({
    ...resumo(fatura),
    espelhos: espelhosDa(fatura).map(espelho => ({
      espelhoId: espelho.id,
      dataInicio: espelho.dataInicio,
      dataFim: espelho.dataFim,
      itens: itens
        .map(i => ({ ...i, espelhoItem: db.espelhoItens.find(e => e.id === i.espelhoItemId) }))
        .filter(i => i.espelhoItem?.espelhoId === espelho.id)
        .map(i => ({
          id: i.id,
          atendimentoId: i.espelhoItem.atendimentoId,
          descricao: i.espelhoItem.descricao,
          beneficiarioId: i.espelhoItem.beneficiarioId,
          valorApresentado: i.valorApresentado,
          valorContratado: i.valorContratado,
          divergenciaValor: i.divergenciaValor
        }))
    })),
    pendentes: espelhosPendentes(fatura).map(e => ({ espelhoId: e.id, status: e.status }))
  })
}

// POST /faturas/{id}/encaminhar (US002-3): só depois que o mês acabou e sem espelho pendente.
export async function mockEncaminharFatura(id) {
  await esperar(400)
  const fatura = encontrar(id)
  if (fatura.status !== 'ATIVA') {
    throw erroHttp(409, { codigo: 'FATURA_NAO_ENCAMINHAVEL', mensagem: 'Esta fatura já foi encaminhada.' })
  }
  if (!mesEncerrado(fatura.competencia)) {
    throw erroHttp(422, { codigo: 'MES_NAO_ENCERRADO', mensagem: 'A fatura só pode ser encaminhada depois que o mês acabar.' })
  }
  if (espelhosPendentes(fatura).length) {
    throw erroHttp(422, { codigo: 'AUDITORIA_PENDENTE', mensagem: 'Ainda há espelhos deste mês na auditoria ou em correção pela OCS.' })
  }
  fatura.status = 'ENCAMINHADA_APROVACAO'
  fatura.dataEncaminhamento = new Date().toISOString()
  registrarHistorico('FATURA', fatura.id, 'ATIVA', 'ENCAMINHADA_APROVACAO', 'encaminhamento-para-aprovacao')
  persistir()
  return { faturaId: fatura.id, status: fatura.status, dataEncaminhamento: fatura.dataEncaminhamento }
}
