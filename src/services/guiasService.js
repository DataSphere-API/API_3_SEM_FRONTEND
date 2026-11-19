import { api } from './http.js'
import { erroDeFormato, traduzirErro } from '../utils/erros.js'

function normalizarProcedimento(procedimento) {
  const dados = procedimento && typeof procedimento === 'object' ? procedimento : {}
  return {
    atendimentoId: dados.atendimentoId ?? dados.id ?? null,
    // O back manda "procedimento" ou "nome".
    descricao: dados.procedimento ?? dados.nome ?? dados.descricao ?? 'Procedimento',
    status: dados.status ?? '',
    temQr: dados.temQr,
    statusPainel: dados.statusPainel ?? dados.status ?? '',
    qtdRealizada: dados.sessoesFeitas ?? dados.qtdRealizada,
    qtdAutorizada: dados.sessoesAutorizadas ?? dados.qtdAutorizada
  }
}

export function normalizarGuias(dados) {
  if (!Array.isArray(dados)) {
    throw erroDeFormato()
  }
  return dados.map(guia => {
    const dadosGuia = guia && typeof guia === 'object' ? guia : {}
    return {
      id: dadosGuia.guiaId ?? dadosGuia.id ?? null,
      numero: dadosGuia.numero ?? null,
      status: dadosGuia.status ?? '',
      diasRestantes: dadosGuia.diasRestantes,
      procedimentos: Array.isArray(dadosGuia.procedimentos)
          ? dadosGuia.procedimentos.map(normalizarProcedimento)
          : []
    }
  })
}

export function normalizarQrCode(dados) {
  const codigo = typeof dados === 'string' ? dados : dados?.codigo
  if (typeof codigo !== 'string' || codigo.trim() === '') {
    throw erroDeFormato()
  }
  return { codigo: codigo.trim() }
}

export async function listarGuiasDoBeneficiario(precCp) {
  try {
    const { data } = await api.get(`/beneficiarios/${encodeURIComponent(precCp)}/guias`)
    return normalizarGuias(data)
  } catch (erro) {
    throw traduzirErro(erro, { 403: 'Você não tem acesso a essas guias.' })
  }
}

export async function listarPreGuiasDoBeneficiario(precCp) {
  try {
    const { data } = await api.get(`/beneficiarios/${encodeURIComponent(precCp)}/pre-guias`)
    if (!Array.isArray(data)) throw erroDeFormato()

    return data
  } catch (erro) {
    throw traduzirErro(erro, { 403: 'Você não tem acesso a essas solicitações.' })
  }
}

export async function buscarQrCode(atendimentoId) {
  try {
    const { data } = await api.get(`/atendimentos/${encodeURIComponent(atendimentoId)}/qrcode`)
    return normalizarQrCode(data)
  } catch (erro) {
    throw traduzirErro(erro, { 404: 'QR Code não encontrado para este procedimento.' })
  }
}
