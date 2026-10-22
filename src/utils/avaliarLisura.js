export function avaliarItem(item) {

  if (item.valorContratado === null || item.valorContratado === undefined) {
    return {
      autorizado: false,
      status: 'Não autorizado',
      motivo: 'Item sem contrato associado'
    };
  }

  const apresentado = Number(item.valorApresentado) || 0;
  const contratado = Number(item.valorContratado) || 0;


  if (apresentado > contratado) {
    return {
      autorizado: false,
      status: 'Não autorizado',
      motivo: 'Valor acima do contratado'
    };
  }

  return {
    autorizado: true,
    status: 'Autorizado',
    motivo: null
  };
}

export function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(valor) || 0);
}