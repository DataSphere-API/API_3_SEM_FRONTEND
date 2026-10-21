export const PERFIS = {
  CHEFE: {
    rotulo: 'Chefe do FUSEx',
    descricao: 'Aprovar pré-guias e cadastrar usuários, OCS e contratos.',
    rotaInicial: '/aprovacao',
    menu: [
      { rotulo: 'Pré-guias para aprovar', rota: '/aprovacao' },
      { rotulo: 'Usuários e perfis', rota: '/usuarios' },
      { rotulo: 'OCS credenciadas', rota: '/ocs' },
      { rotulo: 'Contratos', rota: '/contratos' }
    ]
  },
  MEDICO: {
    rotulo: 'Médico',
    descricao: 'Criar solicitações de exame e aprovar pré-guias.',
    rotaInicial: '/aprovacao',
    menu: [
      { rotulo: 'Nova solicitação', rota: '/medico/nova-solicitacao' },
      { rotulo: 'Pré-guias para aprovar', rota: '/aprovacao' }
    ]
  },
  EMISSOR: {
    rotulo: 'Emissor',
    descricao: 'Criar pré-guias, corrigir as devolvidas e emitir as aprovadas.',
    rotaInicial: '/emissor/acompanhamento',
    menu: [
      { rotulo: 'Criar pré-guia', rota: '/emissor/pre-guias/nova' },
      { rotulo: 'Acompanhamento', rota: '/emissor/acompanhamento' },
      { rotulo: 'Aprovadas', rota: '/emissor/aprovadas' }
    ]
  },
  BENEFICIARIO: {
    rotulo: 'Beneficiário',
    descricao: 'Acompanhar suas guias e procedimentos.',
    rotaInicial: '/minhas-guias',
    menu: [{ rotulo: 'Minhas guias', rota: '/minhas-guias' }]
  },
  AUDITOR: {
    rotulo: 'Auditor',
    descricao: 'Receber e auditar espelhos e faturas.',
    rotaInicial: '/faturas',
    menu: [
      { rotulo: 'Espelhos', rota: '/espelhos' },
      { rotulo: 'Faturas', rota: '/faturas' }
    ]
  },
  OCS: {
    rotulo: 'OCS',
    descricao: 'Dar baixa nos atendimentos e enviar espelhos.',
    rotaInicial: '/atendimento',
    menu: [
      { rotulo: 'Atendimento', rota: '/atendimento' },
      { rotulo: 'Espelhos', rota: '/espelhos' }
    ]
  }
}

// O beneficiário se cadastra sozinho; o chefe só atribui os perfis de trabalho.
export const PERFIS_ATRIBUIVEIS = ['CHEFE', 'MEDICO', 'EMISSOR', 'AUDITOR', 'OCS']

export function rotuloPerfil(perfil) {
  return PERFIS[perfil]?.rotulo || perfil
}
