export function esperar(milissegundos = 400) {
  return new Promise(resolve => setTimeout(resolve, milissegundos))
}

export function erroHttp(status, dados) {
  const erro = new Error(`Request failed with status code ${status}`)
  erro.response = { status, data: dados }
  return erro
}