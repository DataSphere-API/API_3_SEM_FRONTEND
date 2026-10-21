import { banco, persistir, proximoId, nomeDoUsuario } from './bancoMock.js'
import { erroHttp, esperar } from './auxiliares.js'
import { somenteDigitos, precCpValido, ehTitular, basePrecCp } from '../utils/documentos.js'

export function usuarioPublico(usuario) {
  return {
    id: usuario.id,
    nome: nomeDoUsuario(usuario),
    cpf: usuario.cpf,
    perfis: [...usuario.perfis],
    precCp: usuario.precCp,
    crm: usuario.crm,
    ocsCnpj: usuario.ocsCnpj,
    cargo: usuario.cargo
  }
}

export async function mockLogin(cpf, senha) {
  await esperar(400)
  const usuario = banco().usuarios.find(u => u.cpf === somenteDigitos(cpf))
  if (!usuario || usuario.senha !== senha) {
    throw erroHttp(401, { codigo: 'CREDENCIAIS_INVALIDAS', mensagem: 'CPF ou senha incorretos.' })
  }
  return { token: `mock-token-${usuario.id}`, usuario: usuarioPublico(usuario) }
}

// POST /auth/cadastro: a pessoa cria o próprio cadastro de beneficiário e o login.
// Titular: Prec-CP terminado em -00. Dependente: mesmo início do Prec-CP do responsável (achado
// pelo CPF de login dele), com final -01, -02...
export async function mockCadastrarBeneficiario(dados) {
  await esperar(500)
  const db = banco()
  if (!precCpValido(dados.precCp)) {
    throw erroHttp(400, { codigo: 'PREC_CP_INVALIDO', mensagem: 'O Prec-CP precisa ter o formato 123456789-00.' })
  }
  if (!dados.dependente && !ehTitular(dados.precCp)) {
    throw erroHttp(422, { codigo: 'PREC_CP_TITULAR_INVALIDO', mensagem: 'O Prec-CP do beneficiário principal termina em -00.' })
  }
  if (dados.dependente) {
    if (ehTitular(dados.precCp)) {
      throw erroHttp(422, { codigo: 'PREC_CP_DEPENDENTE_INVALIDO', mensagem: 'O Prec-CP do dependente não pode terminar em -00.' })
    }
    const responsavel = db.usuarios.find(u => u.cpf === dados.cpfResponsavel)
    if (!responsavel || !ehTitular(responsavel.precCp)) {
      throw erroHttp(422, {
        codigo: 'RESPONSAVEL_NAO_ENCONTRADO',
        mensagem: 'Não encontramos um beneficiário principal com esse CPF.'
      })
    }
    if (basePrecCp(responsavel.precCp) !== basePrecCp(dados.precCp)) {
      throw erroHttp(422, {
        codigo: 'PREC_CP_NAO_CONFERE',
        mensagem: 'O Prec-CP não bate com o do responsável: o início precisa ser o mesmo.'
      })
    }
  }

  // O Prec-CP pode já estar no banco sem login (carga); aí só liga o login a ele.
  const existente = db.beneficiarios.find(b => b.precCp === dados.precCp)
  if (existente && db.usuarios.some(u => u.precCp === dados.precCp)) {
    throw erroHttp(409, {
      codigo: 'BENEFICIARIO_JA_CADASTRADO',
      mensagem: 'Este Prec-CP já tem acesso. Entre com seu CPF e senha.'
    })
  }
  if (existente && existente.dataNascimento !== dados.dataNascimento) {
    throw erroHttp(422, {
      codigo: 'BENEFICIARIO_NAO_CONFERE',
      mensagem: 'Este Prec-CP já está cadastrado com outra data de nascimento.'
    })
  }
  if (db.usuarios.some(u => u.cpf === dados.cpf)) {
    throw erroHttp(409, { codigo: 'CPF_JA_CADASTRADO', mensagem: 'Este CPF já tem acesso ao sistema.' })
  }

  const beneficiario = existente || {
    precCp: dados.precCp,
    nome: dados.nome,
    dataNascimento: dados.dataNascimento,
    dependente: Boolean(dados.dependente),
    ug: ''
  }
  if (!existente) db.beneficiarios.push(beneficiario)
  const usuario = {
    id: proximoId(db.usuarios),
    cpf: dados.cpf,
    senha: dados.senha,
    perfis: ['BENEFICIARIO'],
    precCp: dados.precCp,
    crm: '',
    ocsCnpj: '',
    cargo: ''
  }
  db.usuarios.push(usuario)
  persistir()
  return { id: usuario.id, nome: beneficiario.nome, precCp: beneficiario.precCp }
}
