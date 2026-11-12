// Competência = mês de referência, no formato AAAA-MM.
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

// Nos primeiros dias do mês a OCS ainda pode mandar espelho do mês anterior.
export const DIAS_DE_TOLERANCIA = 5

// Data local (não UTC), para a virada do mês bater com o relógio de quem usa.
export function hojeIso() {
  const agora = new Date()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${agora.getFullYear()}-${mes}-${dia}`
}

export function competenciaDe(data) {
  return String(data).slice(0, 7)
}

export function competenciaAtual() {
  return competenciaDe(hojeIso())
}

function deslocar(competencia, meses) {
  const [ano, mes] = competencia.split('-').map(Number)
  const data = new Date(Date.UTC(ano, mes - 1 + meses, 1))
  return data.toISOString().slice(0, 7)
}

export function primeiroDiaDe(competencia) {
  return `${competencia}-01`
}

export function ultimoDiaDe(competencia) {
  const [ano, mes] = competencia.split('-').map(Number)
  return new Date(Date.UTC(ano, mes, 0)).toISOString().slice(0, 10)
}

export function rotuloCompetencia(competencia) {
  const [ano, mes] = competencia.split('-')
  return `${MESES[Number(mes) - 1]}/${ano}`
}

// Meses para os quais a OCS pode montar espelho hoje: o atual e, até o dia 5, o anterior.
export function competenciasAbertasParaEspelho() {
  const atual = competenciaAtual()
  const dia = Number(hojeIso().slice(8, 10))
  return dia <= DIAS_DE_TOLERANCIA ? [deslocar(atual, -1), atual] : [atual]
}
