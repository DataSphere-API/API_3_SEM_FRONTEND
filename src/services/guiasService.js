import axios from 'axios'
import { mockBuscarQrCode, mockListarGuias } from '../mocks/guiasMock.js'
import { erroDeFormato, traduzirErro } from '../utils/erros.js'

const USAR_MOCK = (import.meta.env.VITE_FONTE_GUIAS || 'mock') === 'mock'

function normalizarProcedimento(procedimento) {
  const dados = procedimento && typeof procedimento === 'object' ? procedimento : {}
  return {
    atendimentoId: dados.atendimentoId ?? dados.id ?? null,
    descricao: dados.descricao ?? 'Procedimento',
    status: dados.status ?? '',
    qtdRealizada: dados.qtdRealizada,
    qtdAutorizada: dados.qtdAutorizada
  }
}

export function normalizarGuias(dados) {
  if (!Array.isArray(dados)) {
    throw erroDeFormato()
  }
  return dados.map(guia => {
    const dadosGuia = guia && typeof guia === 'object' ? guia : {}
    return {
      id: dadosGuia.id ?? null,
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

export async function listarGuias(precCp) {
  try {
    const dados = USAR_MOCK
      ? await mockListarGuias(precCp)
      : (await axios.get(`http://localhost:8080/beneficiarios/${encodeURIComponent(precCp)}/guias`)).data
    return normalizarGuias(dados)
  } catch (erro) {
    throw traduzirErro(erro, {
      404: 'Nenhuma guia encontrada para este PrecCP.',
      padrao: 'Não foi possível carregar as guias.'
    })
  }
}

export async function buscarQrCode(atendimentoId) {
  try {
    const dados = USAR_MOCK
      ? await mockBuscarQrCode(atendimentoId)
      : (await axios.get(`http://localhost:8080/atendimentos/${atendimentoId}/qrcode`)).data
    return normalizarQrCode(dados)
  } catch (erro) {
    throw traduzirErro(erro, {
      404: 'QR Code não encontrado para este procedimento.',
      padrao: 'Não foi possível carregar o QR Code.'
    })
  }
}