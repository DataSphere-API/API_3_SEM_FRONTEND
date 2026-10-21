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

// OCS avisa que fez o procedimento; a sessão fica aguardando o beneficiário.
export async function registrarSessao(atendimentoId, cnpj) {
  try {
    if (USAR_MOCK) return await mockRegistrarSessao(atendimentoId, cnpj)
    const response = await api.post(`/atendimentos/${atendimentoId}/sessoes`, { cnpj })
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Já existe uma sessão aguardando a confirmação do beneficiário.' })
  }
}

export async function cancelarSessao(atendimentoId, sessaoId) {
  try {
    if (USAR_MOCK) return await mockCancelarSessao(atendimentoId, sessaoId)
    await api.delete(`/atendimentos/${atendimentoId}/sessoes/${sessaoId}`)
  } catch (erro) {
    throw traduzirErro(erro)
  }
}

// ---------- Beneficiário ----------

export async function listarConfirmacoesPendentes(precCp) {
  try {
    if (USAR_MOCK) return await mockListarConfirmacoesPendentes(precCp)
    const response = await api.get(`/beneficiarios/${precCp}/sessoes-pendentes`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'Beneficiário não encontrado.' })
  }
}

export async function confirmarSessao(sessaoId) {
  try {
    if (USAR_MOCK) return await mockConfirmarSessao(sessaoId)
    const response = await api.patch(`/sessoes/${sessaoId}/confirmar`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'Este pedido de confirmação não existe mais.' })
  }
}

export async function recusarSessao(sessaoId) {
  try {
    if (USAR_MOCK) return await mockRecusarSessao(sessaoId)
    await api.patch(`/sessoes/${sessaoId}/recusar`)
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'Este pedido de confirmação não existe mais.' })
  }
}
