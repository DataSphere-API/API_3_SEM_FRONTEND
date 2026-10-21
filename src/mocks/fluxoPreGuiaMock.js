import { banco, persistir, proximoId, copiar } from './bancoMock.js'
import { erroHttp, esperar } from './auxiliares.js'
import { sessao } from '../stores/sessao.js'

const VALIDADE_DIAS = 60

function hoje() {
  return new Date().toISOString().slice(0, 10)
}

function contratoVigente(procedimentoId, ocsCnpj, data = hoje()) {
  return banco().contratos.find(
    c =>
      c.procedimentoId === procedimentoId &&
      c.ocsCnpj === ocsCnpj &&
      c.inicioVigencia <= data &&
      data <= c.fimVigencia
  )
}

function somarDias(data, dias) {
  const resultado = new Date(`${data}T00:00:00`)
  resultado.setDate(resultado.getDate() + dias)
  return resultado.toISOString().slice(0, 10)
}

function detalhar(preGuia) {
  const db = banco()
  const beneficiario = db.beneficiarios.find(b => b.precCp === preGuia.beneficiarioPrecCp)
  const procedimentos = preGuia.procedimentos.map(p => {
    const ocs = db.ocs.find(o => o.cnpj === p.ocsCnpj)
    const valorUnitario = contratoVigente(p.procedimentoId, p.ocsCnpj, preGuia.criadaEm.slice(0, 10))?.valor ?? 0
    return {
      ...p,
      nome: db.procedimentos.find(x => x.id === p.procedimentoId)?.nome || '—',
      ocs: { cnpj: p.ocsCnpj, nome: ocs?.nomeFantasia || '—' },
      valorUnitario,
      valorTotal: valorUnitario * p.quantidade
    }
  })
  return copiar({
    ...preGuia,
    beneficiario: { precCp: preGuia.beneficiarioPrecCp, nome: beneficiario?.nome || '—' },
    procedimentos,
    valorTotal: procedimentos.reduce((total, p) => total + p.valorTotal, 0),
    validoAte: preGuia.dataEmissao ? somarDias(preGuia.dataEmissao, VALIDADE_DIAS) : null
  })
}

function encontrar(id) {
  const preGuia = banco().preGuias.find(p => p.id === Number(id))
  if (!preGuia) {
    throw erroHttp(404, { codigo: 'PRE_GUIA_NAO_ENCONTRADA', mensagem: 'Pré-guia não encontrada.' })
  }
  return preGuia
}

function validarConteudo(dados) {
  const db = banco()
  if (!db.beneficiarios.some(b => b.precCp === dados.beneficiarioPrecCp)) {
    throw erroHttp(422, { codigo: 'BENEFICIARIO_INVALIDO', mensagem: 'Selecione um beneficiário válido.' })
  }
  if (!dados.medicoSolicitante?.nome || !dados.medicoSolicitante?.crm || !dados.medicoSolicitante?.uf) {
    throw erroHttp(400, { codigo: 'MEDICO_SEM_CRM', mensagem: 'Informe nome, CRM e UF do médico solicitante.' })
  }
  if (!dados.justificativa?.trim()) {
    throw erroHttp(400, { codigo: 'JUSTIFICATIVA_OBRIGATORIA', mensagem: 'A justificativa clínica é obrigatória.' })
  }
  if (!dados.procedimentos?.length) {
    throw erroHttp(422, { codigo: 'PRE_GUIA_SEM_PROCEDIMENTOS', mensagem: 'Adicione pelo menos um procedimento.' })
  }
  for (const p of dados.procedimentos) {
    if (!(p.quantidade > 0)) {
      throw erroHttp(422, { codigo: 'SESSOES_INVALIDAS', mensagem: 'A quantidade precisa ser maior que zero.' })
    }
    if (!contratoVigente(p.procedimentoId, p.ocsCnpj)) {
      throw erroHttp(422, {
        codigo: 'PROCEDIMENTO_SEM_CONTRATO',
        mensagem: 'Um dos procedimentos não tem contrato vigente com a OCS escolhida.'
      })
    }
  }
}

function conteudo(dados) {
  return {
    beneficiarioPrecCp: dados.beneficiarioPrecCp,
    medicoSolicitante: { ...dados.medicoSolicitante },
    cid: dados.cid || '',
    carater: dados.carater,
    justificativa: dados.justificativa.trim(),
    observacoesEmissor: dados.observacoesEmissor || '',
    procedimentos: dados.procedimentos.map(p => ({
      procedimentoId: p.procedimentoId,
      ocsCnpj: p.ocsCnpj,
      quantidade: p.quantidade
    }))
  }
}

function decisaoPendente() {
  return { decisao: 'PENDENTE', por: null, data: null, observacao: '' }
}

export async function mockListarFluxo({ status, pendenteDe } = {}) {
  await esperar(300)
  return banco()
    .preGuias.filter(p => !status || p.status === status)
    .filter(p => {
      if (!pendenteDe) return true
      const campo = pendenteDe === 'MEDICO' ? 'aprovacaoMedico' : 'aprovacaoChefe'
      return p.status === 'AGUARDANDO_APROVACAO' && p[campo].decisao === 'PENDENTE'
    })
    .map(detalhar)
}

