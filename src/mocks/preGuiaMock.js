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

function exigirPreGuiaAprovada(id) {
  const preGuia = preGuiasMock.find(p => p.id === Number(id))
  if (!preGuia) {
    throw erroHttp(404, { codigo: 'PRE_GUIA_NAO_ENCONTRADA', mensagem: 'Pré-guia não encontrada.' })
  }
  // Mesma regra do back: só APROVADA ou EMITIDA libera pacote e PDF.
  if (preGuia.status !== 'APROVADA' && preGuia.status !== 'EMITIDA') {
    throw erroHttp(409, {
      codigo: 'PRE_GUIA_NAO_APROVADA',
      mensagem: 'A pré-guia ainda não foi aprovada pelo médico e pelo chefe do FUSEx.'
    })
  }
  return preGuia
}

// GET /pre-guias/{id}/pacote-sire
export async function mockBaixarPacoteSire(id) {
  await esperar(300)
  const preGuia = exigirPreGuiaAprovada(id)
  const pacote = {
    versao: '1.0',
    preGuiaId: preGuia.id,
    status: preGuia.status,
    geradoEm: new Date().toISOString().slice(0, 19),
    beneficiario: { nome: preGuia.beneficiario },
    procedimentos: [],
    hash: 'a'.repeat(64) // hash fictício: só o back calcula o SHA-256 real
  }
  return new Blob([JSON.stringify(pacote, null, 2)], { type: 'application/json' })
}

// GET /pre-guias/{id}/documento-conferencia
export async function mockBaixarDocumentoConferencia(id) {
  await esperar(300)
  const preGuia = exigirPreGuiaAprovada(id)
  const texto = `DOCUMENTO DE CONFERENCIA (MOCK) - PRE-GUIA ${preGuia.id}`
  const conteudo = `BT /F1 12 Tf 50 790 Td (${texto}) Tj ET`
  const pdf =
    '%PDF-1.4\n' +
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' +
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ' +
    '/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n' +
    `4 0 obj\n<< /Length ${conteudo.length} >>\nstream\n${conteudo}\nendstream\nendobj\n` +
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n' +
    'trailer\n<< /Root 1 0 R >>\n%%EOF\n'
  return new Blob([pdf], { type: 'application/pdf' })
}