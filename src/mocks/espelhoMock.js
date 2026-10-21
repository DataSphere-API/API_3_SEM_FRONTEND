// Espelho = os atendimentos realizados de uma OCS num período (cada item é um atendimento, com o valor
// que a OCS cobra). O auditor recebe cada item com o valor do contrato para comparar (US002).
// Reprovado, ele volta para a OCS corrigir e reenviar o mesmo espelho (sem criar outro).
import { banco, persistir, proximoId, copiar, registrarHistorico } from './bancoMock.js'
import { erroHttp, esperar } from './auxiliares.js'
import { atendimentos } from './checkMutuoMock.js'

function resumo(espelho) {
  const db = banco()
  const itens = db.espelhoItens.filter(i => i.espelhoId === espelho.id)
  return {
    id: espelho.id,
    ocsId: espelho.ocsId,
    ocsNome: db.ocs.find(o => o.cnpj === espelho.ocsId)?.nome || espelho.ocsId,
    dataInicio: espelho.dataInicio,
    dataFim: espelho.dataFim,
    status: espelho.status,
    dataAtualizacao: espelho.dataAtualizacao,
    quantidadeItens: itens.length,
    valorTotal: itens.reduce((total, i) => total + i.valor, 0),
    motivoReprovacao: espelho.motivoReprovacao,
    // Quantas vezes o auditor já devolveu: sai do historico_status, sem coluna nova.
    devolucoes: db.historico.filter(
      h => h.entidadeTipo === 'ESPELHO' && h.entidadeId === espelho.id && h.statusNovo === 'REPROVADO'
    ).length
  }
}

function encontrar(id) {
  const espelho = banco().espelhos.find(e => e.id === Number(id))
  if (!espelho) {
    throw erroHttp(404, { codigo: 'ESPELHO_NAO_ENCONTRADO', mensagem: 'Espelho não encontrado.' })
  }
  return espelho
}

// Valor do contrato do procedimento do atendimento com a OCS (Guia_Proc → Contrato, US001-2).
function valorContratado(atendimentoId) {
  const db = banco()
  const procedimento = db.preGuias.flatMap(p => p.procedimentos).find(p => p.atendimentoId === atendimentoId)
  if (!procedimento) return null
  const contrato = db.contratos.find(
    c => c.procedimentoId === procedimento.procedimentoId && c.ocsCnpj === procedimento.ocsCnpj
  )
  return contrato ? contrato.valor : null
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
      .map(i => ({
        id: i.id,
        atendimentoId: i.atendimentoId,
        beneficiarioId: i.beneficiarioId,
        descricao: i.descricao,
        valor: i.valor,
        valorContratado: valorContratado(i.atendimentoId)
      }))
  )
}

