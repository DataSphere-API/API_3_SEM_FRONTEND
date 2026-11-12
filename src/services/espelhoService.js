import { api } from './http.js'
import {
  mockListarEspelhos,
  mockListarItensEspelho,
  mockCriarEspelho,
  mockCorrigirItemEspelho,
  mockRemoverItemEspelho,
  mockReenviarEspelho
} from '../mocks/espelhoMock.js'
import { traduzirErro } from '../utils/erros.js'

const USAR_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// filtros: { cnpj, status } — a OCS lista só os dela pelo cnpj.
export async function listarEspelhos(filtros = {}, { usarMock = USAR_MOCK } = {}) {
  try {
    if (usarMock) return await mockListarEspelhos(filtros)
    const response = await api.get('/espelhos', { params: filtros })
    return response.data
  } catch (erro) {
    throw traduzirErro(erro)
  }
}

export async function listarItensEspelho(id, { usarMock = USAR_MOCK } = {}) {
  try {
    if (usarMock) return await mockListarItensEspelho(id)
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
    const response = await api.patch(`/espelhos/${id}/aprovar`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Este espelho já foi auditado.' })
  }
}

export async function reprovarEspelho(id, motivo) {
  try {
    const response = await api.patch(`/espelhos/${id}/reprovar`, { motivo })
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 400: 'O motivo da reprovação é obrigatório.' })
  }
}

// ---------- OCS corrige um espelho reprovado e reenvia ----------

export async function corrigirItemEspelho(id, itemId, valor) {
  try {
    if (USAR_MOCK) return await mockCorrigirItemEspelho(id, itemId, { valor })
    await api.patch(`/espelhos/${id}/itens/${itemId}`, { valor })
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Só dá para corrigir um espelho reprovado.' })
  }
}

export async function removerItemEspelho(id, itemId) {
  try {
    if (USAR_MOCK) return await mockRemoverItemEspelho(id, itemId)
    await api.delete(`/espelhos/${id}/itens/${itemId}`)
  } catch (erro) {
    throw traduzirErro(erro, { 422: 'O espelho precisa ter pelo menos um atendimento.' })
  }
}

export async function reenviarEspelho(id) {
  try {
    if (USAR_MOCK) return await mockReenviarEspelho(id)
    const response = await api.post(`/espelhos/${id}/reenviar`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Só dá para reenviar um espelho reprovado.' })
  }
}

export async function historicoDoEspelho(id) {
  try {
    const response = await api.get(`/espelhos/${id}/historico`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro)
  }
}

// O back registra o histórico por procedimento (Guia_Proc): o id aqui é o atendimentoId.
export async function historicoDoAtendimento(atendimentoId) {
  try {
    const response = await api.get(`/guias/${atendimentoId}/historico`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro)
  }
}
