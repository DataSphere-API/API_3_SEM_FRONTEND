import axios from 'axios'

const USAR_MOCK = true

export async function buscarLisura(faturaId, options = {}) {
  if (!faturaId || faturaId === 'undefined' || faturaId === 'null') {
    return { itens: [] }
  }

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
          motivo: "Valor apresentado acima do teto contratual."
        },
        {
          espelhoItemId: 102,
          descricao: "Exame Laboratorial Básico",
          valorApresentado: 100.00,
          valorContratado: 100.00,
          autorizado: true,
          status: "AUTORIZADO",
          motivo: null
        }
      ]
    }
  }

  try {
    const response = await axios.get(`http://localhost:8080/faturas/${faturaId}/lisura`, options)
    return response.data
  } catch (error) {
    const err = new Error()
    err.cancelado = axios.isCancel(error)
    err.mensagemUsuario = error.response?.data?.mensagem || 'Não foi possível carregar a auditoria desta fatura.'
    throw err
  }
}