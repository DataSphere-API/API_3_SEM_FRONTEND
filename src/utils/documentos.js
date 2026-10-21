export function somenteDigitos(valor) {
  return String(valor ?? '').replace(/\D/g, '')
}

function digitoVerificador(numeros) {
  const soma = numeros
    .split('')
    .reduce((total, digito, i) => total + Number(digito) * (numeros.length + 1 - i), 0)
  const resto = (soma * 10) % 11
  return resto === 10 ? 0 : resto
}

export function cpfValido(valor) {
  const cpf = somenteDigitos(valor)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false
  }
  return (
    digitoVerificador(cpf.slice(0, 9)) === Number(cpf[9]) &&
    digitoVerificador(cpf.slice(0, 10)) === Number(cpf[10])
  )
}

export function formatarCpf(valor) {
  const cpf = somenteDigitos(valor).slice(0, 11)
  return cpf
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

export function formatarCnpj(valor) {
  const cnpj = somenteDigitos(valor).slice(0, 14)
  return cnpj
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function emailValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor ?? '').trim())
}

export function formatarData(valor) {
  if (!valor) return '—'
  const data = new Date(valor.length === 10 ? `${valor}T00:00:00` : valor)
  return Number.isNaN(data.getTime()) ? '—' : data.toLocaleDateString('pt-BR')
}

export function formatarDataHora(valor) {
  if (!valor) return '—'
  const data = new Date(valor)
  return Number.isNaN(data.getTime())
    ? '—'
    : data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
