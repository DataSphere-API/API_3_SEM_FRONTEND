import { api } from './http.js'
import router from '../router'
import { sessao, encerrarSessao } from '../stores/sessao.js'

api.interceptors.request.use(config => {
    if (sessao.token) {
        config.headers.Authorization = `Bearer ${sessao.token}`
    }
    // Provisório até o Spring Security (US000-6): o back identifica médico/chefe pelo Prec-CP.
    if (sessao.usuario?.precCp) {
        config.headers['X-Prec-Cp'] = sessao.usuario.precCp
    }
    return config
})

api.interceptors.response.use(
    response => response,
    erro => {
        // Token vencido ou inválido: volta para o login sem perder a página de destino.
        if (erro?.response?.status === 401 && sessao.token) {
            encerrarSessao()
            router.push({ name: 'login', query: { voltar: router.currentRoute.value.fullPath } })
        }
        return Promise.reject(erro)
    }
)