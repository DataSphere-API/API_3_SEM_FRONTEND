import { api } from './api.js'
import { traduzirErro } from '../utils/erros.js'

export async function login(cpf, senha) {
  try {
    const response = await api.post('/auth/login', { cpf, senha })
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 401: 'CPF ou senha incorretos.' })
  }
}

export async function cadastrarBeneficiario(dados) {
  try {
    const response = await api.post('/auth/cadastro', dados)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Este CPF já tem acesso ao sistema.' })
  }
}
