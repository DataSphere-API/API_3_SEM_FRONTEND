import { banco, persistir, proximoId } from './bancoMock.js'
import { erroHttp, esperar } from './auxiliares.js'
import { somenteDigitos } from '../utils/documentos.js'

export function usuarioPublico(usuario) {
  const { senha, ...publico } = usuario
  return publico
}

export async function mockLogin(cpf, senha) {
  await esperar(400)
  const usuario = banco().usuarios.find(u => u.cpf === somenteDigitos(cpf))
  if (!usuario || usuario.senha !== senha) {
    throw erroHttp(401, { codigo: 'CREDENCIAIS_INVALIDAS', mensagem: 'CPF ou senha incorretos.' })
  }
  if (!usuario.ativo) {
    throw erroHttp(403, { codigo: 'USUARIO_INATIVO', mensagem: 'Seu acesso está desativado. Procure a Chefia do FUSEx.' })
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
  if (db.usuarios.some(u => u.precCp === dados.precCp && u.perfis.includes('BENEFICIARIO'))) {
    throw erroHttp(409, {
      codigo: 'BENEFICIARIO_JA_CADASTRADO',
      mensagem: 'Este beneficiário já tem cadastro. Entre com seu CPF e senha.'
    })
  }
  if (db.usuarios.some(u => u.cpf === dados.cpf)) {
    throw erroHttp(409, { codigo: 'CPF_JA_CADASTRADO', mensagem: 'Este CPF já tem acesso ao sistema.' })
  }

  const usuario = {
    id: proximoId(db.usuarios),
    nome: beneficiario.nome,
    cpf: dados.cpf,
    postoGraduacao: '',
    email: dados.email,
    telefone: dados.telefone,
    perfis: ['BENEFICIARIO'],
    precCp: dados.precCp,
    crm: '',
    crmUf: '',
    ocsCnpj: '',
    ativo: true,
    senha: dados.senha
  }
  db.usuarios.push(usuario)
  persistir()
  return { id: usuario.id, nome: usuario.nome }
}
