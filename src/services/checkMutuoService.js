import { api } from './http.js'
import {
  mockListarAtendimentosOcs,
  mockRegistrarSessao,
  mockCancelarSessao,
  mockListarConfirmacoesPendentes,
  mockConfirmarSessao,
  mockRecusarSessao
} from '../mocks/checkMutuoMock.js'
import { traduzirErro } from '../utils/erros.js'

const USAR_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ---------- OCS ----------

export async function listarAtendimentosDaOcs(cnpj) {
  try {
    if (USAR_MOCK) return await mockListarAtendimentosOcs(cnpj)
    const response = await api.get(`/ocs/${cnpj}/atendimentos`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'OCS não encontrada.' })
  }
}

// OCS avisa que fez o procedimento; o atendimento fica AGUARDANDO_CONFIRMACAO do beneficiário.
export async function registrarSessao(atendimentoId, cnpj) {
  try {
    if (USAR_MOCK) return await mockRegistrarSessao(atendimentoId, cnpj)
    const response = await api.post(`/atendimentos/${atendimentoId}/sessoes`, { cnpj })
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Já existe um pedido aguardando a confirmação do beneficiário.' })
  }
}

export async function cancelarSessao(atendimentoId) {
  try {
    if (USAR_MOCK) return await mockCancelarSessao(atendimentoId)
    await api.delete(`/atendimentos/${atendimentoId}/pedido-confirmacao`)
  } catch (erro) {
    throw traduzirErro(erro)
  }
}

// ---------- Beneficiário ----------

export async function listarConfirmacoesPendentes(precCp) {
  try {
    if (USAR_MOCK) return await mockListarConfirmacoesPendentes(precCp)
    const response = await api.get(`/beneficiarios/${precCp}/confirmacoes-pendentes`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'Beneficiário não encontrado.' })
  }
}

export async function confirmarSessao(atendimentoId) {
  try {
    if (USAR_MOCK) return await mockConfirmarSessao(atendimentoId)
    const response = await api.patch(`/atendimentos/${atendimentoId}/confirmar`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'Este pedido de confirmação não existe mais.' })
  }
}

export async function recusarSessao(atendimentoId) {
  try {
    if (USAR_MOCK) return await mockRecusarSessao(atendimentoId)
    await api.patch(`/atendimentos/${atendimentoId}/recusar`)
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'Este pedido de confirmação não existe mais.' })
  }
}
