// Check mútuo sem coluna nova no banco: o pedido da OCS vira o status AGUARDANDO_CONFIRMACAO do
// Guia_Proc, e a linha em Sessao_Procedimento só é gravada quando o beneficiário confirma.
import { banco, persistir, proximoId, copiar, registrarHistorico } from './bancoMock.js'
import { erroHttp, esperar } from './auxiliares.js'
import { sessao } from '../stores/sessao.js'
import { numeroPreGuia, somarDias, VALIDADE_DIAS } from '../utils/fluxoPreGuia.js'

function hoje() {
  return new Date().toISOString().slice(0, 10)
}

// Espelho em que o atendimento já está (um espelho devolvido continua com os atendimentos dele).
function espelhoDo(atendimentoId) {
  return banco().espelhoItens.find(i => i.atendimentoId === atendimentoId)?.espelhoId ?? null
}

function procedimentoDo(atendimentoId) {
  return banco()
    .preGuias.flatMap(p => p.procedimentos)
    .find(p => p.atendimentoId === Number(atendimentoId))
}

// Monta a visão de cada procedimento de guia emitida, como o GET /ocs/{cnpj}/atendimentos devolveria.
export function atendimentos() {
  const db = banco()
  return db.preGuias
    .filter(p => p.status === 'EMITIDA')
    .flatMap(guia =>
      guia.procedimentos.map(p => {
        const sessoes = db.sessoes.filter(s => s.atendimentoId === p.atendimentoId)
        const ocs = db.ocs.find(o => o.cnpj === p.ocsCnpj)
        const beneficiario = db.beneficiarios.find(b => b.precCp === guia.beneficiarioPrecCp)
        let statusProcedimento = 'PENDENTE'
        if (sessoes.length >= p.quantidade) statusProcedimento = 'REALIZADA'
        else if (p.aguardandoConfirmacao) statusProcedimento = 'AGUARDANDO_CONFIRMACAO'
        else if (sessoes.length > 0) statusProcedimento = 'EM_ANDAMENTO'
        return {
          atendimentoId: p.atendimentoId,
          guiaId: guia.id,
          guiaNumero: numeroPreGuia(guia.id),
          beneficiario: { precCp: guia.beneficiarioPrecCp, nome: beneficiario?.nome || '—' },
          procedimento: db.procedimentos.find(x => x.id === p.procedimentoId)?.nome || '—',
          ocs: { cnpj: p.ocsCnpj, nome: ocs?.nome || '—' },
          qtdAutorizada: p.quantidade,
          qtdRealizada: sessoes.length,
          statusProcedimento,
          aguardandoConfirmacao: Boolean(p.aguardandoConfirmacao),
          dataValidade: somarDias(guia.dataEmissao, VALIDADE_DIAS),
          // Data da última sessão confirmada: é ela que define em que período o atendimento entra no espelho.
          dataRealizacao: sessoes.length ? sessoes[sessoes.length - 1].dataRealizacao : null,
          espelhoId: espelhoDo(p.atendimentoId)
        }
      })
    )
}

function encontrarAtendimento(atendimentoId) {
  const atendimento = atendimentos().find(a => a.atendimentoId === Number(atendimentoId))
  if (!atendimento) {
    throw erroHttp(404, { codigo: 'ATENDIMENTO_NAO_ENCONTRADO', mensagem: 'Atendimento não encontrado.' })
  }
  return atendimento
}

function exigirPedido(atendimento) {
  if (!atendimento.aguardandoConfirmacao) {
    throw erroHttp(409, { codigo: 'SEM_PEDIDO_DE_CONFIRMACAO', mensagem: 'Este atendimento não está aguardando confirmação.' })
  }
}

// ---------- OCS ----------

export async function mockListarAtendimentosOcs(cnpj) {
  await esperar(300)
  return copiar(atendimentos().filter(a => a.ocs.cnpj === cnpj))
}

// POST /atendimentos/{id}/sessoes: a OCS avisa que fez o procedimento.
export async function mockRegistrarSessao(atendimentoId, cnpj) {
  await esperar(400)
  const atendimento = encontrarAtendimento(atendimentoId)
  if (atendimento.ocs.cnpj !== cnpj) {
    throw erroHttp(422, { codigo: 'OCS_DIFERENTE_DO_CONTRATO', mensagem: 'Este atendimento é de outra OCS.' })
  }
  if (atendimento.dataValidade < hoje()) {
    throw erroHttp(422, { codigo: 'GUIA_EXPIRADA', mensagem: 'A guia está vencida.' })
  }
  if (atendimento.aguardandoConfirmacao) {
    throw erroHttp(409, { codigo: 'AGUARDANDO_CONFIRMACAO', mensagem: 'Já existe um pedido aguardando a confirmação do beneficiário.' })
  }
  if (atendimento.qtdRealizada >= atendimento.qtdAutorizada) {
    throw erroHttp(422, { codigo: 'SESSOES_ESGOTADAS', mensagem: 'Todas as sessões autorizadas já foram realizadas.' })
  }
  procedimentoDo(atendimentoId).aguardandoConfirmacao = true
  persistir()
  return copiar(encontrarAtendimento(atendimentoId))
}

