import { api } from './http.js'
import { mockListarOcs, mockSalvarOcs } from '../mocks/cadastrosMock.js'
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

export async function salvarOcs(dados, cnpjOriginal = null) {
  try {
    if (USAR_MOCK) return await mockSalvarOcs(dados, cnpjOriginal)
    const response = cnpjOriginal
      ? await api.put(`/ocs/${cnpjOriginal}`, dados)
      : await api.post('/ocs', dados)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Já existe uma OCS com este CNPJ.' })
  }
}
