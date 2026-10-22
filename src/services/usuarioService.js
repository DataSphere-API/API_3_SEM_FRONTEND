import { api } from './http.js'
import { mockListarUsuarios, mockCriarUsuario, mockListarMedicos } from '../mocks/cadastrosMock.js'
import { traduzirErro } from '../utils/erros.js'

const USAR_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export async function listarUsuarios() {
  try {
    if (USAR_MOCK) return await mockListarUsuarios()
    const response = await api.get('/usuarios')
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 403: 'Apenas o Chefe do FUSEx pode ver os usuários.' })
  }
}

export async function criarUsuario(dados) {
  try {
    if (USAR_MOCK) return await mockCriarUsuario(dados)
    const response = await api.post('/usuarios', dados)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Já existe um usuário com este CPF.' })
  }
}

export async function listarMedicos() {
  try {
    if (USAR_MOCK) return await mockListarMedicos()
    const response = await api.get('/medicos')
    return response.data
  } catch (erro) {
    throw traduzirErro(erro)
  }
}
