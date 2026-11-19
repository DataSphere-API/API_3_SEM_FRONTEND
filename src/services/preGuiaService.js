const USAR_MOCK = true

export async function listarPreGuiasDoFluxo() {
  if (USAR_MOCK) {
    return [
      { id: 1, beneficiarioNome: "Fulano de Tal", beneficiarioPrecCp: "100100100-00", status: "PRE_GUIA", valorTotal: 720.49, qtdProcedimentos: 1, dataCriacao: "2026-10-06" },
      { id: 2, beneficiarioNome: "João Pedro Lima", beneficiarioPrecCp: "100100100-01", status: "COM_PENDENCIAS", valorTotal: 0.00, qtdProcedimentos: 1, dataCriacao: "2026-10-07" },
      { id: 6, beneficiarioNome: "Fulano de Tal", beneficiarioPrecCp: "100100100-00", status: "EMITIDA", valorTotal: 990.49, qtdProcedimentos: 2, dataCriacao: "2026-10-11", dataEmissao: "2026-10-16" }
    ]
  }
}

export async function buscarPreGuiaDoFluxo(id) {
  if (USAR_MOCK) {
    const listaProcedimentos = [
      {
        id: 1,
        procedimentoNome: "Raio-X",
        nome: "Raio-X",
        procedimento: { id: 1, nome: "Raio-X", codigo: "10101012" },
        ocsNome: "Clínica Imagem Centro",
        ocs: { id: 1, nome: "Clínica Imagem Centro" },
        especialidade: { id: 1, nome: "Radiologia" },
        quantidade: 1,
        valorUnitario: 90.00,
        valor: 90.00,
        valorTotal: 90.00
      }
    ]

    return {
      id: Number(id),
      numero: `PG 00${id}`,
      beneficiarioNome: "Fulano de Tal",
      beneficiarioPrecCp: "100100100-00",
      beneficiario: { id: 1, nome: "Fulano de Tal", precCp: "100100100-00" },
      status: Number(id) === 2 ? "COM_PENDENCIAS" : (Number(id) === 1 ? "PRE_GUIA" : "EMITIDA"),
      valorTotal: 990.49,
      dataCriacao: "2026-10-11",
      dataEmissao: "2026-10-16",
      medicoResponsavel: { id: 1, nome: "Rafael Duarte", crm: "123456" },
      medico: { id: 1, nome: "Rafael Duarte", crm: "123456" },
      especialidade: { id: 1, nome: "Ortopedia" },
      ocs: { id: 1, nome: "Clínica Imagem Centro" },
      medicoAprovou: true,
      chefeAprovou: true,
      validacao: {
        validada: Number(id) !== 2,
        pendencias: Number(id) === 2 ? [{ mensagem: "Procedimento sem contrato ativo com a OCS." }] : []
      },
      pendencias: Number(id) === 2 ? [{ mensagem: "Procedimento sem contrato ativo com a OCS." }] : [],
      procedimentos: listaProcedimentos,
      itens: listaProcedimentos
    }
  }
}

export async function enviarParaAprovacao(id) {
  if (USAR_MOCK) {
    return { validada: true, pendencias: [] }
  }
}

export async function validarPreGuia(id) {
  if (USAR_MOCK) {
    return { validada: true, pendencias: [] }
  }
}

export async function obterPacoteSire(id) {
  if (USAR_MOCK) {
    return { id, sistema: "SIRE", status: "EMITIDA", versao: "1.0" }
  }
}

export async function obterDocumentoConferencia(id) {
  if (USAR_MOCK) {
    const dadosPreGuia = await buscarPreGuiaDoFluxo(id)
    const textoPdf = `
========================================
SISTEMA FUSEX - DOCUMENTO DE CONFERÊNCIA
========================================

Pré-Guia: PG 00${dadosPreGuia.id}
Status: ${dadosPreGuia.status}
Data de Criação: ${dadosPreGuia.dataCriacao}

--- BENEFICIÁRIO ---
Nome: ${dadosPreGuia.beneficiarioNome}
Prec-CP: ${dadosPreGuia.beneficiarioPrecCp}

--- RESPONSÁVEL ---
Médico: ${dadosPreGuia.medico.nome} (CRM: ${dadosPreGuia.medico.crm})

--- PROCEDIMENTOS ---
${dadosPreGuia.procedimentos.map(p => `- ${p.procedimentoNome || p.nome} | Qtd: ${p.quantidade} | Valor: R$ ${p.valorTotal}`).join('\n')}

Valor Total: R$ ${dadosPreGuia.valorTotal}

========================================
Documento gerado automaticamente pelo sistema.
    `.trim()

    return new Blob([textoPdf], { type: 'application/pdf' })
  }
}

export async function emitirGuia(id) {
  if (USAR_MOCK) {
    return { id, dataEmissao: "2026-10-16", validoAte: "2026-12-15" }
  }
}

export async function criarPreGuia(dados) {
  if (USAR_MOCK) {
    return { id: 99, ...dados }
  }
}

export async function editarPreGuia(id, dados) {
  if (USAR_MOCK) {
    return { id: Number(id), ...dados }
  }
}

export async function aprovarPreGuia(id) {
  if (USAR_MOCK) {
    return { id: Number(id), status: "APROVADA" }
  }
}

export async function reprovarPreGuia(id, motivo) {
  if (USAR_MOCK) {
    return { id: Number(id), status: "REPROVADA", motivo }
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