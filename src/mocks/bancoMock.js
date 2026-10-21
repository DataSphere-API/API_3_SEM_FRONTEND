// Banco em memória dos mocks das telas de acesso, cadastros e aprovação.
// Fica salvo no localStorage para o fluxo continuar entre logins de perfis diferentes.
const CHAVE = 'fusex-banco-mock-v2'
const SENHA_PADRAO = 'fusex123'

function semente() {
  return {
    ocs: [
      { cnpj: '12345678000199', nome: 'Clínica Imagem Centro', nomeFantasia: 'Imagem Centro', telefone: '1239001000', endereco: 'Av. Brasil, 100 · Caçapava/SP', tipoServico: 'Diagnóstico por imagem', ativa: true },
      { cnpj: '23456789000188', nome: 'Laboratório Vida Ltda', nomeFantasia: 'Laboratório Vida', telefone: '1239002000', endereco: 'Rua XV de Novembro, 45 · Caçapava/SP', tipoServico: 'Análises clínicas', ativa: true },
      { cnpj: '34567890000177', nome: 'Clínica Movimento S/S', nomeFantasia: 'Clínica Movimento', telefone: '1239003000', endereco: 'Rua Sete de Setembro, 300 · Taubaté/SP', tipoServico: 'Fisioterapia e psicologia', ativa: true }
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
      { id: 1, numero: 'CT 012/2026', procedimentoId: 1, ocsCnpj: '12345678000199', valor: 720.49, inicioVigencia: '2026-01-01', fimVigencia: '2026-12-31' },
      { id: 2, numero: 'CT 012/2026', procedimentoId: 3, ocsCnpj: '12345678000199', valor: 280.0, inicioVigencia: '2026-01-01', fimVigencia: '2026-12-31' },
      { id: 3, numero: 'CT 012/2026', procedimentoId: 5, ocsCnpj: '12345678000199', valor: 90.0, inicioVigencia: '2026-01-01', fimVigencia: '2026-12-31' },
      { id: 4, numero: 'CT 018/2026', procedimentoId: 2, ocsCnpj: '23456789000188', valor: 40.0, inicioVigencia: '2026-02-01', fimVigencia: '2027-01-31' },
      { id: 5, numero: 'CT 021/2026', procedimentoId: 4, ocsCnpj: '34567890000177', valor: 150.0, inicioVigencia: '2026-03-01', fimVigencia: '2027-02-28' },
      { id: 6, numero: 'CT 021/2026', procedimentoId: 6, ocsCnpj: '34567890000177', valor: 410.0, inicioVigencia: '2026-03-01', fimVigencia: '2027-02-28' }
    ],
    // Base de beneficiários do FUSEx: o autocadastro só aceita quem está aqui.
    beneficiarios: [
      { precCp: '1001', nome: 'Fulano de Tal', dataNascimento: '1986-03-10', dependente: false, ug: '3º BD' },
      { precCp: '123456', nome: 'Ana Paula Souza', dataNascimento: '1990-07-21', dependente: false, ug: '3º BD' },
      { precCp: '7007', nome: 'João Pedro Lima', dataNascimento: '2001-01-15', dependente: true, ug: '3º BD' },
      { precCp: '2002', nome: 'Rafael Duarte', dataNascimento: '1980-05-02', dependente: false, ug: '3º BD' },
      { precCp: '3003', nome: 'Carlos Albuquerque', dataNascimento: '1975-11-30', dependente: false, ug: '3º BD' },
      { precCp: '4004', nome: 'Luiz Fernandes', dataNascimento: '1992-09-14', dependente: false, ug: '3º BD' },
      { precCp: '5005', nome: 'Marina Costa', dataNascimento: '1988-02-25', dependente: false, ug: '3º BD' }
    ],
    usuarios: [
      { id: 1, nome: 'Carlos Albuquerque', cpf: '52601815906', postoGraduacao: 'Maj.', email: 'albuquerque@fusex.eb.mil.br', telefone: '12991110001', perfis: ['CHEFE'], precCp: '3003', crm: '', crmUf: '', ocsCnpj: '', ativo: true, senha: SENHA_PADRAO },
      { id: 2, nome: 'Rafael Duarte', cpf: '08301661305', postoGraduacao: 'Cap. Méd.', email: 'duarte@fusex.eb.mil.br', telefone: '12991110002', perfis: ['MEDICO', 'BENEFICIARIO'], precCp: '2002', crm: '123456', crmUf: 'SP', ocsCnpj: '', ativo: true, senha: SENHA_PADRAO },
      { id: 3, nome: 'Luiz Fernandes', cpf: '18609139034', postoGraduacao: '2º Sgt.', email: 'fernandes@fusex.eb.mil.br', telefone: '12991110003', perfis: ['EMISSOR'], precCp: '4004', crm: '', crmUf: '', ocsCnpj: '', ativo: true, senha: SENHA_PADRAO },
      { id: 4, nome: 'Marina Costa', cpf: '99603082430', postoGraduacao: '1º Ten.', email: 'marina@fusex.eb.mil.br', telefone: '12991110004', perfis: ['AUDITOR'], precCp: '5005', crm: '', crmUf: '', ocsCnpj: '', ativo: true, senha: SENHA_PADRAO },
      { id: 5, nome: 'Patrícia Gomes', cpf: '62819482112', postoGraduacao: '', email: 'recepcao@imagemcentro.com.br', telefone: '1239001001', perfis: ['OCS'], precCp: '', crm: '', crmUf: '', ocsCnpj: '12345678000199', ativo: true, senha: SENHA_PADRAO },
      { id: 6, nome: 'Fulano de Tal', cpf: '99351819019', postoGraduacao: '', email: 'fulano@email.com', telefone: '12991110006', perfis: ['BENEFICIARIO'], precCp: '1001', crm: '', crmUf: '', ocsCnpj: '', ativo: true, senha: SENHA_PADRAO }
    ],
    preGuias: [
      preGuiaSemente(1, '1001', 'AGUARDANDO_APROVACAO', [{ procedimentoId: 1, ocsCnpj: '12345678000199', quantidade: 1 }], { medico: 'PENDENTE', chefe: 'PENDENTE' }),
      preGuiaSemente(2, '7007', 'AGUARDANDO_APROVACAO', [{ procedimentoId: 4, ocsCnpj: '34567890000177', quantidade: 10 }], { medico: 'APROVADA', chefe: 'PENDENTE' }),
      preGuiaSemente(3, '123456', 'DEVOLVIDA', [{ procedimentoId: 6, ocsCnpj: '34567890000177', quantidade: 1 }], { medico: 'DEVOLVIDA', chefe: 'PENDENTE' }, 'Falta o CID e o laudo do exame anterior para justificar a eletroneuromiografia.'),
      preGuiaSemente(4, '1001', 'APROVADA', [{ procedimentoId: 2, ocsCnpj: '23456789000188', quantidade: 1 }, { procedimentoId: 3, ocsCnpj: '12345678000199', quantidade: 1 }], { medico: 'APROVADA', chefe: 'APROVADA' }),
      {
        ...preGuiaSemente(5, '1001', 'EMITIDA', [
          { procedimentoId: 5, ocsCnpj: '12345678000199', quantidade: 3, atendimentoId: 501 },
          { procedimentoId: 1, ocsCnpj: '12345678000199', quantidade: 1, atendimentoId: 502 }
        ], { medico: 'APROVADA', chefe: 'APROVADA' }),
        dataEmissao: '2026-10-16'
      }
    ],
    // Check mútuo: a OCS registra a sessão e ela só conta depois que o beneficiário confirma.
    // dataConfirmacao nula = aguardando o beneficiário.
    sessoes: [
      { id: 1, atendimentoId: 501, numeroSessao: 1, ocsCnpj: '12345678000199', dataRealizacao: '2026-10-17T10:00:00', dataConfirmacao: '2026-10-17T10:04:00' }
    ]
  }
}

