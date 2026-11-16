import { api } from './http.js'
import { traduzirErro } from '../utils/erros.js'

const USAR_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export async function listarGuias() {
  try {
    if (USAR_MOCK) {
      return [
        {
          id: 1,
          numero: 'G-2026-001',
          beneficiario: 'João Pedro Lima',
          status: 'EMITIDA',
          dataEmissao: '2026-10-09'
        },
        {
          id: 2,
          numero: 'G-2026-002',
          beneficiario: 'Ana Paula Souza',
          status: 'EMITIDA',
          dataEmissao: '2026-10-08'
        }
      ]
    }
    const response = await api.get('/guias')
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'Nenhuma guia encontrada.' })
  }
}
