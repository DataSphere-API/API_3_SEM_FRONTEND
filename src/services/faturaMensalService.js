import { api } from './api.js'
import { erroDeFormato, traduzirErro } from '../utils/erros.js'

function temResumoMensal(fatura) {
  return typeof fatura?.competencia === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(fatura.competencia)
    && typeof fatura.ocsNome === 'string'
}

export async function listarFaturasMensais(filtros = {}) {
  try {
    const { data } = await api.get('/faturas', { params: filtros })
    if (!Array.isArray(data) || !data.every(temResumoMensal)) throw erroDeFormato()
    return data
  } catch (erro) {
    throw traduzirErro(erro)
  }
}

export async function buscarFaturaMensal(id) {
  try {
    const { data } = await api.get(`/faturas/${id}`)
    if (!temResumoMensal(data) || !Array.isArray(data.espelhos) || !Array.isArray(data.pendentes)
      || !data.espelhos.every(espelho => Array.isArray(espelho?.itens))) {
      throw erroDeFormato()
    }
    return data
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'Fatura não encontrada.' })
  }
}

export async function encaminharFaturaMensal(id) {
  try {
    const response = await api.post(`/faturas/${id}/encaminhar`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 422: 'A fatura ainda não pode ser encaminhada.' })
  }
}

export async function buscarLisuraDaFatura(id) {
  try {
    const { data } = await api.get(`/faturas/${id}/lisura`)
    if (!Array.isArray(data?.itens)) throw erroDeFormato()
    return data
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'Fatura não encontrada.' })
  }
}

export async function buscarDivergenciasDaFatura(id) {
  try {
    const { data } = await api.get(`/faturas/${id}/divergencias`)
    if (!Array.isArray(data?.itens)) throw erroDeFormato()
    return data
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'Fatura não encontrada.' })
  }
}

export async function aprovarFaturaMensal(id) {
  try {
    const { data } = await api.patch(`/faturas/${id}/aprovar`)
    return data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'A fatura não está encaminhada para aprovação.' })
  }
}

export async function liquidarFaturaMensal(id) {
  try {
    const { data } = await api.patch(`/faturas/${id}/liquidar`)
    return data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Só uma fatura aprovada pode ser liquidada.' })
  }
}
