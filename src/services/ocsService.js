import { api } from './http.js'
import { traduzirErro } from '../utils/erros.js'

export async function listarOcs() {
  try {
    const response = await api.get('/ocs')
    return response.data.ocs
  } catch (erro) {
    throw traduzirErro(erro)
  }
}

export async function criarOcs(dados) {
  try {
    const response = await api.post('/ocs', dados)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Já existe uma OCS com este CNPJ.' })
  }
}