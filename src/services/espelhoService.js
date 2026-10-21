import { api } from './http.js'
import {
  mockListarEspelhos,
  mockListarItensEspelho,
  mockCriarEspelho,
  mockAprovarEspelho,
  mockReprovarEspelho,
  mockHistorico
} from '../mocks/espelhoMock.js'
import { traduzirErro } from '../utils/erros.js'

const USAR_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// filtros: { cnpj, status } — a OCS lista só os dela pelo cnpj.
export async function listarEspelhos(filtros = {}) {
  try {
    if (USAR_MOCK) return await mockListarEspelhos(filtros)
    const response = await api.get('/espelhos', { params: filtros })
    return response.data
  } catch (erro) {
    throw traduzirErro(erro)
  }
}

export async function listarItensEspelho(id) {
  try {
    if (USAR_MOCK) return await mockListarItensEspelho(id)
    const response = await api.get(`/espelhos/${id}/itens`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'Espelho não encontrado.' })
  }
}

export async function criarEspelho(dados) {
  try {
    if (USAR_MOCK) return await mockCriarEspelho(dados)
    const response = await api.post('/espelhos', dados)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Este atendimento já tem espelho.' })
  }
}

export async function aprovarEspelho(id) {
  try {
    if (USAR_MOCK) return await mockAprovarEspelho(id)
    const response = await api.patch(`/espelhos/${id}/aprovar`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Este espelho já foi auditado.' })
  }
}

export async function reprovarEspelho(id, motivo) {
  try {
    if (USAR_MOCK) return await mockReprovarEspelho(id, motivo)
    const response = await api.patch(`/espelhos/${id}/reprovar`, { motivo })
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 400: 'O motivo da reprovação é obrigatório.' })
  }
}

export async function historicoDoEspelho(id) {
  try {
    if (USAR_MOCK) return await mockHistorico('ESPELHO', id)
    const response = await api.get(`/espelhos/${id}/historico`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro)
  }
}

// O back registra o histórico por procedimento (Guia_Proc): o id aqui é o atendimentoId.
export async function historicoDoAtendimento(atendimentoId) {
  try {
    if (USAR_MOCK) return await mockHistorico('GUIA_PROC', atendimentoId)
    const response = await api.get(`/guias/${atendimentoId}/historico`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro)
  }
}
