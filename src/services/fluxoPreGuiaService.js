import { jsPDF } from "jspdf"

const USAR_MOCK = true
const API_URL = "http://localhost:8080/api"

export async function listarPreGuiasDoFluxo() {
  if (USAR_MOCK) {
    return [
      { id: 1, beneficiarioNome: "Fulano de Tal", beneficiarioPrecCp: "100100100-00", status: "PRE_GUIA", valorTotal: 720.49, qtdProcedimentos: 1, dataCriacao: "2026-10-06" },
      { id: 2, beneficiarioNome: "João Pedro Lima", beneficiarioPrecCp: "100100100-01", status: "COM_PENDENCIAS", valorTotal: 0.00, qtdProcedimentos: 1, dataCriacao: "2026-10-07" },
      { id: 5, beneficiarioNome: "Maria Clara Souza", beneficiarioPrecCp: "100100100-05", status: "APROVADA", valorTotal: 450.00, qtdProcedimentos: 1, dataCriacao: "2026-10-10" },
      { id: 6, beneficiarioNome: "Fulano de Tal", beneficiarioPrecCp: "100100100-00", status: "EMITIDA", valorTotal: 990.49, qtdProcedimentos: 2, dataCriacao: "2026-10-11", dataEmissao: "2026-10-16" }
    ]
  }
  const response = await fetch(API_URL + "/pre-guias")
  if (!response.ok) throw new Error("Erro ao listar pré-guias")
  return response.json()
}

export async function buscarPreGuiaDoFluxo(id) {
  if (USAR_MOCK) {
    const numId = Number(id)
    const statusAtual = numId === 2 ? "COM_PENDENCIAS" : (numId === 5 ? "APROVADA" : (numId === 1 ? "PRE_GUIA" : "EMITIDA"))

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
      id: numId,
      numero: "PG 00" + numId,
      beneficiarioNome: numId === 5 ? "Maria Clara Souza" : "Fulano de Tal",
      beneficiarioPrecCp: numId === 5 ? "100100100-05" : "100100100-00",
      beneficiario: { id: numId, nome: numId === 5 ? "Maria Clara Souza" : "Fulano de Tal", precCp: "100100100-00" },
      status: statusAtual,
      valorTotal: numId === 5 ? 450.00 : 990.49,
      dataCriacao: "2026-10-11",
      dataEmissao: numId === 6 ? "2026-10-16" : null,
      medicoResponsavel: { id: 1, nome: "Rafael Duarte", crm: "123456" },
      medico: { id: 1, nome: "Rafael Duarte", crm: "123456" },
      especialidade: { id: 1, nome: "Ortopedia" },
      ocs: { id: 1, nome: "Clínica Imagem Centro" },
      medicoAprovou: true,
      chefeAprovou: true,
      validacao: {
        validada: numId !== 2,
        pendencias: numId === 2 ? [{ mensagem: "Procedimento sem contrato ativo com a OCS." }] : []
      },
      pendencias: numId === 2 ? [{ mensagem: "Procedimento sem contrato ativo com a OCS." }] : [],
      procedimentos: listaProcedimentos,
      itens: listaProcedimentos
    }
  }
  const response = await fetch(API_URL + "/pre-guias/" + id)
  if (!response.ok) throw new Error("Erro ao buscar pré-guia")
  return response.json()
}

export async function enviarParaAprovacao(id) {
  if (USAR_MOCK) {
    return { validada: true, pendencias: [] }
  }
  const response = await fetch(API_URL + "/pre-guias/" + id + "/enviar", { method: "POST" })
  if (!response.ok) throw new Error("Erro ao enviar pré-guia")
  return response.json()
}

export async function validarPreGuia(id) {
  if (USAR_MOCK) {
    return { validada: true, pendencias: [] }
  }
  const response = await fetch(API_URL + "/pre-guias/" + id + "/validar", { method: "POST" })
  if (!response.ok) throw new Error("Erro ao validar pré-guia")
  return response.json()
}

export async function obterPacoteSire(id) {
  if (USAR_MOCK) {
    return { id, sistema: "SIRE", status: "EMITIDA", versao: "1.0" }
  }
  const response = await fetch(API_URL + "/pre-guias/" + id + "/pacote-sire")
  if (!response.ok) throw new Error("Erro ao obter pacote SIRE")
  return response.json()
}

export async function obterDocumentoConferencia(id) {
  if (USAR_MOCK) {
    const dados = await buscarPreGuiaDoFluxo(id)
    const doc = new jsPDF()

    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.text("SISTEMA FUSEX - DOCUMENTO DE CONFERENCIA", 20, 20)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(11)
    doc.text("Pre-Guia: PG 00" + dados.id, 20, 35)
    doc.text("Status: " + dados.status, 20, 45)
    doc.text("Data de Criacao: " + dados.dataCriacao, 20, 55)

    doc.setFont("helvetica", "bold")
    doc.text("--- BENEFICIARIO ---", 20, 70)
    doc.setFont("helvetica", "normal")
    doc.text("Nome: " + dados.beneficiarioNome, 20, 80)
    doc.text("Prec-CP: " + dados.beneficiarioPrecCp, 20, 90)

    doc.setFont("helvetica", "bold")
    doc.text("--- RESPONSAVEL ---", 20, 105)
    doc.setFont("helvetica", "normal")
    doc.text("Medico: " + dados.medico.nome + " (CRM: " + dados.medico.crm + ")", 20, 115)

    doc.setFont("helvetica", "bold")
    doc.text("--- VALOR TOTAL ---", 20, 130)
    doc.setFont("helvetica", "normal")
    doc.text("R$ " + Number(dados.valorTotal).toFixed(2), 20, 140)

    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text("Documento gerado automaticamente para conferencia.", 20, 170)

    return doc.output("blob")
  }
  const response = await fetch(API_URL + "/pre-guias/" + id + "/documento-conferencia")
  if (!response.ok) throw new Error("Erro ao baixar documento PDF")
  return response.blob()
}

export async function emitirGuia(id) {
  if (USAR_MOCK) {
    return { id, dataEmissao: "2026-10-16", validoAte: "2026-12-15" }
  }
  const response = await fetch(API_URL + "/pre-guias/" + id + "/emitir", { method: "POST" })
  if (!response.ok) throw new Error("Erro ao emitir guia")
  return response.json()
}

export async function criarPreGuia(dados) {
  if (USAR_MOCK) {
    return { id: 99, ...dados }
  }
  const response = await fetch(API_URL + "/pre-guias", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados)
  })
  if (!response.ok) throw new Error("Erro ao criar pré-guia")
  return response.json()
}

export async function editarPreGuia(id, dados) {
  if (USAR_MOCK) {
    return { id: Number(id), ...dados }
  }
  const response = await fetch(API_URL + "/pre-guias/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados)
  })
  if (!response.ok) throw new Error("Erro ao editar pré-guia")
  return response.json()
}

export async function aprovarPreGuia(id) {
  if (USAR_MOCK) {
    return { id: Number(id), status: "APROVADA" }
  }
  const response = await fetch(API_URL + "/pre-guias/" + id + "/aprovar", { method: "POST" })
  if (!response.ok) throw new Error("Erro ao aprovar pré-guia")
  return response.json()
}

export async function reprovarPreGuia(id, motivo) {
  if (USAR_MOCK) {
    return { id: Number(id), status: "REPROVADA", motivo }
  }
  const response = await fetch(API_URL + "/pre-guias/" + id + "/reprovar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ motivo })
  })
  if (!response.ok) throw new Error("Erro ao reprovar pré-guia")
  return response.json()
}