import { api } from './http.js'

export async function buscarDivergencias(faturaId) {
  try {
    const response = await api.get(`/faturas/${faturaId}/divergencias`)
    return response.data
  } catch (error) {
    const err = new Error()
    err.mensagemUsuario = error.response?.data?.mensagem || 'Não foi possível carregar as divergências.'
    throw err
  }
}