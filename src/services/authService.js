import { api } from './http.js'
import { mockLogin, mockCadastrarBeneficiario } from '../mocks/authMock.js'
import { traduzirErro } from '../utils/erros.js'

const USAR_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export async function login(cpf, senha) {
  try {
    if (USAR_MOCK) return await mockLogin(cpf, senha)
    const response = await api.post('/auth/login', { cpf, senha })
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 401: 'CPF ou senha incorretos.' })
  }
}

export async function cadastrarBeneficiario(dados) {
  try {
    if (USAR_MOCK) return await mockCadastrarBeneficiario(dados)
    const response = await api.post('/auth/cadastro', dados)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Este CPF já tem acesso ao sistema.' })
  }
}
