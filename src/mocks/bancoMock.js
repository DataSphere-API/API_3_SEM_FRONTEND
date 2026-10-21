// Banco em memória dos mocks, no formato das tabelas e issues do back.
// Fica salvo no localStorage para o fluxo continuar entre abas e logins de perfis diferentes.
const CHAVE = 'fusex-banco-mock-v3'
const SENHA_PADRAO = 'fusex123'

const IMAGEM_CENTRO = '12345678000199'
const LAB_VIDA = '23456789000188'
const MOVIMENTO = '34567890000177'

function preGuia(id, dados) {
  return {
    id,
    status: 'PRE_GUIA',
    medicoId: 2,
    dataCriacao: `2026-10-${String(5 + id).padStart(2, '0')}`,
    pendencias: [],
    dataAprovacaoMedico: null,
    dataAprovacaoChefe: null,
    chefeId: null,
    motivoReprovacao: null,
    dataEmissao: null,
    ...dados
  }
}

function semente() {
  return {
    ocs: [
      { cnpj: IMAGEM_CENTRO, nome: 'Clínica Imagem Centro' },
      { cnpj: LAB_VIDA, nome: 'Laboratório Vida' },
      { cnpj: MOVIMENTO, nome: 'Clínica Movimento' }
    ],
    procedimentos: [
      { id: 1, nome: 'TC Abdome Superior' },
      { id: 2, nome: 'Hemograma completo' },
      { id: 3, nome: 'Ultrassom · abdome total' },
      { id: 4, nome: 'Sessão de psicoterapia' },
      { id: 5, nome: 'Raio-X · joelho' },
      { id: 6, nome: 'Eletroneuromiografia' }
    ],
    contratos: [
      { id: 1, procedimentoId: 1, ocsCnpj: IMAGEM_CENTRO, valor: 720.49 },
      { id: 2, procedimentoId: 3, ocsCnpj: IMAGEM_CENTRO, valor: 280.0 },
      { id: 3, procedimentoId: 5, ocsCnpj: IMAGEM_CENTRO, valor: 90.0 },
      { id: 4, procedimentoId: 2, ocsCnpj: LAB_VIDA, valor: 40.0 },
      { id: 5, procedimentoId: 4, ocsCnpj: MOVIMENTO, valor: 150.0 },
      { id: 6, procedimentoId: 6, ocsCnpj: MOVIMENTO, valor: 410.0 }
    ],
    // Tabela Beneficiario: o autocadastro só aceita quem está aqui.
    beneficiarios: [
      { precCp: '1001', nome: 'Fulano de Tal', dataNascimento: '1986-03-10', dependente: false, ug: '3º BD' },
      { precCp: '123456', nome: 'Ana Paula Souza', dataNascimento: '1990-07-21', dependente: false, ug: '3º BD' },
      { precCp: '7007', nome: 'João Pedro Lima', dataNascimento: '2001-01-15', dependente: true, ug: '3º BD' },
      { precCp: '2002', nome: 'Rafael Duarte', dataNascimento: '1980-05-02', dependente: false, ug: '3º BD' },
      { precCp: '3003', nome: 'Carlos Albuquerque', dataNascimento: '1975-11-30', dependente: false, ug: '3º BD' },
      { precCp: '4004', nome: 'Luiz Fernandes', dataNascimento: '1992-09-14', dependente: false, ug: '3º BD' },
      { precCp: '5005', nome: 'Marina Costa', dataNascimento: '1988-02-25', dependente: false, ug: '3º BD' },
      { precCp: '6006', nome: 'Beatriz Nogueira', dataNascimento: '1995-12-01', dependente: false, ug: '3º BD' }
    ],
    // Usuario (Login = CPF) + o perfil que sai de Chefe_Fusex/Medico/Analista/Auditor/FunOcs/Beneficiario.
    // Militar da equipe é ligado ao Usuario pelo Beneficiario, então também é BENEFICIARIO.
    usuarios: [
      { id: 1, cpf: '52601815906', senha: SENHA_PADRAO, perfis: ['CHEFE', 'BENEFICIARIO'], precCp: '3003', crm: '', ocsCnpj: '', cargo: '' },
      { id: 2, cpf: '08301661305', senha: SENHA_PADRAO, perfis: ['MEDICO', 'BENEFICIARIO'], precCp: '2002', crm: '123456', ocsCnpj: '', cargo: '' },
      { id: 3, cpf: '18609139034', senha: SENHA_PADRAO, perfis: ['EMISSOR', 'BENEFICIARIO'], precCp: '4004', crm: '', ocsCnpj: '', cargo: '' },
      { id: 4, cpf: '99603082430', senha: SENHA_PADRAO, perfis: ['AUDITOR', 'BENEFICIARIO'], precCp: '5005', crm: '', ocsCnpj: '', cargo: '' },
      { id: 5, cpf: '62819482112', senha: SENHA_PADRAO, perfis: ['OCS'], precCp: '', crm: '', ocsCnpj: IMAGEM_CENTRO, cargo: 'Recepção' },
      { id: 6, cpf: '99351819019', senha: SENHA_PADRAO, perfis: ['BENEFICIARIO'], precCp: '1001', crm: '', ocsCnpj: '', cargo: '' }
    ],
    // Guia com status de pré-guia (US005/US006). Cada procedimento é um Guia_Proc (atendimentoId).
    preGuias: [
      preGuia(1, {
        beneficiarioPrecCp: '1001',
        procedimentos: [{ atendimentoId: 101, procedimentoId: 1, ocsCnpj: IMAGEM_CENTRO, quantidade: 1 }]
      }),
      preGuia(2, {
        status: 'COM_PENDENCIAS',
        beneficiarioPrecCp: '7007',
        procedimentos: [{ atendimentoId: 102, procedimentoId: 6, ocsCnpj: IMAGEM_CENTRO, quantidade: 1 }],
        pendencias: [{
          codigo: 'PROCEDIMENTO_SEM_CONTRATO',
          atendimentoId: 102,
          mensagem: 'Eletroneuromiografia não possui contrato com a OCS Clínica Imagem Centro'
        }]
      }),
      preGuia(3, {
        status: 'VALIDADA',
        beneficiarioPrecCp: '123456',
        procedimentos: [{ atendimentoId: 103, procedimentoId: 3, ocsCnpj: IMAGEM_CENTRO, quantidade: 1 }]
      }),
      preGuia(4, {
        status: 'VALIDADA',
        beneficiarioPrecCp: '7007',
        procedimentos: [{ atendimentoId: 104, procedimentoId: 4, ocsCnpj: MOVIMENTO, quantidade: 10 }],
        dataAprovacaoMedico: '2026-10-09T10:00:00'
      }),
      preGuia(5, {
        status: 'APROVADA',
        beneficiarioPrecCp: '1001',
        procedimentos: [{ atendimentoId: 105, procedimentoId: 2, ocsCnpj: LAB_VIDA, quantidade: 1 }],
        dataAprovacaoMedico: '2026-10-10T09:00:00',
        dataAprovacaoChefe: '2026-10-10T11:00:00',
        chefeId: 1
      }),
      preGuia(6, {
        status: 'EMITIDA',
        beneficiarioPrecCp: '1001',
        procedimentos: [
          { atendimentoId: 501, procedimentoId: 5, ocsCnpj: IMAGEM_CENTRO, quantidade: 3 },
          { atendimentoId: 502, procedimentoId: 1, ocsCnpj: IMAGEM_CENTRO, quantidade: 1 }
        ],
        dataAprovacaoMedico: '2026-10-12T09:00:00',
        dataAprovacaoChefe: '2026-10-12T10:00:00',
        chefeId: 1,
        dataEmissao: '2026-10-16'
      }),
      preGuia(7, {
        status: 'EMITIDA',
        beneficiarioPrecCp: '1001',
        procedimentos: [{ atendimentoId: 601, procedimentoId: 3, ocsCnpj: IMAGEM_CENTRO, quantidade: 1 }],
        dataAprovacaoMedico: '2026-10-08T09:00:00',
        dataAprovacaoChefe: '2026-10-08T10:00:00',
        chefeId: 1,
        dataEmissao: '2026-10-09'
      }),
      preGuia(8, {
        status: 'REPROVADA',
        beneficiarioPrecCp: '123456',
        procedimentos: [{ atendimentoId: 106, procedimentoId: 5, ocsCnpj: IMAGEM_CENTRO, quantidade: 1 }],
        motivoReprovacao: 'Procedimento sem indicação clínica no pedido.'
      })
    ],
    // Sessao_Procedimento + Data_Confirmacao (check mútuo). Nula = aguardando o beneficiário.
    sessoes: [
      { id: 1, atendimentoId: 501, numeroSessao: 1, ocsCnpj: IMAGEM_CENTRO, dataRealizacao: '2026-10-17T10:00:00', dataConfirmacao: '2026-10-17T10:04:00' },
      { id: 2, atendimentoId: 601, numeroSessao: 1, ocsCnpj: IMAGEM_CENTRO, dataRealizacao: '2026-10-11T08:30:00', dataConfirmacao: '2026-10-11T08:41:00' }
    ],
    espelhos: [
      { id: 1, atendimentoId: 601, ocsId: IMAGEM_CENTRO, dataInicio: '2026-10-11', dataFim: '2026-10-11', status: 'EM_ABERTO', dataAtualizacao: null, motivoReprovacao: null }
    ],
    espelhoItens: [
      { id: 1, espelhoId: 1, beneficiarioId: '1001', descricao: 'Ultrassom · abdome total', valor: 280.0 },
      { id: 2, espelhoId: 1, beneficiarioId: '1001', descricao: 'Gel condutor e materiais', valor: 15.0 }
    ],
    // historico_status (US001-3): GUIA_PROC usa o atendimentoId.
    historico: [
      { id: 1, entidadeTipo: 'GUIA_PROC', entidadeId: 501, statusAnterior: null, statusNovo: 'PENDENTE', data: '2026-10-16T09:00:00', origem: 'emissao-da-guia' },
      { id: 2, entidadeTipo: 'GUIA_PROC', entidadeId: 502, statusAnterior: null, statusNovo: 'PENDENTE', data: '2026-10-16T09:00:00', origem: 'emissao-da-guia' },
      { id: 3, entidadeTipo: 'GUIA_PROC', entidadeId: 501, statusAnterior: 'PENDENTE', statusNovo: 'EM_ANDAMENTO', data: '2026-10-17T10:04:00', origem: 'confirmacao-do-beneficiario' },
      { id: 4, entidadeTipo: 'GUIA_PROC', entidadeId: 601, statusAnterior: null, statusNovo: 'PENDENTE', data: '2026-10-09T09:00:00', origem: 'emissao-da-guia' },
      { id: 5, entidadeTipo: 'GUIA_PROC', entidadeId: 601, statusAnterior: 'PENDENTE', statusNovo: 'REALIZADA', data: '2026-10-11T08:41:00', origem: 'confirmacao-do-beneficiario' },
      { id: 6, entidadeTipo: 'ESPELHO', entidadeId: 1, statusAnterior: null, statusNovo: 'EM_ABERTO', data: '2026-10-12T14:00:00', origem: 'envio-pela-ocs' }
    ]
  }
}

