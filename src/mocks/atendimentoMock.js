import { erroHttp, esperar } from './auxiliares.js'

const atendimentosMock = {
  "FUSEX-QR-11": {
    atendimentoId: 11,
    guiaId: 104,
    beneficiario: {
      precCp: "108923",
      nome: "Capitão Carlos Alberto de Souza"
    },
    procedimento: "Fisioterapia Motora",
    ocs: {
      cnpj: "12345678000199",
      nome: "Clínica de Reabilitação São Lucas"
    },
    qtdAutorizada: 10,
    qtdRealizada: 3,
    prontoParaBaixa: false,
    dataValidade: "2026-12-31",
    status: "EM_ANDAMENTO"
  },

  "FUSEX-QR-99": {
    atendimentoId: 99,
    guiaId: 105,
    beneficiario: {
      precCp: "102234",
      nome: "Tenente Ana Paula Ribeiro"
    },
    procedimento: "Ressonância Magnética",
    ocs: {
      cnpj: "12345678000199",
      nome: "Clínica de Reabilitação São Lucas"
    },
    qtdAutorizada: 1,
    qtdRealizada: 1,
    prontoParaBaixa: true,
    dataValidade: "2026-12-31",
    status: "REALIZADO"
  },

  "FUSEX-QR-88": {
    atendimentoId: 88,
    guiaId: 106,
    beneficiario: {
      precCp: "103345",
      nome: "Subtenente Marcos Vinicius"
    },
    procedimento: "Tomografia Computadorizada",
    ocs: {
      cnpj: "12345678000199",
      nome: "Clínica de Reabilitação São Lucas"
    },
    qtdAutorizada: 1,
    qtdRealizada: 0,
    prontoParaBaixa: false,
    dataValidade: "2023-01-15",
    status: "EXPIRADO"
  }
}

export async function mockConsultarQr(codigo, cnpj) {
  await esperar(300)
  const codigoLimpo = codigo ? codigo.trim() : ''
  const atendimento = atendimentosMock[codigoLimpo]

  if (!atendimento) {
    throw { codigo: 'QR_NAO_ENCONTRADO', status: 404, mensagemUsuario: 'QR Code inválido ou não encontrado.' }
  }

  if (atendimento.status === 'REALIZADO') {
    throw { codigo: 'QR_JA_UTILIZADO', status: 422, mensagemUsuario: 'Este QR Code já foi utilizado.' }
  }

  if (atendimento.dataValidade) {
    const hoje = new Date().toISOString().split('T')[0]
    if (atendimento.dataValidade < hoje) {
      throw { codigo: 'GUIA_VENCIDA', status: 422, mensagemUsuario: 'Guia vencida. Atendimento não permitido.' }
    }
  }

  const cnpjLimpo = cnpj ? cnpj.replace(/\D/g, '') : ''
  if (cnpjLimpo !== atendimento.ocs.cnpj) {
    throw { codigo: 'OCS_DIFERENTE', status: 422, mensagemUsuario: 'OCS diferente da autorizada no contrato.' }
  }

  return atendimento
}

export async function mockRegistrarSessao(atendimentoId) {
  await esperar(300)
  const atendimento = Object.values(atendimentosMock).find(a => a.atendimentoId === Number(atendimentoId))

  if (atendimento) {
    return { sucesso: true, mensagem: 'Sessão registrada com sucesso!' }
  }

  throw { codigo: 'ATENDIMENTO_NAO_ENCONTRADO', status: 404, mensagemUsuario: 'Atendimento não encontrado.' }
}

export async function mockValidarBaixaQr(atendimentoId) {
  await esperar(300)
  const atendimento = Object.values(atendimentosMock).find(a => a.atendimentoId === Number(atendimentoId))

  if (!atendimento || atendimento.qtdRealizada < atendimento.qtdAutorizada) {
    const realizada = atendimento ? atendimento.qtdRealizada : 0
    const autorizada = atendimento ? atendimento.qtdAutorizada : 0
    throw {
      codigo: 'SESSOES_INCOMPLETAS',
      status: 422,
      mensagemUsuario: `Sessões incompletas para realizar a baixa. Saldo atual: ${realizada}/${autorizada}.`
    }
  }

  atendimento.status = 'REALIZADO'
  return { sucesso: true }
}