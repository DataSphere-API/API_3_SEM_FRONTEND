// Fluxo da pré-guia nos contratos das issues US005 e US006 (#75 a #78, #81, #82),
// com a aprovação dupla (médico + chefe) usando os campos da V8.
import { banco, persistir, proximoId, copiar, registrarHistorico, nomeDoUsuario } from './bancoMock.js'
import { erroHttp, esperar } from './auxiliares.js'
import { sessao } from '../stores/sessao.js'

import { EDITAVEIS, VALIDADE_DIAS, somarDias } from '../utils/fluxoPreGuia.js'

function hoje() {
  return new Date().toISOString().slice(0, 10)
}

function contrato(procedimentoId, ocsCnpj) {
  return banco().contratos.find(c => c.procedimentoId === procedimentoId && c.ocsCnpj === ocsCnpj)
}

function procedimentosDetalhados(preGuia) {
  const db = banco()
  return preGuia.procedimentos.map(p => {
    const valorUnitario = contrato(p.procedimentoId, p.ocsCnpj)?.valor ?? 0
    return {
      atendimentoId: p.atendimentoId,
      procedimentoId: p.procedimentoId,
      nome: db.procedimentos.find(x => x.id === p.procedimentoId)?.nome || '—',
      ocs: { cnpj: p.ocsCnpj, nome: db.ocs.find(o => o.cnpj === p.ocsCnpj)?.nome || '—' },
      qtdSessoes: p.quantidade,
      valorUnitario,
      valorTotal: valorUnitario * p.quantidade
    }
  })
}

// GET /pre-guias (#75) + medicoAprovou, chefeAprovou e dataEmissao.
function resumo(preGuia) {
  const db = banco()
  const procedimentos = procedimentosDetalhados(preGuia)
  return {
    id: preGuia.id,
    beneficiarioNome: db.beneficiarios.find(b => b.precCp === preGuia.beneficiarioPrecCp)?.nome || '—',
    status: preGuia.status,
    qtdProcedimentos: procedimentos.length,
    valorTotal: procedimentos.reduce((total, p) => total + p.valorTotal, 0),
    dataCriacao: preGuia.dataCriacao,
    medicoAprovou: Boolean(preGuia.dataAprovacaoMedico),
    chefeAprovou: Boolean(preGuia.dataAprovacaoChefe),
    dataEmissao: preGuia.dataEmissao
  }
}

