import { api } from './http.js'
import {
  mockListarPreGuias,
  mockBuscarPreGuia,
  mockValidarPreGuia,
  mockAprovarPreGuia,
  mockReprovarPreGuia,
  mockEmitirPreGuia
} from '../mocks/preGuiaMock.js'
import { traduzirErro } from '../utils/erros.js'

const USAR_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export async function listarPreGuias() {
  try {
    if (USAR_MOCK) return await mockListarPreGuias()
    const response = await api.get('/pre-guias')
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'Nenhuma pré-guia encontrada.' })
  }
}

export async function buscarPreGuia(id) {
  try {
    if (USAR_MOCK) return await mockBuscarPreGuia(id)
    const response = await api.get(`/pre-guias/${id}/documento-conferencia`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'Pré-guia não encontrada.' })
  }
}

export async function validarPreGuia(id) {
  try {
    if (USAR_MOCK) return await mockValidarPreGuia(id)
    const response = await api.post(`/pre-guias/${id}/validar`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 422: 'Não foi possível validar a pré-guia.' })
  }
}

export async function aprovarPreGuia(id) {
  try {
    if (USAR_MOCK) return await mockAprovarPreGuia(id)
    const response = await api.patch(`/pre-guias/${id}/aprovar`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 422: 'Não foi possível aprovar a pré-guia.' })
  }
}

export async function reprovarPreGuia(id, motivo) {
  try {
    if (USAR_MOCK) return await mockReprovarPreGuia(id, motivo)
    const response = await api.patch(`/pre-guias/${id}/reprovar`, { motivo })
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 422: 'O motivo da reprovação é obrigatório.' })
  }
}

export async function emitirPreGuia(id) {
  try {
    if (USAR_MOCK) return await mockEmitirPreGuia(id)
    const response = await api.post(`/pre-guias/${id}/emitir`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 422: 'Não foi possível emitir a guia.' })
  }
}