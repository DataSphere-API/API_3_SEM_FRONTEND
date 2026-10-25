import { api } from './http.js'
import { mockConsultarQr, mockRegistrarSessao, mockValidarBaixaQr } from '../mocks/atendimentoMock.js'
import { traduzirErro } from '../utils/erros.js'

const USAR_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// GET /atendimentos/qrcode/{codigo}?cnpj= (#68)
export async function consultarQr(codigo, cnpj) {
  try {
    if (USAR_MOCK) return await mockConsultarQr(codigo, cnpj)
    const response = await api.get(`/atendimentos/qrcode/${encodeURIComponent(codigo)}`, { params: { cnpj } })
    return response.data
  } catch (erro) {
    throw traduzirErro(erro)
  }
}

// POST /atendimentos/{id}/sessoes (#72): o back espera { cnpj }.
export async function registrarSessao(atendimentoId, cnpj) {
  try {
    if (USAR_MOCK) return await mockRegistrarSessao(atendimentoId)
    const response = await api.post(`/atendimentos/${atendimentoId}/sessoes`, { cnpj })
    return response.data
  } catch (erro) {
    throw traduzirErro(erro)
  }
}

// POST /atendimentos/validar-qrcode (#69): o back espera { qr, cnpj }.
export async function validarBaixaQr(atendimentoId, codigo, cnpj) {
  try {
    if (USAR_MOCK) return await mockValidarBaixaQr(atendimentoId)
    const response = await api.post('/atendimentos/validar-qrcode', { qr: codigo, cnpj })
    return response.data
  } catch (erro) {
    throw traduzirErro(erro)
  }
}