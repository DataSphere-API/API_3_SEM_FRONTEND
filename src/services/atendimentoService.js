import { api } from './api.js'
import { traduzirErro } from '../utils/erros.js'

// GET /ocs/{cnpj}/atendimentos: só os atendimentos da OCS logada.
export async function listarAtendimentosDaOcs(cnpj) {
  try {
    const { data } = await api.get(`/ocs/${encodeURIComponent(cnpj)}/atendimentos`)
    return data
  } catch (erro) {
    throw traduzirErro(erro, { 403: 'Estes atendimentos são de outra OCS.' })
  }
}

// POST /atendimentos/{id}/sessoes. O back usa a OCS do login; o cnpj vai porque o corpo ainda o exige.
export async function registrarSessao(atendimentoId, cnpj) {
  try {
    const { data } = await api.post(`/atendimentos/${atendimentoId}/sessoes`, { cnpj })
    return data
  } catch (erro) {
    throw traduzirErro(erro, { padrao: 'Não foi possível registrar a sessão.' })
  }
}

// GET /atendimentos/qrcode/{codigo}: conferência antes da baixa final.
export async function consultarQr(codigo) {
  try {
    const { data } = await api.get(`/atendimentos/qrcode/${encodeURIComponent(codigo)}`)
    return data
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'QR Code não encontrado.' })
  }
}

// POST /atendimentos/validar-qrcode: baixa final do procedimento.
export async function darBaixaPorQr(codigo) {
  try {
    const { data } = await api.post('/atendimentos/validar-qrcode', { qr: codigo })
    return data
  } catch (erro) {
    throw traduzirErro(erro, { padrao: 'Não foi possível dar a baixa.' })
  }
}
