import { api } from './http.js'
import { mockListarUsuarios, mockSalvarUsuario } from '../mocks/cadastrosMock.js'
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

export async function salvarUsuario(dados, id = null) {
  try {
    if (USAR_MOCK) return await mockSalvarUsuario(dados, id)
    const response = id ? await api.put(`/usuarios/${id}`, dados) : await api.post('/usuarios', dados)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Já existe um usuário com este CPF.' })
  }
}
