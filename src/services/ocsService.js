import { api } from './http.js'
import { mockListarOcs, mockCriarOcs } from '../mocks/cadastrosMock.js'
import { traduzirErro } from '../utils/erros.js'

const USAR_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export async function listarOcs() {
  try {
    if (USAR_MOCK) return await mockListarOcs()
    const response = await api.get('/ocs')
    return response.data
  } catch (erro) {
    throw traduzirErro(erro)
  }
}

export async function criarOcs(dados) {
  try {
    if (USAR_MOCK) return await mockCriarOcs(dados)
    const response = await api.post('/ocs', dados)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Já existe uma OCS com este CNPJ.' })
  }
}
