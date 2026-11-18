import { api } from './http.js'
import { traduzirErro } from '../utils/erros.js'

export async function listarUsuarios() {
  try {
    const response = await api.get('/usuarios')
    return response.data.usuarios
  } catch (erro) {
    throw traduzirErro(erro, { 403: 'Apenas o Chefe do FUSEx pode ver os usuários.' })
  }
}

export async function criarUsuario(dados) {
  try {
    const response = await api.post('/usuarios', dados)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Já existe um usuário com este CPF.' })
  }
}

export async function listarMedicos() {
  try {
    const response = await api.get('/medicos')
    return response.data.medicos
  } catch (erro) {
    throw traduzirErro(erro)
  }
}