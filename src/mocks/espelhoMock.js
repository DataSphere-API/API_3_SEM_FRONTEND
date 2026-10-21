// Espelhos no formato da US000-14 (EspelhoResumoResponse / EspelhoItemResponse),
// com o aprovar/reprovar do auditor e o histórico de status (US001-3).
import { banco, persistir, proximoId, copiar, registrarHistorico } from './bancoMock.js'
import { erroHttp, esperar } from './auxiliares.js'
import { atendimentos } from './checkMutuoMock.js'

function resumo(espelho) {
  const db = banco()
  const itens = db.espelhoItens.filter(i => i.espelhoId === espelho.id)
  return {
    id: espelho.id,
    atendimentoId: espelho.atendimentoId,
    ocsId: espelho.ocsId,
    dataInicio: espelho.dataInicio,
    dataFim: espelho.dataFim,
    status: espelho.status,
    dataAtualizacao: espelho.dataAtualizacao,
    ocsNome: db.ocs.find(o => o.cnpj === espelho.ocsId)?.nome || espelho.ocsId,
    quantidadeItens: itens.length,
    valorTotal: itens.reduce((total, i) => total + i.valor, 0),
    motivoReprovacao: espelho.motivoReprovacao
  }
}

function encontrar(id) {
  const espelho = banco().espelhos.find(e => e.id === Number(id))
  if (!espelho) {
    throw erroHttp(404, { codigo: 'ESPELHO_NAO_ENCONTRADO', mensagem: 'Espelho não encontrado.' })
  }
  return espelho
}

export async function mockListarEspelhos({ cnpj, status } = {}) {
  await esperar(300)
  return banco()
    .espelhos.filter(e => (!cnpj || e.ocsId === cnpj) && (!status || e.status === status))
    .map(resumo)
}

export async function mockListarItensEspelho(id) {
  await esperar(250)
  encontrar(id)
  return copiar(
    banco()
      .espelhoItens.filter(i => i.espelhoId === Number(id))
      .map(({ id: itemId, beneficiarioId, descricao, valor }) => ({ id: itemId, beneficiarioId, descricao, valor }))
  )
}

// POST /espelhos (US001-4): só para atendimento realizado e sem espelho.
export async function mockCriarEspelho({ atendimentoId, ocsId, itens }) {
  await esperar(400)
  const db = banco()
  const atendimento = atendimentos().find(a => a.atendimentoId === Number(atendimentoId))
  if (!atendimento || atendimento.ocs.cnpj !== ocsId) {
    throw erroHttp(404, { codigo: 'ATENDIMENTO_NAO_ENCONTRADO', mensagem: 'Atendimento não encontrado para esta OCS.' })
  }
  if (atendimento.statusProcedimento !== 'REALIZADA') {
    throw erroHttp(422, { codigo: 'ATENDIMENTO_NAO_REALIZADO', mensagem: 'O atendimento ainda não foi confirmado pelo beneficiário.' })
  }
  if (db.espelhos.some(e => e.atendimentoId === atendimento.atendimentoId)) {
    throw erroHttp(409, { codigo: 'ESPELHO_DUPLICADO', mensagem: 'Este atendimento já tem espelho.' })
  }
  if (!itens?.length) {
    throw erroHttp(400, { codigo: 'ITENS_OBRIGATORIOS', mensagem: 'Adicione pelo menos um item.' })
  }
  const hoje = new Date().toISOString().slice(0, 10)
  const espelho = {
    id: proximoId(db.espelhos),
    atendimentoId: atendimento.atendimentoId,
    ocsId,
    dataInicio: hoje,
    dataFim: hoje,
    status: 'EM_ABERTO',
    dataAtualizacao: null,
    motivoReprovacao: null
  }
  db.espelhos.push(espelho)
  let proximoItem = proximoId(db.espelhoItens)
  itens.forEach(item =>
    db.espelhoItens.push({
      id: proximoItem++,
      espelhoId: espelho.id,
      beneficiarioId: item.beneficiarioId || atendimento.beneficiario.precCp,
      descricao: item.descricao,
      valor: Number(item.valor)
    })
  )
  registrarHistorico('ESPELHO', espelho.id, null, 'EM_ABERTO', 'envio-pela-ocs')
  persistir()
  return resumo(espelho)
}

function decidir(id, statusNovo, motivo, origem) {
  const espelho = encontrar(id)
  if (espelho.status !== 'EM_ABERTO') {
    throw erroHttp(409, { codigo: 'ESPELHO_JA_AUDITADO', mensagem: 'Este espelho já foi auditado.' })
  }
  espelho.status = statusNovo
  espelho.motivoReprovacao = motivo
  espelho.dataAtualizacao = new Date().toISOString()
  registrarHistorico('ESPELHO', espelho.id, 'EM_ABERTO', statusNovo, origem)
  persistir()
  return resumo(espelho)
}

export async function mockAprovarEspelho(id) {
  await esperar(400)
  return decidir(id, 'APROVADO', null, 'auditoria')
}

export async function mockReprovarEspelho(id, motivo) {
  await esperar(400)
  if (!motivo?.trim()) {
    throw erroHttp(400, { codigo: 'MOTIVO_OBRIGATORIO', mensagem: 'O motivo da reprovação é obrigatório.' })
  }
  return decidir(id, 'REPROVADO', motivo.trim(), 'auditoria')
}

// GET /guias/{id}/historico (o id é do Guia_Proc = atendimento) e GET /espelhos/{id}/historico.
export async function mockHistorico(entidadeTipo, id) {
  await esperar(250)
  return copiar(
    banco()
      .historico.filter(h => h.entidadeTipo === entidadeTipo && h.entidadeId === Number(id))
      .sort((a, b) => a.data.localeCompare(b.data))
  )
}