export async function mockBuscarFluxo(id) {
  await esperar(250)
  return detalhar(encontrar(id))
}

export async function mockCriarPreGuia(dados) {
  await esperar(500)
  validarConteudo(dados)
  const db = banco()
  const id = proximoId(db.preGuias)
  const agora = new Date().toISOString()
  const criadaPeloMedico = sessao.perfilAtivo === 'MEDICO'
  const preGuia = {
    id,
    numero: `PG ${agora.slice(0, 4)}/${String(id).padStart(3, '0')}`,
    status: 'AGUARDANDO_APROVACAO',
    criadaEm: agora,
    criadaPor: { nome: sessao.usuario?.nome || '—', perfil: sessao.perfilAtivo },
    ...conteudo(dados),
    respostaEmissor: '',
    // Quando o próprio médico do FUSEx solicita, a aprovação dele já vem junto.
    aprovacaoMedico: criadaPeloMedico
      ? { decisao: 'APROVADA', por: sessao.usuario?.nome, data: agora, observacao: '' }
      : decisaoPendente(),
    aprovacaoChefe: decisaoPendente(),
    dataEmissao: null
  }
  db.preGuias.push(preGuia)
  persistir()
  return detalhar(preGuia)
}

export async function mockCorrigirPreGuia(id, dados) {
  await esperar(500)
  const preGuia = encontrar(id)
  if (preGuia.status !== 'DEVOLVIDA') {
    throw erroHttp(409, { codigo: 'PRE_GUIA_STATUS_INVALIDO', mensagem: 'Só é possível corrigir uma pré-guia devolvida.' })
  }
  if (!dados.respostaEmissor?.trim()) {
    throw erroHttp(400, { codigo: 'RESPOSTA_OBRIGATORIA', mensagem: 'Explique ao aprovador o que foi corrigido.' })
  }
  validarConteudo(dados)
  Object.assign(preGuia, conteudo(dados), {
    respostaEmissor: dados.respostaEmissor.trim(),
    status: 'AGUARDANDO_APROVACAO',
    aprovacaoMedico: decisaoPendente(),
    aprovacaoChefe: decisaoPendente()
  })
  persistir()
  return detalhar(preGuia)
}

const ACOES = {
  aprovar: 'APROVADA',
  devolver: 'DEVOLVIDA',
  reprovar: 'NEGADA'
}

export async function mockDecidirPreGuia(id, acao, observacao = '') {
  await esperar(400)
  const preGuia = encontrar(id)
  const campo = { MEDICO: 'aprovacaoMedico', CHEFE: 'aprovacaoChefe' }[sessao.perfilAtivo]
  if (!campo) {
    throw erroHttp(403, { codigo: 'PERFIL_SEM_PERMISSAO', mensagem: 'Seu perfil não aprova pré-guias.' })
  }
  if (preGuia.status !== 'AGUARDANDO_APROVACAO') {
    throw erroHttp(409, { codigo: 'PRE_GUIA_STATUS_INVALIDO', mensagem: 'Esta pré-guia não está aguardando aprovação.' })
  }
  if (preGuia[campo].decisao !== 'PENDENTE') {
    throw erroHttp(409, { codigo: 'DECISAO_JA_REGISTRADA', mensagem: 'Você já registrou sua decisão nesta pré-guia.' })
  }
  if (acao !== 'aprovar' && !observacao.trim()) {
    throw erroHttp(400, { codigo: 'OBSERVACAO_OBRIGATORIA', mensagem: 'A observação é obrigatória para devolver ou negar.' })
  }

  preGuia[campo] = {
    decisao: ACOES[acao],
    por: sessao.usuario?.nome,
    data: new Date().toISOString(),
    observacao: observacao.trim()
  }

  if (acao === 'reprovar') {
    preGuia.status = 'REPROVADA'
  } else if (acao === 'devolver') {
    preGuia.status = 'DEVOLVIDA'
  } else if (
    preGuia.aprovacaoMedico.decisao === 'APROVADA' &&
    preGuia.aprovacaoChefe.decisao === 'APROVADA'
  ) {
    preGuia.status = 'APROVADA'
  }
  persistir()
  return detalhar(preGuia)
}

export async function mockEmitirGuia(id) {
  await esperar(500)
  const preGuia = encontrar(id)
  if (preGuia.status === 'EMITIDA') {
    throw erroHttp(409, { codigo: 'PRE_GUIA_JA_EMITIDA', mensagem: 'Esta guia já foi emitida.' })
  }
  if (preGuia.status !== 'APROVADA') {
    throw erroHttp(409, { codigo: 'PRE_GUIA_NAO_APROVADA', mensagem: 'A guia só pode ser emitida depois das duas aprovações.' })
  }
  preGuia.status = 'EMITIDA'
  preGuia.dataEmissao = hoje()
  persistir()
  return {
    guiaId: preGuia.id,
    status: preGuia.status,
    dataEmissao: preGuia.dataEmissao,
    validoAte: somarDias(preGuia.dataEmissao, VALIDADE_DIAS)
  }
}
