import { banco, persistir, proximoId, nomeDoUsuario } from './bancoMock.js'
import { erroHttp, esperar } from './auxiliares.js'
import { somenteDigitos } from '../utils/documentos.js'

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

export async function mockCadastrarBeneficiario(dados) {
  await esperar(500)
  const db = banco()
  const beneficiario = db.beneficiarios.find(b => b.precCp === dados.precCp)
  if (!beneficiario || beneficiario.dataNascimento !== dados.dataNascimento) {
    throw erroHttp(422, {
      codigo: 'BENEFICIARIO_NAO_CONFERE',
      mensagem: 'Não encontramos um beneficiário com esse Prec-CP e data de nascimento.'
    })
  }
  if (db.usuarios.some(u => u.precCp === dados.precCp)) {
    throw erroHttp(409, {
      codigo: 'BENEFICIARIO_JA_CADASTRADO',
      mensagem: 'Este beneficiário já tem acesso. Entre com seu CPF e senha.'
    })
  }
  if (db.usuarios.some(u => u.cpf === dados.cpf)) {
    throw erroHttp(409, { codigo: 'CPF_JA_CADASTRADO', mensagem: 'Este CPF já tem acesso ao sistema.' })
  }
  db.usuarios.push({
    id: proximoId(db.usuarios),
    cpf: dados.cpf,
    senha: dados.senha,
    perfis: ['BENEFICIARIO'],
    precCp: dados.precCp,
    crm: '',
    ocsCnpj: '',
    cargo: ''
  })
  persistir()
  return { id: db.usuarios[db.usuarios.length - 1].id, nome: beneficiario.nome }
}
