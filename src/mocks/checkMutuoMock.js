export async function mockListarGuiasDoBeneficiario(precCp) {
  return [
    {
      id: 1,
      numero: "PG 006",
      status: "EMITIDA",
      procedimentos: [
        {
          atendimentoId: 501,
          nome: "Raio-X · joelho",
          status: "EM_ANDAMENTO",
          qtdRealizada: 2,
          qtdAutorizada: 3
        },
        {
          atendimentoId: 502,
          nome: "TC Abdome Superior",
          status: "PENDENTE",
          qtdRealizada: 0,
          qtdAutorizada: 1
        }
      ]
    },
    {
      id: 2,
      numero: "PG 007",
      status: "EMITIDA",
      procedimentos: [
        {
          atendimentoId: 503,
          nome: "Ultrassom · abdome total",
          status: "CONCLUIDO",
          qtdRealizada: 2,
          qtdAutorizada: 2
        },
        {
          atendimentoId: 504,
          nome: "Fisioterapia",
          status: "EM_ANDAMENTO",
          qtdRealizada: 5,
          qtdAutorizada: 10
        }
      ]
    }
  ]
}

export const atendimentos = []