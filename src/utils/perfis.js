export const PERFIS = {
  CHEFE: {
    rotulo: 'Chefe do FUSEx',
    descricao: 'Aprovar pré-guias e cadastrar usuários, OCS e contratos.',
    rotaInicial: '/chefe/aprovacao',
    menu: [
      { rotulo: 'Pré-guias para aprovar', rota: '/chefe/aprovacao' },
      { rotulo: 'Usuários e perfis', rota: '/chefe/usuarios' },
      { rotulo: 'OCS credenciadas', rota: '/chefe/ocs' },
      { rotulo: 'Contratos', rota: '/chefe/contratos' }
    ]
  },
  MEDICO: {
    rotulo: 'Médico',
    descricao: 'Criar solicitações de exame e aprovar pré-guias.',
    rotaInicial: '/medico/aprovacao',
    menu: [
      { rotulo: 'Nova solicitação', rota: '/medico/nova-solicitacao' },
      { rotulo: 'Pré-guias para aprovar', rota: '/medico/aprovacao' }
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
    descricao: 'Confirmar os atendimentos e acompanhar suas guias.',
    rotaInicial: '/minhas-guias',
    menu: [
      { rotulo: 'Minhas guias', rota: '/minhas-guias' }
    ]
  },
  AUDITOR: {
    rotulo: 'Auditor',
    descricao: 'Receber, aprovar ou reprovar espelhos e ver o histórico.',
    rotaInicial: '/faturas',
    menu: [
      { rotulo: 'Faturas', rota: '/faturas' }
    ]
  },
  OCS: {
    rotulo: 'OCS',
    descricao: 'Dar baixa nos atendimentos e enviar espelhos.',
    rotaInicial: '/espelhos',
    menu: [
      { rotulo: 'Espelhos', rota: '/espelhos' }
    ]
  }
}

// O beneficiário se cadastra sozinho. O chefe dá estes perfis a militares (pelo Prec-CP);
// o perfil OCS é de funcionário de clínica.
export const PERFIS_DE_MILITAR = ['CHEFE', 'MEDICO', 'EMISSOR', 'AUDITOR']

export function rotuloPerfil(perfil) {
  return PERFIS[perfil]?.rotulo || perfil
}
