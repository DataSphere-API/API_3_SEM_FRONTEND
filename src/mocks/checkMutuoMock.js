import { banco, persistir, proximoId, copiar, registrarHistorico } from './bancoMock.js'
import { erroHttp, esperar } from './auxiliares.js'
import { sessao } from '../stores/sessao.js'
import { numeroPreGuia, somarDias, VALIDADE_DIAS } from '../utils/fluxoPreGuia.js'

function hoje() {
  return new Date().toISOString().slice(0, 10)
}

// Espelho em que o atendimento já foi cobrado. Espelho reprovado libera o atendimento para reenvio.
function espelhoAtivoDo(atendimentoId) {
  const db = banco()
  const item = db.espelhoItens.find(
    i => i.atendimentoId === atendimentoId && db.espelhos.find(e => e.id === i.espelhoId)?.status !== 'REPROVADO'
  )
  return item ? item.espelhoId : null
}

// Monta a visão de cada procedimento de guia emitida, como o GET /ocs/{cnpj}/atendimentos devolveria.
export function atendimentos() {
  const db = banco()
  return db.preGuias
    .filter(p => p.status === 'EMITIDA')
    .flatMap(guia =>
      guia.procedimentos.map(p => {
        const sessoes = db.sessoes.filter(s => s.atendimentoId === p.atendimentoId)
        const confirmadas = sessoes.filter(s => s.dataConfirmacao)
        const pendente = sessoes.find(s => !s.dataConfirmacao) || null
        const ocs = db.ocs.find(o => o.cnpj === p.ocsCnpj)
        const beneficiario = db.beneficiarios.find(b => b.precCp === guia.beneficiarioPrecCp)
        let statusProcedimento = 'PENDENTE'
        if (confirmadas.length >= p.quantidade) statusProcedimento = 'REALIZADA'
        else if (confirmadas.length > 0 || pendente) statusProcedimento = 'EM_ANDAMENTO'
        return {
          atendimentoId: p.atendimentoId,
          guiaId: guia.id,
          guiaNumero: numeroPreGuia(guia.id),
          beneficiario: { precCp: guia.beneficiarioPrecCp, nome: beneficiario?.nome || '—' },
          procedimento: db.procedimentos.find(x => x.id === p.procedimentoId)?.nome || '—',
          ocs: { cnpj: p.ocsCnpj, nome: ocs?.nome || '—' },
          qtdAutorizada: p.quantidade,
          qtdRealizada: confirmadas.length,
          statusProcedimento,
          dataValidade: somarDias(guia.dataEmissao, VALIDADE_DIAS),
          // Data da última sessão confirmada: é ela que define em que período o atendimento entra no espelho.
          dataRealizacao: confirmadas.length ? confirmadas[confirmadas.length - 1].dataConfirmacao : null,
          espelhoId: espelhoAtivoDo(p.atendimentoId),
          sessaoPendente: pendente
            ? { id: pendente.id, numeroSessao: pendente.numeroSessao, dataRealizacao: pendente.dataRealizacao }
            : null
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

function encontrarSessaoPendente(sessaoId) {
  const sessaoRegistro = banco().sessoes.find(s => s.id === Number(sessaoId))
  if (!sessaoRegistro || sessaoRegistro.dataConfirmacao) {
    throw erroHttp(404, { codigo: 'SESSAO_NAO_ENCONTRADA', mensagem: 'Este pedido de confirmação não existe mais.' })
  }
  return sessaoRegistro
}

export async function mockListarAtendimentosOcs(cnpj) {
  await esperar(300)
  return copiar(atendimentos().filter(a => a.ocs.cnpj === cnpj))
}

export async function mockRegistrarSessao(atendimentoId, cnpj) {
  await esperar(400)
  const atendimento = encontrarAtendimento(atendimentoId)
  if (atendimento.ocs.cnpj !== cnpj) {
    throw erroHttp(422, { codigo: 'OCS_DIFERENTE_DO_CONTRATO', mensagem: 'Este atendimento é de outra OCS.' })
  }
  if (atendimento.dataValidade < hoje()) {
    throw erroHttp(422, { codigo: 'GUIA_EXPIRADA', mensagem: 'A guia está vencida.' })
  }
  if (atendimento.sessaoPendente) {
    throw erroHttp(409, {
      codigo: 'SESSAO_AGUARDANDO_CONFIRMACAO',
      mensagem: 'Já existe uma sessão aguardando a confirmação do beneficiário.'
    })
  }
  if (atendimento.qtdRealizada >= atendimento.qtdAutorizada) {
    throw erroHttp(422, { codigo: 'SESSOES_ESGOTADAS', mensagem: 'Todas as sessões autorizadas já foram realizadas.' })
  }
  const db = banco()
  const nova = {
    id: proximoId(db.sessoes),
    atendimentoId: atendimento.atendimentoId,
    numeroSessao: atendimento.qtdRealizada + 1,
    ocsCnpj: cnpj,
    dataRealizacao: new Date().toISOString(),
    dataConfirmacao: null
  }
  db.sessoes.push(nova)
  persistir()
  return copiar(encontrarAtendimento(atendimentoId))
}

export async function mockCancelarSessao(atendimentoId, sessaoId) {
  await esperar(300)
  const pendente = encontrarSessaoPendente(sessaoId)
  if (pendente.atendimentoId !== Number(atendimentoId)) {
    throw erroHttp(404, { codigo: 'SESSAO_NAO_ENCONTRADA', mensagem: 'Este pedido de confirmação não existe mais.' })
  }
  const db = banco()
  db.sessoes = db.sessoes.filter(s => s.id !== pendente.id)
  persistir()
}

export async function mockListarConfirmacoesPendentes(precCp) {
  await esperar(300)
  return copiar(
    atendimentos()
      .filter(a => a.beneficiario.precCp === precCp && a.sessaoPendente)
      .map(a => ({
        sessaoId: a.sessaoPendente.id,
        atendimentoId: a.atendimentoId,
        numeroSessao: a.sessaoPendente.numeroSessao,
        qtdAutorizada: a.qtdAutorizada,
        procedimento: a.procedimento,
        ocs: a.ocs,
        guiaNumero: a.guiaNumero,
        dataRealizacao: a.sessaoPendente.dataRealizacao
      }))
  )
}

function validarDono(sessaoRegistro) {
  const atendimento = encontrarAtendimento(sessaoRegistro.atendimentoId)
  if (atendimento.beneficiario.precCp !== sessao.usuario?.precCp) {
    throw erroHttp(403, { codigo: 'SESSAO_DE_OUTRO_BENEFICIARIO', mensagem: 'Este atendimento não é seu.' })
  }
}

export async function mockConfirmarSessao(sessaoId) {
  await esperar(400)
  const pendente = encontrarSessaoPendente(sessaoId)
  validarDono(pendente)
  const antes = encontrarAtendimento(pendente.atendimentoId)
  pendente.dataConfirmacao = new Date().toISOString()
  const depois = encontrarAtendimento(pendente.atendimentoId)
  const statusAntes = antes.qtdRealizada === 0 ? 'PENDENTE' : 'EM_ANDAMENTO'
  if (depois.statusProcedimento === 'REALIZADA' || statusAntes === 'PENDENTE') {
    registrarHistorico('GUIA_PROC', pendente.atendimentoId, statusAntes, depois.statusProcedimento, 'confirmacao-do-beneficiario')
  }
  persistir()
  return copiar(encontrarAtendimento(pendente.atendimentoId))
}

export async function mockRecusarSessao(sessaoId) {
  await esperar(400)
  const pendente = encontrarSessaoPendente(sessaoId)
  validarDono(pendente)
  const db = banco()
  db.sessoes = db.sessoes.filter(s => s.id !== pendente.id)
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
