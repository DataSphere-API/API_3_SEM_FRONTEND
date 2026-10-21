import { api } from './http.js'
import {
  mockListarFluxo,
  mockBuscarFluxo,
  mockCriarPreGuia,
  mockCorrigirPreGuia,
  mockDecidirPreGuia,
  mockEmitirGuia
} from '../mocks/fluxoPreGuiaMock.js'
import { traduzirErro } from '../utils/erros.js'

const USAR_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// filtros: { status, pendenteDe: 'MEDICO' | 'CHEFE' }
export async function listarPreGuiasDoFluxo(filtros = {}) {
  try {
    if (USAR_MOCK) return await mockListarFluxo(filtros)
    const response = await api.get('/pre-guias', { params: filtros })
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'Nenhuma pré-guia encontrada.' })
  }
}

export async function buscarPreGuiaDoFluxo(id) {
  try {
    if (USAR_MOCK) return await mockBuscarFluxo(id)
    const response = await api.get(`/pre-guias/${id}`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'Pré-guia não encontrada.' })
  }
}

export async function criarPreGuia(dados) {
  try {
    if (USAR_MOCK) return await mockCriarPreGuia(dados)
    const response = await api.post('/pre-guias', dados)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 422: 'Confira os dados da pré-guia.' })
  }
}

export async function corrigirPreGuia(id, dados) {
  try {
    if (USAR_MOCK) return await mockCorrigirPreGuia(id, dados)
    const response = await api.put(`/pre-guias/${id}`, dados)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Só é possível corrigir uma pré-guia devolvida.' })
  }
}

// acao: 'aprovar' | 'devolver' | 'reprovar'. O back sabe pelo token se quem decide é o médico ou o chefe.
export async function decidirPreGuia(id, acao, observacao = '') {
  try {
    if (USAR_MOCK) return await mockDecidirPreGuia(id, acao, observacao)
    const corpo = acao === 'aprovar' ? undefined : acao === 'reprovar' ? { motivo: observacao } : { observacao }
    const response = await api.patch(`/pre-guias/${id}/${acao}`, corpo)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Esta pré-guia não está mais aguardando a sua decisão.' })
  }
}

export async function emitirGuia(id) {
  try {
    if (USAR_MOCK) return await mockEmitirGuia(id)
    const response = await api.post(`/pre-guias/${id}/emitir`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'A guia só pode ser emitida depois das duas aprovações.' })
  }
}
