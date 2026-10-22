import { api } from './http.js'
import {
  mockListarPreGuias,
  mockBuscarPreGuia,
  mockCriarPreGuia,
  mockEditarPreGuia,
  mockValidarPreGuia,
  mockAprovarPreGuia,
  mockReprovarPreGuia,
  mockEmitirGuia
} from '../mocks/fluxoPreGuiaMock.js'
import { traduzirErro } from '../utils/erros.js'

const USAR_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// #75 — resumo. Para o MEDICO o back devolve só as pré-guias em que ele é o responsável.
export async function listarPreGuiasDoFluxo(filtros = {}) {
  try {
    if (USAR_MOCK) return await mockListarPreGuias(filtros)
    const response = await api.get('/pre-guias', { params: filtros })
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 400: 'Status inválido.' })
  }
}

// #76 — detalhe.
export async function buscarPreGuiaDoFluxo(id) {
  try {
    if (USAR_MOCK) return await mockBuscarPreGuia(id)
    const response = await api.get(`/pre-guias/${id}`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'Pré-guia não encontrada.' })
  }
}

// dados: { beneficiarioPrecCp, medicoId, procedimentos: [{ procedimentoId, ocsCnpj, quantidade }] }
export async function criarPreGuia(dados) {
  try {
    if (USAR_MOCK) return await mockCriarPreGuia(dados)
    const response = await api.post('/pre-guias', dados)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 400: 'Preencha o beneficiário, o médico e os procedimentos.' })
  }
}

export async function editarPreGuia(id, dados) {
  try {
    if (USAR_MOCK) return await mockEditarPreGuia(id, dados)
    const response = await api.put(`/pre-guias/${id}`, dados)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Esta pré-guia não pode mais ser editada.' })
  }
}

// #82 — "Enviar para aprovação": valida e devolve { status, validada, pendencias }.
export async function enviarParaAprovacao(id) {
  try {
    if (USAR_MOCK) return await mockValidarPreGuia(id)
    const response = await api.post(`/pre-guias/${id}/validar`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Esta pré-guia já foi enviada para aprovação.' })
  }
}

// #77 — o back sabe pelo token se quem aprova é o médico ou o chefe.
export async function aprovarPreGuia(id) {
  try {
    if (USAR_MOCK) return await mockAprovarPreGuia(id)
    const response = await api.patch(`/pre-guias/${id}/aprovar`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Esta pré-guia não está aguardando a sua aprovação.' })
  }
}

export async function reprovarPreGuia(id, motivo) {
  try {
    if (USAR_MOCK) return await mockReprovarPreGuia(id, motivo)
    const response = await api.patch(`/pre-guias/${id}/reprovar`, { motivo })
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 400: 'O motivo da reprovação é obrigatório.' })
  }
}

// #78
export async function emitirGuia(id) {
  try {
    if (USAR_MOCK) return await mockEmitirGuia(id)
    const response = await api.post(`/pre-guias/${id}/emitir`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'A guia só pode ser emitida depois das duas aprovações.' })
  }
}
