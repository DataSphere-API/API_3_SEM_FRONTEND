import { reactive, readonly } from 'vue'

// sessionStorage: cada aba tem o seu login (dá para abrir OCS e beneficiário lado a lado).
const CHAVE = 'fusex-sessao'

function carregar() {
  try {
    const salvo = JSON.parse(sessionStorage.getItem(CHAVE))
    if (salvo?.token && salvo?.usuario) return salvo
  } catch {
    // sessão corrompida ou storage bloqueado: começa deslogado
  }
  return { token: null, usuario: null, perfilAtivo: null }
}

const estado = reactive(carregar())

function salvar() {
  try {
    if (estado.token) {
      sessionStorage.setItem(CHAVE, JSON.stringify(estado))
    } else {
      sessionStorage.removeItem(CHAVE)
    }
  } catch {
    // sem storage a sessão vale só até recarregar a página
  }
}

export const sessao = readonly(estado)

export function iniciarSessao({ token, usuario }) {
  estado.token = token
  estado.usuario = usuario
  estado.perfilAtivo = usuario.perfis.length === 1 ? usuario.perfis[0] : null
  salvar()
}

export function escolherPerfil(perfil) {
  if (!estado.usuario?.perfis.includes(perfil)) return
  estado.perfilAtivo = perfil
  salvar()
}

export function encerrarSessao() {
  estado.token = null
  estado.usuario = null
  estado.perfilAtivo = null
  salvar()
}

export function estaLogado() {
  return Boolean(estado.token)
}
