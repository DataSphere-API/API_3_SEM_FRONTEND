<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login } from '../../services/authService.js'
import { iniciarSessao, sessao } from '../../stores/sessao.js'
import { PERFIS } from '../../utils/perfis.js'
import { formatarCpf, somenteDigitos } from '../../utils/documentos.js'

const route = useRoute()
const router = useRouter()

const cpf = ref('')
const senha = ref('')
const carregando = ref(false)
const erro = ref('')
const errosCampo = ref({})

const USAR_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const usuariosTeste = [
  { perfil: 'Chefe do FUSEx', cpf: '526.018.159-06' },
  { perfil: 'Médico e Beneficiário', cpf: '083.016.613-05' },
  { perfil: 'Emissor', cpf: '186.091.390-34' },
  { perfil: 'Auditor', cpf: '996.030.824-30' },
  { perfil: 'OCS', cpf: '628.194.821-12' },
  { perfil: 'Beneficiário', cpf: '993.518.190-19' }
]

function aoDigitarCpf(evento) {
  cpf.value = formatarCpf(evento.target.value)
}

function validar() {
  const erros = {}
  if (somenteDigitos(cpf.value).length !== 11) erros.cpf = 'Informe os 11 dígitos do CPF.'
  if (!senha.value) erros.senha = 'Informe a senha.'
  errosCampo.value = erros
  return Object.keys(erros).length === 0
}

async function entrar() {
  erro.value = ''
  if (!validar()) return

  carregando.value = true
  try {
    iniciarSessao(await login(somenteDigitos(cpf.value), senha.value))
    if (!sessao.perfilAtivo) {
      router.push({ name: 'escolher-perfil', query: route.query })
      return
    }
    router.push(route.query.voltar || PERFIS[sessao.perfilAtivo].rotaInicial)
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível entrar.'
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <main class="fx-pagina acesso">
    <section class="apresentacao">
      <p class="marca">FUSEx · Guias</p>
      <h1>Um único acesso para FUSEx e clínicas credenciadas.</h1>
      <p>
        Beneficiários, médicos, chefia, emissores, auditores e equipes das OCS entram pelo mesmo
        login. O sistema mostra apenas as telas do seu perfil.
      </p>
    </section>

    <section class="fx-cartao formulario">
      <header>
        <h2 class="fx-titulo">Entrar</h2>
        <p class="fx-subtitulo">Use seu CPF e senha.</p>
      </header>

      <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

      <form class="campos" novalidate @submit.prevent="entrar">
        <label class="fx-campo">
          CPF
          <input
            :value="cpf"
            class="fx-entrada"
            :class="{ 'fx-entrada-erro': errosCampo.cpf }"
            inputmode="numeric"
            autocomplete="username"
            placeholder="000.000.000-00"
            @input="aoDigitarCpf"
          />
          <span v-if="errosCampo.cpf" class="fx-erro-campo">{{ errosCampo.cpf }}</span>
        </label>

        <label class="fx-campo">
          Senha
          <input
            v-model="senha"
            type="password"
            class="fx-entrada"
            :class="{ 'fx-entrada-erro': errosCampo.senha }"
            autocomplete="current-password"
          />
          <span v-if="errosCampo.senha" class="fx-erro-campo">{{ errosCampo.senha }}</span>
        </label>

        <button type="submit" class="fx-botao" :disabled="carregando">
          {{ carregando ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <p class="fx-suave">
        Se você tiver mais de um perfil (por exemplo, médico e beneficiário), vai escolher com qual
        deseja entrar.
      </p>

      <p class="primeiro-acesso">
        É beneficiário e ainda não tem acesso?
        <router-link to="/cadastro">Cadastre-se</router-link>
      </p>

      <details v-if="USAR_MOCK" class="teste">
        <summary>Usuários de teste (modo mock)</summary>
        <p class="fx-suave">Senha de todos: <span class="fx-mono">fusex123</span></p>
        <ul>
          <li v-for="u in usuariosTeste" :key="u.cpf">
            <button type="button" class="link-teste" @click="cpf = u.cpf; senha = 'fusex123'">
              {{ u.perfil }} · <span class="fx-mono">{{ u.cpf }}</span>
            </button>
          </li>
        </ul>
      </details>
    </section>
  </main>
</template>

<style scoped>
.acesso {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 2.5rem;
}

.apresentacao {
  flex: 1 1 320px;
  max-width: 440px;
}

.marca {
  margin: 0 0 1rem;
  font-weight: 700;
  color: var(--fx-verde);
}

.apresentacao h1 {
  margin: 0 0 1rem;
  font-size: 1.9rem;
  line-height: 1.2;
}

.apresentacao p {
  color: var(--fx-texto-suave);
  line-height: 1.5;
}

.formulario {
  flex: 1 1 320px;
  max-width: 420px;
  padding: 1.75rem;
  gap: 1rem;
}

.campos {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.primeiro-acesso {
  margin: 0;
  padding-top: 0.9rem;
  border-top: 1px solid var(--fx-borda);
  font-size: 0.9rem;
}

.primeiro-acesso a {
  color: var(--fx-verde);
  font-weight: 600;
}

.teste {
  font-size: 0.85rem;
}

.teste summary {
  cursor: pointer;
  color: var(--fx-texto-suave);
}

.teste ul {
  margin: 0.5rem 0 0;
  padding: 0;
  list-style: none;
}

.link-teste {
  min-height: 32px;
  padding: 0;
  border: none;
  background: none;
  color: var(--fx-verde);
  text-align: left;
  cursor: pointer;
}
</style>
