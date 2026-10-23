import { erroHttp, esperar } from './auxiliares.js'

const preGuiasMock = [
  {
    id: 1,
    numero: 'PG 2026/001',
    status: 'PRE_GUIA',
    beneficiario: 'Capitão Carlos Alberto',
    pendencias: [{ mensagem: 'Falta anexar o laudo médico atualizado.' }]
  },
  {
    id: 2,
    numero: 'PG 2026/002',
    status: 'COM_PENDENCIAS',
    beneficiario: 'Tenente Ana Paula',
    pendencias: [{ mensagem: 'CID diverge da especialidade.' }]
  },
  {
    id: 3,
    numero: 'PG 2026/003',
    status: 'VALIDADA',
    beneficiario: 'Subtenente Marcos',
    pendencias: []
  },
  {
    id: 4,
    numero: 'PG 2026/004',
    status: 'APROVADA',
    beneficiario: 'Sargento João Pedro',
    pendencias: []
  },
  {
    id: 5,
    numero: 'PG 2026/005',
    status: 'REPROVADA',
    beneficiario: 'Major Lucas Silveira',
    pendencias: [{ mensagem: 'Documentação inválida.' }],
    motivoReprovacao: 'Documentação inválida.'
  }
]

export async function mockListarPreGuias() {
  await esperar(300)
  return preGuiasMock
}

export async function mockBuscarPreGuia(id) {
  await esperar(300)
  const preGuia = preGuiasMock.find(p => p.id === Number(id))
  if (!preGuia) {
    throw erroHttp(404, { codigo: 'PRE_GUIA_NAO_ENCONTRADA', mensagem: 'Pré-guia não encontrada.' })
  }
  return preGuia
}

export async function mockValidarPreGuia(id) {
  await esperar(400)
  const preGuia = preGuiasMock.find(p => p.id === Number(id))
  if (!preGuia) {
    throw erroHttp(404, { codigo: 'PRE_GUIA_NAO_ENCONTRADA', mensagem: 'Pré-guia não encontrada.' })
  }
  preGuia.status = 'APROVADA'
  preGuia.pendencias = []
  return { sucesso: true, mensagem: 'Pré-guia validada com sucesso!' }
}

export async function mockAprovarPreGuia(id) {
  await esperar(400)
  const preGuia = preGuiasMock.find(p => p.id === Number(id))
  if (!preGuia) {
    throw erroHttp(404, { codigo: 'PRE_GUIA_NAO_ENCONTRADA', mensagem: 'Pré-guia não encontrada.' })
  }
  preGuia.status = 'APROVADA'
  return { sucesso: true, mensagem: 'Pré-guia aprovada com sucesso!' }
}

export async function mockReprovarPreGuia(id, motivo) {
  await esperar(400)
  if (!motivo || motivo.trim() === '') {
    throw erroHttp(422, { codigo: 'MOTIVO_OBRIGATORIO', mensagem: 'O motivo da reprovação é obrigatório.' })
  }
  const preGuia = preGuiasMock.find(p => p.id === Number(id))
  if (!preGuia) {
    throw erroHttp(404, { codigo: 'PRE_GUIA_NAO_ENCONTRADA', mensagem: 'Pré-guia não encontrada.' })
  }
  preGuia.status = 'REPROVADA'
  preGuia.motivoReprovacao = motivo
  return { sucesso: true, mensagem: 'Pré-guia reprovada.' }
}

export async function mockEmitirPreGuia(id) {
  await esperar(400)
  const preGuia = preGuiasMock.find(p => p.id === Number(id))
  if (!preGuia) {
    throw erroHttp(404, { codigo: 'PRE_GUIA_NAO_ENCONTRADA', mensagem: 'Pré-guia não encontrada.' })
  }
  preGuia.status = 'EMITIDA'
  return { sucesso: true, mensagem: 'Guia definitiva emitida com sucesso!' }
}