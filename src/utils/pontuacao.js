// Pontuação de um item do espelho: compara o valor cobrado pela OCS com o valor do contrato.
// Os limites de severidade são os da US002-2 (BAIXA até 5%, MEDIA até 15%, ALTA acima).
const LIMITE_BAIXA = 5
const LIMITE_MEDIA = 15

export function avaliarCobranca(valorCobrado, valorContratado) {
  if (valorContratado === null || valorContratado === undefined) {
    return { pontuacao: 0, diferenca: null, percentual: null, texto: 'Sem contrato', classe: 'fx-selo-vermelho' }
  }
  const cobrado = Number(valorCobrado) || 0
  const contratado = Number(valorContratado) || 0
  const diferenca = cobrado - contratado
  const percentual = contratado > 0 ? (diferenca / contratado) * 100 : 0

  if (diferenca <= 0) {
    return { pontuacao: 100, diferenca, percentual, texto: 'Dentro do contrato', classe: 'fx-selo-verde' }
  }
  const pontuacao = Math.max(0, Math.round(100 - percentual))
  if (percentual <= LIMITE_BAIXA) {
    return { pontuacao, diferenca, percentual, texto: 'Acima · baixa', classe: 'fx-selo-ambar' }
  }
  if (percentual <= LIMITE_MEDIA) {
    return { pontuacao, diferenca, percentual, texto: 'Acima · média', classe: 'fx-selo-ambar' }
  }
  return { pontuacao, diferenca, percentual, texto: 'Acima · alta', classe: 'fx-selo-vermelho' }
}

// Pontuação do espelho: média das pontuações dos itens.
export function pontuacaoDoEspelho(itens) {
  if (!itens.length) return 0
  const soma = itens.reduce((total, i) => total + avaliarCobranca(i.valor, i.valorContratado).pontuacao, 0)
  return Math.round(soma / itens.length)
}

export function classeDaPontuacao(pontuacao) {
  if (pontuacao >= 95) return 'fx-selo-verde'
  if (pontuacao >= 85) return 'fx-selo-ambar'
  return 'fx-selo-vermelho'
}