// POST /espelhos: { ocsId, dataInicio, dataFim, itens: [{ atendimentoId, valor }] }
export async function mockCriarEspelho({ ocsId, dataInicio, dataFim, itens }) {
  await esperar(400)
  const db = banco()
  if (!dataInicio || !dataFim || dataFim < dataInicio) {
    throw erroHttp(400, { codigo: 'PERIODO_INVALIDO', mensagem: 'Informe um período válido.' })
  }
  if (!itens?.length) {
    throw erroHttp(400, { codigo: 'ITENS_OBRIGATORIOS', mensagem: 'Escolha pelo menos um atendimento.' })
  }
  const lista = atendimentos()
  const novos = itens.map(item => {
    const atendimento = lista.find(a => a.atendimentoId === Number(item.atendimentoId))
    if (!atendimento || atendimento.ocs.cnpj !== ocsId) {
      throw erroHttp(404, { codigo: 'ATENDIMENTO_NAO_ENCONTRADO', mensagem: `Atendimento ${item.atendimentoId} não é desta OCS.` })
    }
    if (atendimento.statusProcedimento !== 'REALIZADA') {
      throw erroHttp(422, { codigo: 'ATENDIMENTO_NAO_REALIZADO', mensagem: `O atendimento ${item.atendimentoId} ainda não foi confirmado pelo beneficiário.` })
    }
    const dia = atendimento.dataRealizacao.slice(0, 10)
    if (dia < dataInicio || dia > dataFim) {
      throw erroHttp(422, { codigo: 'FORA_DO_PERIODO', mensagem: `O atendimento ${item.atendimentoId} foi realizado fora do período.` })
    }
    if (atendimento.espelhoId) {
      throw erroHttp(409, { codigo: 'ATENDIMENTO_JA_EM_ESPELHO', mensagem: `O atendimento ${item.atendimentoId} já está no espelho #${atendimento.espelhoId}.` })
    }
    if (!(Number(item.valor) > 0)) {
      throw erroHttp(400, { codigo: 'VALOR_INVALIDO', mensagem: 'Informe o valor cobrado de cada atendimento.' })
    }
    return { atendimento, valor: Number(item.valor) }
  })

  const espelho = {
    id: proximoId(db.espelhos),
    // Espelho.Atendimento_ID (NOT NULL e UNIQUE no banco) fica com o primeiro atendimento;
    // a lista completa está em Espelho_Item.Atendimento_ID.
    atendimentoId: novos[0].atendimento.atendimentoId,
    ocsId,
    dataInicio,
    dataFim,
    status: 'EM_ABERTO',
    dataAtualizacao: null,
    motivoReprovacao: null
  }
  db.espelhos.push(espelho)
  let proximoItem = proximoId(db.espelhoItens)
  novos.forEach(({ atendimento, valor }) =>
    db.espelhoItens.push({
      id: proximoItem++,
      espelhoId: espelho.id,
      atendimentoId: atendimento.atendimentoId,
      beneficiarioId: atendimento.beneficiario.precCp,
      descricao: atendimento.procedimento,
      valor
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
  // Aprovado limpa o motivo; reenviado mantém o último motivo para o auditor conferir a correção.
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

// ---------- Correção pela OCS de um espelho reprovado ----------

function espelhoParaCorrigir(id) {
  const espelho = encontrar(id)
  if (espelho.status !== 'REPROVADO') {
    throw erroHttp(409, { codigo: 'ESPELHO_NAO_REPROVADO', mensagem: 'Só dá para corrigir um espelho reprovado pelo auditor.' })
  }
  return espelho
}

function itemDo(espelho, itemId) {
  const item = banco().espelhoItens.find(i => i.id === Number(itemId) && i.espelhoId === espelho.id)
  if (!item) {
    throw erroHttp(404, { codigo: 'ITEM_NAO_ENCONTRADO', mensagem: 'Item não encontrado neste espelho.' })
  }
  return item
}

// PATCH /espelhos/{id}/itens/{itemId} (US001-5): a OCS corrige o valor cobrado.
export async function mockCorrigirItemEspelho(id, itemId, { valor }) {
  await esperar(250)
  const espelho = espelhoParaCorrigir(id)
  if (!(Number(valor) > 0)) {
    throw erroHttp(400, { codigo: 'VALOR_INVALIDO', mensagem: 'O valor precisa ser maior que zero.' })
  }
  itemDo(espelho, itemId).valor = Number(valor)
  espelho.dataAtualizacao = new Date().toISOString()
  persistir()
}

// DELETE /espelhos/{id}/itens/{itemId} (US001-5): a OCS tira um atendimento do espelho.
export async function mockRemoverItemEspelho(id, itemId) {
  await esperar(250)
  const espelho = espelhoParaCorrigir(id)
  const item = itemDo(espelho, itemId)
  const db = banco()
  const restantes = db.espelhoItens.filter(i => i.espelhoId === espelho.id && i.id !== item.id)
  if (restantes.length === 0) {
    throw erroHttp(422, { codigo: 'ESPELHO_SEM_ITENS', mensagem: 'O espelho precisa ter pelo menos um atendimento.' })
  }
  db.espelhoItens = db.espelhoItens.filter(i => i.id !== item.id)
  if (espelho.atendimentoId === item.atendimentoId) espelho.atendimentoId = restantes[0].atendimentoId
  espelho.dataAtualizacao = new Date().toISOString()
  persistir()
}

// POST /espelhos/{id}/reenviar: volta para a auditoria marcado como devolução corrigida.
export async function mockReenviarEspelho(id) {
  await esperar(400)
  const espelho = espelhoParaCorrigir(id)
  espelho.status = 'EM_ABERTO'
  espelho.dataAtualizacao = new Date().toISOString()
  registrarHistorico('ESPELHO', espelho.id, 'REPROVADO', 'EM_ABERTO', 'reenvio-pela-ocs')
  persistir()
  return resumo(espelho)
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
