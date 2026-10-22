function esperar(milissegundos = 400) {
  return new Promise(resolve => setTimeout(resolve, milissegundos))
}

function erroHttp(status, dados) {
  const erro = new Error(`Request failed with status code ${status}`)
  erro.response = { status, data: dados }
  return erro
}

const guiasPorBeneficiario = {
  1001: [
    {
      id: 1,
      numero: 'GE 2026/004900',
      status: 'ATIVA',
      diasRestantes: 25,
      procedimentos: [
        { atendimentoId: 11, descricao: 'Fisioterapia', status: 'EM_ANDAMENTO', qtdRealizada: 3, qtdAutorizada: 10 },
        { atendimentoId: 12, descricao: 'Ressonância magnética', status: 'AUTORIZADO', qtdRealizada: 1, qtdAutorizada: 1 },
        { atendimentoId: 13, descricao: 'Hemograma completo', status: 'REALIZADO', qtdRealizada: 1, qtdAutorizada: 1 }
      ]
    },
    {
      id: 2,
      numero: 'GE 2026/004951',
      status: 'ATIVA',
      diasRestantes: 7,
      procedimentos: [
        { atendimentoId: 21, descricao: 'Ultrassom de abdome', status: 'AUTORIZADO', qtdRealizada: 0, qtdAutorizada: 1 }
      ]
    },
    {
      id: 3,
      numero: 'GE 2026/003990',
      status: 'EXPIRADA',
      diasRestantes: -5,
      procedimentos: [
        { atendimentoId: 31, descricao: 'Tomografia de tórax', status: 'EXPIRADO', qtdRealizada: 0, qtdAutorizada: 1 }
      ]
    }
  ],
  1002: []
}

export async function mockListarGuias(precCp) {
  await esperar()
  const guias = guiasPorBeneficiario[String(precCp)]
  if (!guias) {
    throw erroHttp(404, { codigo: 'BENEFICIARIO_NAO_ENCONTRADO', mensagem: 'Beneficiário não encontrado.' })
  }
  return guias
}

export async function mockBuscarQrCode(atendimentoId) {
  await esperar(300)
  if (String(atendimentoId) === '999') {
    throw erroHttp(404, { codigo: 'QR_NAO_ENCONTRADO', mensagem: 'QR Code não encontrado.' })
  }
  return { codigo: `FUSEX-QR-${atendimentoId}` }
}