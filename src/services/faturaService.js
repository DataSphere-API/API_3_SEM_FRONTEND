import axios from 'axios'

const USAR_MOCK = true

export async function buscarLisuraComDivergencias(faturaId) {
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
          motivo: "Valor apresentado acima do teto contratual.",
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

  const response = await axios.get(`http://localhost:8080/faturas/${faturaId}/lisura`)
  return response.data
}

export async function encaminharFaturaParaAprovacao(faturaId) {
  if (USAR_MOCK) {
    return { sucesso: true, status: "ENCAMINHADA" }
  }

  const response = await axios.post(`http://localhost:8080/faturas/${faturaId}/encaminhar`)
  return response.data
}