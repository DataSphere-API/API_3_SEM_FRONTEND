import { api } from './http.js'
import { mockBuscarBeneficiarios } from '../mocks/cadastrosMock.js'
import { traduzirErro } from '../utils/erros.js'

const USAR_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export async function buscarBeneficiarios(busca) {
  try {
    if (USAR_MOCK) return await mockBuscarBeneficiarios(busca)
    const response = await api.get('/beneficiarios', { params: { busca } })
    return response.data
  } catch (erro) {
    throw traduzirErro(erro)
  }
}