let estado = null

// Outra aba gravou no banco mock: descarta a cópia em memória para ler de novo.
window.addEventListener('storage', evento => {
  if (evento.key === CHAVE) estado = null
})

export function banco() {
  if (!estado) {
    try {
      estado = JSON.parse(localStorage.getItem(CHAVE)) || semente()
    } catch {
      estado = semente()
    }
  }
  return estado
}

export function persistir() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado))
  } catch {
    // sem storage os dados mock valem só até recarregar
  }
}

export function resetarBancoMock() {
  estado = semente()
  persistir()
}

export function proximoId(lista) {
  return lista.reduce((maior, item) => Math.max(maior, item.id), 0) + 1
}

export function copiar(valor) {
  return JSON.parse(JSON.stringify(valor))
}

export function registrarHistorico(entidadeTipo, entidadeId, statusAnterior, statusNovo, origem) {
  const db = banco()
  db.historico.push({
    id: proximoId(db.historico),
    entidadeTipo,
    entidadeId,
    statusAnterior,
    statusNovo,
    data: new Date().toISOString(),
    origem
  })
}

// Nome exibido de um usuário: o do beneficiário vinculado, ou o cargo na OCS.
export function nomeDoUsuario(usuario) {
  const db = banco()
  const beneficiario = db.beneficiarios.find(b => b.precCp === usuario.precCp)
  if (beneficiario) return beneficiario.nome
  const ocs = db.ocs.find(o => o.cnpj === usuario.ocsCnpj)
  return [usuario.cargo, ocs?.nome].filter(Boolean).join(' · ') || usuario.cpf
}
