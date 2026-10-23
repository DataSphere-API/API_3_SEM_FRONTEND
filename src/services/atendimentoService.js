import axios from 'axios'
import { mockConsultarQr, mockRegistrarSessao, mockValidarBaixaQr } from '../mocks/atendimentoMock.js'

const USAR_MOCK = true

export async function consultarQr(codigo, cnpj) {
  if (USAR_MOCK) {
    return await mockConsultarQr(codigo, cnpj)
  }
  const response = await axios.get(`http://localhost:8080/atendimentos/qrcode/${encodeURIComponent(codigo)}`, {
    params: { cnpj }
  })
  return response.data
}

export async function registrarSessao(atendimentoId) {
  if (USAR_MOCK) {
    return await mockRegistrarSessao(atendimentoId)
  }
  const response = await axios.post(`http://localhost:8080/atendimentos/${atendimentoId}/sessoes`)
  return response.data
}

export async function validarBaixaQr(atendimentoId) {
  if (USAR_MOCK) {
    return await mockValidarBaixaQr(atendimentoId)
  }
  const response = await axios.post('http://localhost:8080/atendimentos/validar-qrcode', String(atendimentoId), {
    headers: { 'Content-Type': 'text/plain' }
  })
  return response.data
}