import { api } from './http.js'
import {
  mockListarContratos,
  mockCriarContrato,
  mockListarProcedimentos,
  mockCriarProcedimento
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

export async function criarContrato(dados) {
  try {
    if (USAR_MOCK) return await mockCriarContrato(dados)
    const response = await api.post('/contratos', dados)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Já existe contrato desse procedimento com essa OCS.' })
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

export async function criarProcedimento(dados) {
  try {
    if (USAR_MOCK) return await mockCriarProcedimento(dados)
    const response = await api.post('/procedimentos', dados)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Já existe um procedimento com esse nome.' })
  }
}