function preGuiaSemente(id, precCp, status, procedimentos, decisoes, observacao = '') {
  const dia = `2026-10-${String(10 + id).padStart(2, '0')}T09:00:00`
  const decisao = (valor, por) => ({
    decisao: valor,
    por: valor === 'PENDENTE' ? null : por,
    data: valor === 'PENDENTE' ? null : dia,
    observacao: valor === 'DEVOLVIDA' ? observacao : ''
  })
  return {
    id,
    numero: `PG 2026/${String(id).padStart(3, '0')}`,
    status,
    criadaEm: dia,
    criadaPor: { nome: 'Luiz Fernandes', perfil: 'EMISSOR' },
    beneficiarioPrecCp: precCp,
    medicoSolicitante: { nome: 'Dra. Helena Prado', crm: '654321', uf: 'SP' },
    cid: id === 3 ? '' : 'R10.1',
    carater: id === 2 ? 'URGENCIA' : 'ELETIVO',
    justificativa: 'Investigação de dor abdominal persistente.',
    observacoesEmissor: '',
    respostaEmissor: '',
    procedimentos,
    aprovacaoMedico: decisao(decisoes.medico, 'Rafael Duarte'),
    aprovacaoChefe: decisao(decisoes.chefe, 'Carlos Albuquerque'),
    dataEmissao: null
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
