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

export async function buscarEspelho(id) {
  try {
    const response = await api.get(`/espelhos/${id}`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'Espelho não encontrado.' })
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

export async function corrigirItemEspelho(id, itemId, dadosOuValor) {
  try {
    const payload = typeof dadosOuValor === 'object' && dadosOuValor !== null
      ? dadosOuValor
      : { valor: dadosOuValor }
    const response = await api.patch(`/espelhos/${id}/itens/${itemId}`, payload)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Só dá para corrigir um espelho reprovado.' })
  }
}

export async function removerItemEspelho(id, itemId) {
  try {
    const response = await api.delete(`/espelhos/${id}/itens/${itemId}`)
    return response.data
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

// O back registra o histórico por procedimento (Guia_Proc): o id aqui é o atendimentoId.
export async function historicoDoAtendimento(atendimentoId) {
  try {
    const response = await api.get(`/guias/${atendimentoId}/historico`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro)
  }
}