// GET /pre-guias/{id} (#76) + datas de aprovação, motivo e emissão.
function detalhe(preGuia) {
  const db = banco()
  const beneficiario = db.beneficiarios.find(b => b.precCp === preGuia.beneficiarioPrecCp)
  const medico = db.usuarios.find(u => u.id === preGuia.medicoId)
  const procedimentos = procedimentosDetalhados(preGuia)
  return copiar({
    id: preGuia.id,
    status: preGuia.status,
    beneficiario: { precCp: preGuia.beneficiarioPrecCp, nome: beneficiario?.nome || '—' },
    medico: { id: preGuia.medicoId, nome: medico ? nomeDoUsuario(medico) : '—', crm: medico?.crm || '' },
    procedimentos,
    valorTotal: procedimentos.reduce((total, p) => total + p.valorTotal, 0),
    validacao: { validada: preGuia.status !== 'PRE_GUIA' && preGuia.pendencias.length === 0, pendencias: preGuia.pendencias },
    dataCriacao: preGuia.dataCriacao,
    dataAprovacaoMedico: preGuia.dataAprovacaoMedico,
    dataAprovacaoChefe: preGuia.dataAprovacaoChefe,
    motivoReprovacao: preGuia.motivoReprovacao,
    dataEmissao: preGuia.dataEmissao,
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

function proximoAtendimento() {
  return banco().preGuias.flatMap(p => p.procedimentos).reduce((maior, p) => Math.max(maior, p.atendimentoId), 0) + 1
}

function conferirCorpo(dados) {
  if (!dados.beneficiarioPrecCp || !dados.medicoId || !dados.procedimentos?.length) {
    throw erroHttp(400, {
      codigo: 'DADOS_OBRIGATORIOS',
      mensagem: 'Informe o beneficiário, o médico responsável e pelo menos um procedimento.'
    })
  }
}

function montarProcedimentos(procedimentos) {
  let atendimento = proximoAtendimento()
  return procedimentos.map(p => ({
    atendimentoId: atendimento++,
    procedimentoId: p.procedimentoId,
    ocsCnpj: p.ocsCnpj,
    quantidade: p.quantidade
  }))
}

// Regras da US006-1 (#81).
function pendenciasDa(preGuia) {
  const db = banco()
  const pendencias = []
  const beneficiario = db.beneficiarios.find(b => b.precCp === preGuia.beneficiarioPrecCp)
  if (!beneficiario?.dataNascimento) {
    pendencias.push({ codigo: 'BENEFICIARIO_INVALIDO', atendimentoId: null, mensagem: 'Beneficiário inexistente ou sem data de nascimento.' })
  }
  const medico = db.usuarios.find(u => u.id === preGuia.medicoId)
  if (!medico?.crm) {
    pendencias.push({ codigo: 'MEDICO_SEM_CRM', atendimentoId: null, mensagem: 'O médico responsável não tem CRM cadastrado.' })
  }
  if (preGuia.procedimentos.length === 0) {
    pendencias.push({ codigo: 'PRE_GUIA_SEM_PROCEDIMENTOS', atendimentoId: null, mensagem: 'A pré-guia não tem procedimentos.' })
  }
  for (const p of preGuia.procedimentos) {
    if (!contrato(p.procedimentoId, p.ocsCnpj)) {
      const nome = db.procedimentos.find(x => x.id === p.procedimentoId)?.nome
      const ocs = db.ocs.find(o => o.cnpj === p.ocsCnpj)?.nome
      pendencias.push({ codigo: 'PROCEDIMENTO_SEM_CONTRATO', atendimentoId: p.atendimentoId, mensagem: `${nome} não possui contrato com a OCS ${ocs}` })
    }
    if (!(p.quantidade > 0)) {
      pendencias.push({ codigo: 'SESSOES_INVALIDAS', atendimentoId: p.atendimentoId, mensagem: 'A quantidade de sessões precisa ser maior que zero.' })
    }
  }
  return pendencias
}

export async function mockListarPreGuias({ status } = {}) {
  await esperar(300)
  return banco()
    .preGuias.filter(p => !status || p.status === status)
    // O back filtra pelo token: o médico só vê as pré-guias em que ele é o responsável.
    .filter(p => sessao.perfilAtivo !== 'MEDICO' || p.medicoId === sessao.usuario?.id)
    .map(resumo)
}

export async function mockBuscarPreGuia(id) {
  await esperar(250)
  return detalhe(encontrar(id))
}

export async function mockCriarPreGuia(dados) {
  await esperar(400)
  conferirCorpo(dados)
  const db = banco()
  const preGuia = {
    id: proximoId(db.preGuias),
    status: 'PRE_GUIA',
    beneficiarioPrecCp: dados.beneficiarioPrecCp,
    medicoId: dados.medicoId,
    procedimentos: montarProcedimentos(dados.procedimentos),
    dataCriacao: hoje(),
    pendencias: [],
    dataAprovacaoMedico: null,
    dataAprovacaoChefe: null,
    chefeId: null,
    motivoReprovacao: null,
    dataEmissao: null
  }
  db.preGuias.push(preGuia)
  persistir()
  return detalhe(preGuia)
}

export async function mockEditarPreGuia(id, dados) {
  await esperar(400)
  const preGuia = encontrar(id)
  if (!EDITAVEIS.includes(preGuia.status)) {
    throw erroHttp(409, { codigo: 'PRE_GUIA_STATUS_INVALIDO', mensagem: 'Só dá para editar antes da validação ou com pendências.' })
  }
  conferirCorpo(dados)
  Object.assign(preGuia, {
    beneficiarioPrecCp: dados.beneficiarioPrecCp,
    medicoId: dados.medicoId,
    procedimentos: montarProcedimentos(dados.procedimentos),
    status: 'PRE_GUIA',
    pendencias: []
  })
  persistir()
  return detalhe(preGuia)
}

// POST /pre-guias/{id}/validar (#82): é o "Enviar para aprovação".
export async function mockValidarPreGuia(id) {
  await esperar(400)
  const preGuia = encontrar(id)
  if (!EDITAVEIS.includes(preGuia.status)) {
    throw erroHttp(409, { codigo: 'PRE_GUIA_STATUS_INVALIDO', mensagem: 'Esta pré-guia já foi enviada para aprovação.' })
  }
  preGuia.pendencias = pendenciasDa(preGuia)
  preGuia.status = preGuia.pendencias.length ? 'COM_PENDENCIAS' : 'VALIDADA'
  persistir()
  return { preGuiaId: preGuia.id, status: preGuia.status, validada: !preGuia.pendencias.length, pendencias: copiar(preGuia.pendencias) }
}

function campoDeAprovacao(preGuia) {
  if (sessao.perfilAtivo === 'CHEFE') return 'dataAprovacaoChefe'
  if (sessao.perfilAtivo === 'MEDICO') {
    if (preGuia.medicoId !== sessao.usuario?.id) {
      throw erroHttp(403, { codigo: 'MEDICO_NAO_RESPONSAVEL', mensagem: 'Você não é o médico responsável por esta pré-guia.' })
    }
    return 'dataAprovacaoMedico'
  }
  throw erroHttp(403, { codigo: 'PERFIL_SEM_PERMISSAO', mensagem: 'Seu perfil não aprova pré-guias.' })
}

// PATCH /pre-guias/{id}/aprovar (#77 ajustada): médico ou chefe; APROVADA quando os dois aprovam.
export async function mockAprovarPreGuia(id) {
  await esperar(400)
  const preGuia = encontrar(id)
  const campo = campoDeAprovacao(preGuia)
  if (preGuia.status !== 'VALIDADA') {
    throw erroHttp(409, { codigo: 'PRE_GUIA_NAO_VALIDADA', mensagem: 'Só dá para aprovar uma pré-guia validada.' })
  }
  if (preGuia[campo]) {
    throw erroHttp(409, { codigo: 'APROVACAO_JA_REGISTRADA', mensagem: 'Você já aprovou esta pré-guia.' })
  }
  preGuia[campo] = new Date().toISOString()
  if (campo === 'dataAprovacaoChefe') preGuia.chefeId = sessao.usuario?.id
  if (preGuia.dataAprovacaoMedico && preGuia.dataAprovacaoChefe) preGuia.status = 'APROVADA'
  persistir()
  return {
    preGuiaId: preGuia.id,
    status: preGuia.status,
    dataAprovacaoMedico: preGuia.dataAprovacaoMedico,
    dataAprovacaoChefe: preGuia.dataAprovacaoChefe
  }
}

// PATCH /pre-guias/{id}/reprovar (#77): médico ou chefe, motivo obrigatório.
export async function mockReprovarPreGuia(id, motivo) {
  await esperar(400)
  const preGuia = encontrar(id)
  campoDeAprovacao(preGuia)
  if (!motivo?.trim()) {
    throw erroHttp(400, { codigo: 'MOTIVO_OBRIGATORIO', mensagem: 'O motivo da reprovação é obrigatório.' })
  }
  if (preGuia.status !== 'VALIDADA') {
    throw erroHttp(409, { codigo: 'PRE_GUIA_NAO_VALIDADA', mensagem: 'Só dá para reprovar uma pré-guia validada.' })
  }
  preGuia.status = 'REPROVADA'
  preGuia.motivoReprovacao = motivo.trim()
  persistir()
  return { preGuiaId: preGuia.id, status: preGuia.status, motivo: preGuia.motivoReprovacao }
}

// POST /pre-guias/{id}/emitir (#78).
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
  preGuia.procedimentos.forEach(p =>
    registrarHistorico('GUIA_PROC', p.atendimentoId, null, 'PENDENTE', 'emissao-da-guia')
  )
  persistir()
  return {
    guiaId: preGuia.id,
    status: preGuia.status,
    dataEmissao: preGuia.dataEmissao,
    validoAte: somarDias(preGuia.dataEmissao, VALIDADE_DIAS),
    procedimentos: preGuia.procedimentos.map(p => ({ atendimentoId: p.atendimentoId }))
  }
}
