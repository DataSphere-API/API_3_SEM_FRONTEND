import { banco, persistir, proximoId, copiar, nomeDoUsuario } from './bancoMock.js'
import { erroHttp, esperar } from './auxiliares.js'
import { usuarioPublico } from './authMock.js'

const PERFIS_DE_MILITAR = ['CHEFE', 'MEDICO', 'EMISSOR', 'AUDITOR']

// ---------- Usuários ----------

export async function mockListarUsuarios() {
  await esperar(300)
  return banco().usuarios.map(usuarioPublico)
}

// tipo MILITAR: { precCp, cpf, senha, perfis, crm } — perfis viram linhas em Chefe_Fusex/Medico/Analista/Auditor.
// tipo OCS: { cpf, senha, ocsCnpj, cargo } — vira uma linha em FunOcs.
export async function mockCriarUsuario(dados) {
  await esperar(400)
  const db = banco()

  if (dados.tipo === 'OCS') {
    if (!db.ocs.some(o => o.cnpj === dados.ocsCnpj)) {
      throw erroHttp(422, { codigo: 'OCS_NAO_ENCONTRADA', mensagem: 'Escolha uma OCS cadastrada.' })
    }
    if (db.usuarios.some(u => u.cpf === dados.cpf)) {
      throw erroHttp(409, { codigo: 'CPF_JA_CADASTRADO', mensagem: 'Já existe um usuário com este CPF.' })
    }
    const novo = {
      id: proximoId(db.usuarios),
      cpf: dados.cpf,
      senha: dados.senha,
      perfis: ['OCS'],
      precCp: '',
      crm: '',
      ocsCnpj: dados.ocsCnpj,
      cargo: dados.cargo
    }
    db.usuarios.push(novo)
    persistir()
    return usuarioPublico(novo)
  }

  const perfis = dados.perfis.filter(p => PERFIS_DE_MILITAR.includes(p))
  if (!db.beneficiarios.some(b => b.precCp === dados.precCp)) {
    throw erroHttp(404, { codigo: 'BENEFICIARIO_NAO_ENCONTRADO', mensagem: 'Prec-CP não encontrado.' })
  }
  if (perfis.length === 0) {
    throw erroHttp(422, { codigo: 'PERFIL_OBRIGATORIO', mensagem: 'Marque pelo menos um perfil.' })
  }
  if (perfis.includes('MEDICO') && !dados.crm) {
    throw erroHttp(422, { codigo: 'MEDICO_SEM_CRM', mensagem: 'Médico precisa de CRM.' })
  }

  // Prec-CP que já tem usuário (ex.: beneficiário que se cadastrou): só acrescenta os perfis.
  const existente = db.usuarios.find(u => u.precCp === dados.precCp)
  if (existente) {
    existente.perfis = [...new Set([...existente.perfis, ...perfis, 'BENEFICIARIO'])]
    if (perfis.includes('MEDICO')) existente.crm = dados.crm
    persistir()
    return usuarioPublico(existente)
  }
  if (db.usuarios.some(u => u.cpf === dados.cpf)) {
    throw erroHttp(409, { codigo: 'CPF_JA_CADASTRADO', mensagem: 'Já existe um usuário com este CPF.' })
  }
  const novo = {
    id: proximoId(db.usuarios),
    cpf: dados.cpf,
    senha: dados.senha,
    perfis: [...perfis, 'BENEFICIARIO'],
    precCp: dados.precCp,
    crm: perfis.includes('MEDICO') ? dados.crm : '',
    ocsCnpj: '',
    cargo: ''
  }
  db.usuarios.push(novo)
  persistir()
  return usuarioPublico(novo)
}

export async function mockListarMedicos() {
  await esperar(200)
  return banco()
    .usuarios.filter(u => u.perfis.includes('MEDICO'))
    .map(u => ({ id: u.id, nome: nomeDoUsuario(u), crm: u.crm }))
}

// ---------- OCS ----------

export async function mockListarOcs() {
  await esperar(300)
  return copiar(banco().ocs)
}

export async function mockCriarOcs(dados) {
  await esperar(400)
  const db = banco()
  if (db.ocs.some(o => o.cnpj === dados.cnpj)) {
    throw erroHttp(409, { codigo: 'OCS_JA_CADASTRADA', mensagem: 'Já existe uma OCS com este CNPJ.' })
  }
  db.ocs.push({ cnpj: dados.cnpj, nome: dados.nome })
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
    ocsNome: db.ocs.find(o => o.cnpj === contrato.ocsCnpj)?.nome || '—'
  }
}

export async function mockListarContratos() {
  await esperar(300)
  return banco().contratos.map(contratoDetalhado)
}

export async function mockCriarContrato(dados) {
  await esperar(400)
  const db = banco()
  if (!(dados.valor > 0)) {
    throw erroHttp(422, { codigo: 'VALOR_INVALIDO', mensagem: 'O valor do contrato precisa ser maior que zero.' })
  }
  if (db.contratos.some(c => c.procedimentoId === dados.procedimentoId && c.ocsCnpj === dados.ocsCnpj)) {
    throw erroHttp(409, {
      codigo: 'CONTRATO_DUPLICADO',
      mensagem: 'Já existe contrato desse procedimento com essa OCS.'
    })
  }
  const contrato = { id: proximoId(db.contratos), ...dados }
  db.contratos.push(contrato)
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
