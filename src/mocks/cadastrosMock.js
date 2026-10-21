import { banco, persistir, proximoId, copiar } from './bancoMock.js'
import { erroHttp, esperar } from './auxiliares.js'
import { usuarioPublico } from './authMock.js'
import { sessao } from '../stores/sessao.js'
import { PERFIS_ATRIBUIVEIS } from '../utils/perfis.js'

// ---------- Usuários ----------

export async function mockListarUsuarios() {
  await esperar(300)
  return banco().usuarios.map(usuarioPublico)
}

export async function mockSalvarUsuario(dados, id = null) {
  await esperar(400)
  const db = banco()
  const perfis = dados.perfis.filter(p => PERFIS_ATRIBUIVEIS.includes(p))
  const existente = id ? db.usuarios.find(u => u.id === id) : null

  if (id && !existente) {
    throw erroHttp(404, { codigo: 'USUARIO_NAO_ENCONTRADO', mensagem: 'Usuário não encontrado.' })
  }
  if (db.usuarios.some(u => u.cpf === dados.cpf && u.id !== id)) {
    throw erroHttp(409, { codigo: 'CPF_JA_CADASTRADO', mensagem: 'Já existe um usuário com este CPF.' })
  }
  const ehBeneficiario = existente?.perfis.includes('BENEFICIARIO')
  if (perfis.length === 0 && !ehBeneficiario) {
    throw erroHttp(422, { codigo: 'PERFIL_OBRIGATORIO', mensagem: 'Marque pelo menos um perfil.' })
  }
  if (perfis.includes('MEDICO') && (!dados.crm || !dados.crmUf)) {
    throw erroHttp(422, { codigo: 'DADOS_DO_PERFIL_OBRIGATORIOS', mensagem: 'Médico precisa de CRM e UF.' })
  }
  if (perfis.includes('OCS') && !dados.ocsCnpj) {
    throw erroHttp(422, { codigo: 'DADOS_DO_PERFIL_OBRIGATORIOS', mensagem: 'Informe em qual OCS o usuário trabalha.' })
  }
  if (id === sessao.usuario?.id && (!dados.ativo || !perfis.includes('CHEFE'))) {
    throw erroHttp(422, { codigo: 'AUTO_REMOCAO_CHEFE', mensagem: 'Você não pode desativar nem tirar o perfil de chefe de si mesmo.' })
  }

  const registro = {
    nome: dados.nome,
    cpf: dados.cpf,
    postoGraduacao: dados.postoGraduacao,
    email: dados.email,
    telefone: dados.telefone,
    perfis: ehBeneficiario ? [...perfis, 'BENEFICIARIO'] : perfis,
    crm: perfis.includes('MEDICO') ? dados.crm : '',
    crmUf: perfis.includes('MEDICO') ? dados.crmUf : '',
    ocsCnpj: perfis.includes('OCS') ? dados.ocsCnpj : '',
    ativo: dados.ativo
  }

  if (existente) {
    Object.assign(existente, registro)
  } else {
    db.usuarios.push({ id: proximoId(db.usuarios), precCp: '', senha: dados.senhaProvisoria, ...registro })
  }
  persistir()
  return usuarioPublico(existente || db.usuarios[db.usuarios.length - 1])
}

// ---------- OCS ----------

export async function mockListarOcs() {
  await esperar(300)
  return copiar(banco().ocs)
}

export async function mockSalvarOcs(dados, cnpjOriginal = null) {
  await esperar(400)
  const db = banco()
  if (db.ocs.some(o => o.cnpj === dados.cnpj && o.cnpj !== cnpjOriginal)) {
    throw erroHttp(409, { codigo: 'OCS_JA_CADASTRADA', mensagem: 'Já existe uma OCS com este CNPJ.' })
  }
  const existente = cnpjOriginal ? db.ocs.find(o => o.cnpj === cnpjOriginal) : null
  if (existente) {
    Object.assign(existente, dados)
  } else {
    db.ocs.push({ ...dados })
  }
  persistir()
  return copiar(dados)
}

// ---------- Procedimentos e contratos ----------

export async function mockListarProcedimentos() {
  await esperar(200)
  return copiar(banco().procedimentos)
}

function contratoDetalhado(contrato) {
  const db = banco()
  return {
    ...contrato,
    procedimentoNome: db.procedimentos.find(p => p.id === contrato.procedimentoId)?.nome || '—',
    ocsNome: db.ocs.find(o => o.cnpj === contrato.ocsCnpj)?.nomeFantasia || '—'
  }
}

export async function mockListarContratos() {
  await esperar(300)
  return banco().contratos.map(contratoDetalhado)
}

export async function mockSalvarContrato(dados, id = null) {
  await esperar(400)
  const db = banco()
  if (!(dados.valor > 0)) {
    throw erroHttp(422, { codigo: 'VALOR_INVALIDO', mensagem: 'O valor do contrato precisa ser maior que zero.' })
  }
  if (dados.fimVigencia < dados.inicioVigencia) {
    throw erroHttp(422, { codigo: 'VIGENCIA_INVALIDA', mensagem: 'O fim da vigência não pode ser antes do início.' })
  }
  const sobreposto = db.contratos.some(c =>
    c.id !== id &&
    c.procedimentoId === dados.procedimentoId &&
    c.ocsCnpj === dados.ocsCnpj &&
    c.inicioVigencia <= dados.fimVigencia &&
    dados.inicioVigencia <= c.fimVigencia
  )
  if (sobreposto) {
    throw erroHttp(409, {
      codigo: 'CONTRATO_DUPLICADO',
      mensagem: 'Já existe contrato desse procedimento com essa OCS no mesmo período.'
    })
  }

  let contrato = id ? db.contratos.find(c => c.id === id) : null
  if (contrato) {
    Object.assign(contrato, dados)
  } else {
    contrato = { id: proximoId(db.contratos), ...dados }
    db.contratos.push(contrato)
  }
  persistir()
  return contratoDetalhado(contrato)
}

// ---------- Beneficiários ----------

export async function mockBuscarBeneficiarios(busca) {
  await esperar(250)
  const termo = String(busca || '').trim().toLowerCase()
  return copiar(
    banco().beneficiarios.filter(
      b => !termo || b.nome.toLowerCase().includes(termo) || b.precCp.includes(termo)
    )
  )
}
