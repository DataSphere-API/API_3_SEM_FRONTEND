import { api } from './http.js'
import { traduzirErro } from '../utils/erros.js'

const USAR_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export async function buscarLisuraComDivergencias(faturaId) {
  try {
    if (USAR_MOCK) {
      return {
        itens: [
          {
            espelhoItemId: 101,
            descricao: "Consulta Médica Especializada",
            valorApresentado: 250.00,
            valorContratado: 200.00,
            autorizado: false,
            status: "NÃO AUTORIZADO",
            motivo: "Valor apresentado acima do valor contratado",
            severidade: "ALTA"
          },
          {
            espelhoItemId: 102,
            descricao: "Exame Laboratorial Básico",
            valorApresentado: 100.00,
            valorContratado: 100.00,
            autorizado: true,
            status: "AUTORIZADO",
            motivo: null,
            severidade: "BAIXA"
          }
        ]
      }
    }

    const response = await api.get(`/faturas/${faturaId}/lisura`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'Fatura não encontrada.' })
  }
}

export async function encaminharFaturaParaAprovacao(faturaId) {
  try {
    if (USAR_MOCK) {
      return { sucesso: true, status: "ENCAMINHADA" }
    }

    const response = await api.post(`/faturas/${faturaId}/encaminhar`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 422: 'A fatura ainda tem itens pendentes de auditoria.' })
  }
}