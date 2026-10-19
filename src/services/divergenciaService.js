import axios from 'axios'

export async function buscarDivergencias(faturaId) {
  try {
    const response = await axios.get(`http://localhost:8080/faturas/${faturaId}/divergencias`)
    return response.data
  } catch (error) {
    const err = new Error()
    err.mensagemUsuario = error.response?.data?.mensagem || 'Não foi possível carregar as divergências.'
    throw err
  }
}