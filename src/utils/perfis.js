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
    descricao: 'Aprovar as pré-guias em que é o médico responsável.',
    rotaInicial: '/medico/aprovacao',
    menu: [
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
    descricao: 'Acompanhar suas guias e mostrar o QR Code na OCS.',
    rotaInicial: '/beneficiario/minhas-guias',
    menu: [
      { rotulo: 'Minhas guias', rota: '/beneficiario/minhas-guias' }
    ]
  },
  AUDITOR: {
    rotulo: 'Auditor',
    descricao: 'Receber, aprovar ou reprovar espelhos e ver o histórico.',
    rotaInicial: '/auditor/espelhos',
    menu: [
      { rotulo: 'Espelhos recebidos', rota: '/auditor/espelhos' },
      { rotulo: 'Faturas mensais', rota: '/auditor/faturas' },
      { rotulo: 'Histórico', rota: '/auditor/historico' }
    ]
  },
  OCS: {
    rotulo: 'OCS',
    descricao: 'Registrar sessões, dar a baixa por QR e enviar espelhos.',
    rotaInicial: '/ocs/atendimentos',
    menu: [
      { rotulo: 'Atendimentos', rota: '/ocs/atendimentos' },
      { rotulo: 'Baixa por QR', rota: '/ocs/atendimento-qr' },
      { rotulo: 'Espelhos', rota: '/ocs/espelhos' }
    ]
  }
}

// O beneficiário se cadastra sozinho. O chefe dá estes perfis a militares (pelo Prec-CP);
// o perfil OCS é de funcionário de clínica.
export const PERFIS_DE_MILITAR = ['CHEFE', 'MEDICO', 'EMISSOR', 'AUDITOR']

export function rotuloPerfil(perfil) {
  return PERFIS[perfil]?.rotulo || perfil
}