// DELETE /atendimentos/{id}/pedido-confirmacao: a OCS desfaz o pedido.
export async function mockCancelarSessao(atendimentoId) {
  await esperar(300)
  exigirPedido(encontrarAtendimento(atendimentoId))
  procedimentoDo(atendimentoId).aguardandoConfirmacao = false
  persistir()
}

// ---------- Beneficiário ----------

export async function mockListarConfirmacoesPendentes(precCp) {
  await esperar(300)
  return copiar(
    atendimentos()
      .filter(a => a.beneficiario.precCp === precCp && a.aguardandoConfirmacao)
      .map(a => ({
        atendimentoId: a.atendimentoId,
        numeroSessao: a.qtdRealizada + 1,
        qtdAutorizada: a.qtdAutorizada,
        procedimento: a.procedimento,
        ocs: a.ocs,
        guiaNumero: a.guiaNumero
      }))
  )
}

function validarDono(atendimento) {
  if (atendimento.beneficiario.precCp !== sessao.usuario?.precCp) {
    throw erroHttp(403, { codigo: 'ATENDIMENTO_DE_OUTRO_BENEFICIARIO', mensagem: 'Este atendimento não é seu.' })
  }
}

// PATCH /atendimentos/{id}/confirmar: grava a sessão e, na última, o procedimento fica REALIZADA.
export async function mockConfirmarSessao(atendimentoId) {
  await esperar(400)
  const antes = encontrarAtendimento(atendimentoId)
  validarDono(antes)
  exigirPedido(antes)
  const db = banco()
  db.sessoes.push({
    id: proximoId(db.sessoes),
    atendimentoId: antes.atendimentoId,
    numeroSessao: antes.qtdRealizada + 1,
    ocsCnpj: antes.ocs.cnpj,
    dataRealizacao: new Date().toISOString()
  })
  procedimentoDo(atendimentoId).aguardandoConfirmacao = false
  const depois = encontrarAtendimento(atendimentoId)
  const statusAntes = antes.qtdRealizada === 0 ? 'PENDENTE' : 'EM_ANDAMENTO'
  if (depois.statusProcedimento !== statusAntes) {
    registrarHistorico('GUIA_PROC', antes.atendimentoId, statusAntes, depois.statusProcedimento, 'confirmacao-do-beneficiario')
  }
  persistir()
  return copiar(depois)
}

// PATCH /atendimentos/{id}/recusar: "não fui atendido". Nada é gravado em Sessao_Procedimento.
export async function mockRecusarSessao(atendimentoId) {
  await esperar(400)
  const atendimento = encontrarAtendimento(atendimentoId)
  validarDono(atendimento)
  exigirPedido(atendimento)
  procedimentoDo(atendimentoId).aguardandoConfirmacao = false
  persistir()
}

// GET /beneficiarios/{precCp}/guias (#64), com qtdRealizada contando só sessões confirmadas.
export async function mockListarGuiasDoBeneficiario(precCp) {
  await esperar(300)
  const db = banco()
  if (!db.beneficiarios.some(b => b.precCp === precCp)) {
    throw erroHttp(404, { codigo: 'BENEFICIARIO_NAO_ENCONTRADO', mensagem: 'Beneficiário não encontrado.' })
  }
  const lista = atendimentos().filter(a => a.beneficiario.precCp === precCp)
  return db.preGuias
    .filter(p => p.status === 'EMITIDA' && p.beneficiarioPrecCp === precCp)
    .map(guia => {
      const diasDesdeEmissao = Math.floor((new Date(hoje()) - new Date(guia.dataEmissao)) / 86400000)
      return {
        guiaId: guia.id,
        numero: numeroPreGuia(guia.id),
        status: 'EMITIDA',
        dataEmissao: guia.dataEmissao,
        diasRestantes: Math.max(VALIDADE_DIAS - diasDesdeEmissao, 0),
        procedimentos: lista
          .filter(a => a.guiaId === guia.id)
          .map(a => ({
            atendimentoId: a.atendimentoId,
            nome: a.procedimento,
            ocs: a.ocs,
            status: a.statusProcedimento,
            qtdAutorizada: a.qtdAutorizada,
            qtdRealizada: a.qtdRealizada,
            temQr: false
          }))
      }
    })
}
