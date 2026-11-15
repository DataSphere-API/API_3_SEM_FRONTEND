import { api } from './http.js'
import { mockListarGuiasDoBeneficiario } from '../mocks/checkMutuoMock.js'
import { erroDeFormato, traduzirErro } from '../utils/erros.js'
import { sessao } from '../stores/sessao.js'

const USAR_MOCK_GUIAS = import.meta.env.VITE_USE_MOCK === 'true'

function normalizarProcedimento(procedimento) {
  const dados = procedimento && typeof procedimento === 'object' ? procedimento : {}
  return {
    atendimentoId: dados.atendimentoId ?? dados.id ?? null,
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
