import { api } from './api.js'
import { traduzirErro } from '../utils/erros.js'

export async function listarPreGuiasDoFluxo({ status, minhas } = {}) {
  try {
    const params = {}
    if (status) params.status = status
    if (minhas) params.minhas = true
    const { data } = await api.get('/pre-guias', { params })
    return data
  } catch (erro) {
    throw traduzirErro(erro, { padrao: 'Não foi possível carregar as pré-guias.' })
  }
}

export async function buscarPreGuiaDoFluxo(id) {
  try {
    const { data } = await api.get(`/pre-guias/${id}`)
    return data
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'Pré-guia não encontrada.' })
  }
}

export async function criarPreGuia(dados) {
  try {
    const { data } = await api.post('/pre-guias', dados)
    return data
  } catch (erro) {
    throw traduzirErro(erro, { padrao: 'Não foi possível salvar a pré-guia.' })
  }
}

export async function editarPreGuia(id, dados) {
  try {
    const { data } = await api.put(`/pre-guias/${id}`, dados)
    return data
  } catch (erro) {
    throw traduzirErro(erro, { padrao: 'Não foi possível salvar a pré-guia.' })
  }
}

export async function validarPreGuia(id) {
  try {
    const { data } = await api.post(`/pre-guias/${id}/validar`)
    return data
  } catch (erro) {
    throw traduzirErro(erro, { 409: 'Esta pré-guia já foi enviada para aprovação.' })
  }
}

export async function enviarParaAprovacao(id) {
  return validarPreGuia(id)
}

export async function aprovarPreGuia(id) {
  try {
    const { data } = await api.patch(`/pre-guias/${id}/aprovar`)
    return data
  } catch (erro) {
    throw traduzirErro(erro, { padrao: 'Não foi possível aprovar.' })
  }
}

export async function reprovarPreGuia(id, motivo) {
  try {
    const { data } = await api.patch(`/pre-guias/${id}/reprovar`, { motivo })
    return data
  } catch (erro) {
    throw traduzirErro(erro, { padrao: 'Não foi possível reprovar.' })
  }
}

export async function emitirGuia(id) {
  try {
    const { data } = await api.post(`/pre-guias/${id}/emitir`)
    return data
  } catch (erro) {
    throw traduzirErro(erro, { padrao: 'Não foi possível emitir a guia.' })
  }
}


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

export async function baixarPacoteSire(id) {
  try {
    const { data } = await api.get(`/pre-guias/${id}/pacote-sire`, { responseType: 'blob' })
    return data
  } catch (erro) {
    throw traduzirErro(await lerErroDeBlob(erro), ERRO_DOWNLOAD)
  }
}

export async function baixarDocumentoConferencia(id) {
  try {
    const { data } = await api.get(`/pre-guias/${id}/documento-conferencia`, { responseType: 'blob' })
    return data
  } catch (erro) {
    throw traduzirErro(await lerErroDeBlob(erro), ERRO_DOWNLOAD)
  }
}
