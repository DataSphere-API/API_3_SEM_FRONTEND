import { api } from './http.js'
import { mockListarFaturas, mockBuscarFatura } from '../mocks/faturaMensalMock.js'
import { traduzirErro } from '../utils/erros.js'

const USAR_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// filtros: { cnpj, competencia: 'AAAA-MM' }
export async function listarFaturasMensais(filtros = {}) {
  try {
    if (USAR_MOCK) return await mockListarFaturas(filtros)
    const response = await api.get('/faturas', { params: filtros })
    return response.data
  } catch (erro) {
    throw traduzirErro(erro)
  }
}

export async function buscarFaturaMensal(id) {
  try {
    if (USAR_MOCK) return await mockBuscarFatura(id)
    const response = await api.get(`/faturas/${id}`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'Fatura não encontrada.' })
  }
}

