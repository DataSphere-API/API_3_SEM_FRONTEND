import { api } from './api.js'
import { traduzirErro } from '../utils/erros.js'

export async function listarContratos() {
  try {
    const response = await api.get('/contratos')
    return response.data.contratos
  } catch (erro) {
    throw traduzirErro(erro)
  }
}

export async function criarContrato(dados) {
  try {
    const response = await api.post('/contratos', dados)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Já existe contrato desse procedimento com essa OCS.' })
  }
}

export async function listarProcedimentos() {
  try {
    const response = await api.get('/procedimentos')
    return response.data.procedimentos
  } catch (erro) {
    throw traduzirErro(erro)
  }
}

export async function criarProcedimento(dados) {
  try {
    const response = await api.post('/procedimentos', dados)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Já existe um procedimento com esse nome.' })
  }
}