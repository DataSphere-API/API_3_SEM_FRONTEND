// Competência = mês de referência, no formato AAAA-MM.
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

export function competenciaDe(data) {
  return String(data).slice(0, 7)
}

export function competenciaAtual() {
  return new Date().toISOString().slice(0, 7)
}

export function primeiroDiaDe(competencia) {
  return `${competencia}-01`
}

export function rotuloCompetencia(competencia) {
  const [ano, mes] = competencia.split('-')
  return `${MESES[Number(mes) - 1]}/${ano}`
}

// O mês só fecha quando acaba: só então a fatura pode ser encaminhada.
export function mesEncerrado(competencia) {
  return competencia < competenciaAtual()
}
