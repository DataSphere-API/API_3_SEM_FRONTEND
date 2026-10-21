import { api } from './http.js'
import {
  mockListarContratos,
  mockSalvarContrato,
  mockListarProcedimentos
} from '../mocks/cadastrosMock.js'
import { traduzirErro } from '../utils/erros.js'

const USAR_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export async function listarContratos() {
  try {
    if (USAR_MOCK) return await mockListarContratos()
    const response = await api.get('/contratos')
    return response.data
  } catch (erro) {
    throw traduzirErro(erro)
  }
}

export async function salvarContrato(dados, id = null) {
  try {
    if (USAR_MOCK) return await mockSalvarContrato(dados, id)
    const response = id ? await api.put(`/contratos/${id}`, dados) : await api.post('/contratos', dados)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Já existe contrato desse procedimento com essa OCS no mesmo período.' })
  }
}

export async function listarProcedimentos() {
  try {
    if (USAR_MOCK) return await mockListarProcedimentos()
    const response = await api.get('/procedimentos')
    return response.data
  } catch (erro) {
    throw traduzirErro(erro)
  }
}
