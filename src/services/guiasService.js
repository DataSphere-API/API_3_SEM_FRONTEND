import { api } from './http.js'
import { mockBuscarQrCode } from '../mocks/guiasMock.js'
import { mockListarGuiasDoBeneficiario } from '../mocks/checkMutuoMock.js'
import { erroDeFormato, traduzirErro } from '../utils/erros.js'
import { sessao } from '../stores/sessao.js'

const USAR_MOCK = (import.meta.env.VITE_FONTE_GUIAS || 'api') === 'mock'

function configuracaoConsulta() {
  if (import.meta.env.DEV && import.meta.env.VITE_AUTH_MOCK_GUIAS === 'true' && sessao.usuario?.cpf) {
    return { headers: { 'X-Mock-Login': sessao.usuario.cpf } }
  }
  return {}
}

function normalizarProcedimento(procedimento) {
  const dados = procedimento && typeof procedimento === 'object' ? procedimento : {}
  return {
    atendimentoId: dados.atendimentoId ?? dados.id ?? null,
    // #64 manda "nome"; o mock antigo mandava "descricao".
    descricao: dados.nome ?? dados.descricao ?? 'Procedimento',
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

export async function listarGuias(precCp) {
  try {
    const dados = USAR_MOCK
        ? await mockListarGuiasDoBeneficiario(precCp)
        : (await api.get(`/beneficiarios/${encodeURIComponent(precCp)}/guias`, configuracaoConsulta())).data
    return normalizarGuias(dados)
  } catch (erro) {
    throw traduzirErro(erro, {
      403: 'Você não tem permissão para consultar as guias deste beneficiário.',
      404: 'Nenhuma guia encontrada para este PrecCP.',
      padrao: 'Não foi possível carregar as guias.'
    })
  }
}

export async function buscarQrCode(atendimentoId) {
  try {
    const dados = USAR_MOCK
        ? await mockBuscarQrCode(atendimentoId)
        : (await api.get(`/atendimentos/${encodeURIComponent(atendimentoId)}/qrcode`, configuracaoConsulta())).data
    return normalizarQrCode(dados)
  } catch (erro) {
    throw traduzirErro(erro, {
      403: 'Somente o beneficiário dono da guia pode consultar este QR Code.',
      409: 'O QR Code ainda não está disponível para a baixa final deste procedimento.',
      404: 'QR Code não encontrado para este procedimento.',
      padrao: 'Não foi possível carregar o QR Code.'
    })
  }
}
