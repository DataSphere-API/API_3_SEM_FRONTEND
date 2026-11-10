import { api } from './http.js'
import {
  mockListarPreGuias,
  mockBuscarPreGuia,
  mockValidarPreGuia,
  mockAprovarPreGuia,
  mockReprovarPreGuia,
  mockEmitirPreGuia
  mockBaixarPacoteSire,
  mockBaixarDocumentoConferencia
} from '../mocks/preGuiaMock.js'
import { traduzirErro } from '../utils/erros.js'

const USAR_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export async function listarPreGuias() {
  try {
    if (USAR_MOCK) return await mockListarPreGuias()
    const response = await api.get('/pre-guias')
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'Nenhuma pré-guia encontrada.' })
  }
}

export async function buscarPreGuia(id) {
  try {
    if (USAR_MOCK) return await mockBuscarPreGuia(id)
    const response = await api.get(`/pre-guias/${id}`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'Pré-guia não encontrada.' })
  }
}

export async function validarPreGuia(id) {
  try {
    if (USAR_MOCK) return await mockValidarPreGuia(id)
    const response = await api.post(`/pre-guias/${id}/validar`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 422: 'Não foi possível validar a pré-guia.' })
  }
}

export async function aprovarPreGuia(id) {
  try {
    if (USAR_MOCK) return await mockAprovarPreGuia(id)
    const response = await api.patch(`/pre-guias/${id}/aprovar`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 422: 'Não foi possível aprovar a pré-guia.' })
  }
}

export async function reprovarPreGuia(id, motivo) {
  try {
    if (USAR_MOCK) return await mockReprovarPreGuia(id, motivo)
    const response = await api.patch(`/pre-guias/${id}/reprovar`, { motivo })
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 422: 'O motivo da reprovação é obrigatório.' })
  }
}

export async function emitirPreGuia(id) {
  try {
    if (USAR_MOCK) return await mockEmitirPreGuia(id)
    const response = await api.post(`/pre-guias/${id}/emitir`)
    return response.data
  } catch (erro) {
    throw traduzirErro(erro, { 422: 'Não foi possível emitir a guia.' })
  }
}

// Com responseType 'blob', o corpo do erro também chega como Blob.
// Converte de volta para JSON para o traduzirErro ler a "mensagem" do back.
async function lerErroDeBlob(erro) {
  const dados = erro?.response?.data
  if (dados instanceof Blob) {
    try {
      erro.response.data = JSON.parse(await dados.text())
    } catch {
      erro.response.data = null
    }
  }
  return erro
}

const ERRO_DOWNLOAD = {
  404: 'Pré-guia não encontrada.',
  409: 'Só pré-guia aprovada ou emitida libera o pacote e o PDF.',
  padrao: 'Não foi possível baixar o arquivo.'
}

// GET /pre-guias/{id}/pacote-sire (versão 1.0 com hash SHA-256). Devolve um Blob.
export async function baixarPacoteSire(id) {
  try {
    if (USAR_MOCK) return await mockBaixarPacoteSire(id)
    const response = await api.get(`/pre-guias/${id}/pacote-sire`, { responseType: 'blob' })
    return response.data
  } catch (erro) {
    throw traduzirErro(await lerErroDeBlob(erro), ERRO_DOWNLOAD)
  }
}

// GET /pre-guias/{id}/documento-conferencia (PDF). Devolve um Blob.
export async function baixarDocumentoConferencia(id) {
  try {
    if (USAR_MOCK) return await mockBaixarDocumentoConferencia(id)
    const response = await api.get(`/pre-guias/${id}/documento-conferencia`, { responseType: 'blob' })
    return response.data
  } catch (erro) {
    throw traduzirErro(await lerErroDeBlob(erro), ERRO_DOWNLOAD)
  }
}