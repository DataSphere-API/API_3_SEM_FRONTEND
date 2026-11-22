import { api } from './api.js'
import { traduzirErro } from '../utils/erros.js'

export async function buscarBeneficiarios(busca) {
  try {
    const response = await api.get('/beneficiarios', { params: { busca } })
    return response.data.beneficiarios
  } catch (erro) {
    throw traduzirErro(erro)
  }
}