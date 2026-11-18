import { api } from './http.js'
import { traduzirErro } from '../utils/erros.js'

// filtros: { cnpj, status } — a OCS lista só os dela pelo cnpj.
export async function listarEspelhos(filtros = {}) {
  try {
    const response = await api.get('/espelhos', { params: filtros })
    return response.data
  } catch (erro) {
    throw traduzirErro(erro)
  }
}

export async function listarItensEspelho(id) {
  try {
    const response = await api.get(`/espelhos/${id}/itens`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'Espelho não encontrado.' })
  }
}

export async function criarEspelho(dados) {
  try {
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
    await api.patch(`/espelhos/${id}/itens/${itemId}`, { valor })
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Só dá para corrigir um espelho reprovado.' })
  }
}

export async function removerItemEspelho(id, itemId) {
  try {
    await api.delete(`/espelhos/${id}/itens/${itemId}`)
  } catch (erro) {
    throw traduzirErro(erro, { 422: 'O espelho precisa ter pelo menos um atendimento.' })
  }
}

export async function reenviarEspelho(id) {
  try {
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
