export function esperar(milissegundos = 400) {
  return new Promise(resolve => setTimeout(resolve, milissegundos))
}

export function erroHttp(status, dados) {
  const erro = new Error(`Request failed with status code ${status}`)
  erro.response = { status, data: dados }
  return erro
}

// Simula a validade que, no back, vem de fusex.guia.validade-dias (application.properties).
// Só os mocks usam esta constante: as telas recebem o validoAte pronto do back.
export const VALIDADE_DIAS_MOCK = 60

export function somarDias(data, dias) {
  const resultado = new Date(`${data}T00:00:00`)
  resultado.setDate(resultado.getDate() + dias)
  return resultado.toISOString().slice(0, 10)
}