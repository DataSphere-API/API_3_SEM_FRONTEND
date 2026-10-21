<script setup>
import { reactive, ref } from 'vue'
import { cadastrarBeneficiario } from '../../services/authService.js'
import { cpfValido, emailValido, formatarCpf, somenteDigitos } from '../../utils/documentos.js'

const form = reactive({
  precCp: '',
  dataNascimento: '',
  cpf: '',
  email: '',
  telefone: '',
  senha: '',
  confirmarSenha: ''
})

const errosCampo = ref({})
const erro = ref('')
const carregando = ref(false)
const cadastrado = ref(null)

function validar() {
  const erros = {}
  if (!form.precCp.trim()) erros.precCp = 'Informe o Prec-CP.'
  if (!form.dataNascimento) erros.dataNascimento = 'Informe a data de nascimento.'
  if (!cpfValido(form.cpf)) erros.cpf = 'CPF inválido.'
  if (!emailValido(form.email)) erros.email = 'E-mail inválido.'
  if (somenteDigitos(form.telefone).length < 10) erros.telefone = 'Informe o telefone com DDD.'
  if (form.senha.length < 8) erros.senha = 'A senha precisa ter pelo menos 8 caracteres.'
  if (form.confirmarSenha !== form.senha) erros.confirmarSenha = 'As senhas não conferem.'
  errosCampo.value = erros
  return Object.keys(erros).length === 0
}

async function enviar() {
  erro.value = ''
  if (!validar()) return

  carregando.value = true
  try {
    cadastrado.value = await cadastrarBeneficiario({
      precCp: form.precCp.trim(),
      dataNascimento: form.dataNascimento,
      cpf: somenteDigitos(form.cpf),
      email: form.email.trim(),
      telefone: somenteDigitos(form.telefone),
      senha: form.senha
    })
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível concluir o cadastro.'
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo cadastro">
      <header>
        <p class="marca">FUSEx · Guias</p>
        <h1 class="fx-titulo">Cadastro do beneficiário</h1>
        <p class="fx-subtitulo">
          Informe seu Prec-CP e sua data de nascimento como estão no FUSEx. Conferimos esses dados
          antes de liberar o acesso.
        </p>
      </header>

      <section v-if="cadastrado" class="fx-cartao">
        <p class="fx-alerta fx-alerta-verde" role="status">
          Cadastro concluído, {{ cadastrado.nome }}. Agora é só entrar com seu CPF e a senha que você criou.
        </p>
        <router-link to="/login" class="fx-botao link-botao">Ir para o login</router-link>
      </section>

      <form v-else class="fx-cartao" novalidate @submit.prevent="enviar">
        <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

        <h2 class="fx-secao-titulo">1. Seus dados no FUSEx</h2>
        <div class="fx-grade">
          <label class="fx-campo">
            Prec-CP
            <input v-model="form.precCp" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.precCp }" inputmode="numeric" />
            <span v-if="errosCampo.precCp" class="fx-erro-campo">{{ errosCampo.precCp }}</span>
          </label>
          <label class="fx-campo">
            Data de nascimento
            <input v-model="form.dataNascimento" type="date" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.dataNascimento }" />
            <span v-if="errosCampo.dataNascimento" class="fx-erro-campo">{{ errosCampo.dataNascimento }}</span>
          </label>
        </div>

        <h2 class="fx-secao-titulo">2. Contato e acesso</h2>
        <div class="fx-grade">
          <label class="fx-campo">
            CPF (será o seu login)
            <input
              :value="form.cpf"
              class="fx-entrada"
              :class="{ 'fx-entrada-erro': errosCampo.cpf }"
              inputmode="numeric"
              placeholder="000.000.000-00"
              @input="form.cpf = formatarCpf($event.target.value)"
            />
            <span v-if="errosCampo.cpf" class="fx-erro-campo">{{ errosCampo.cpf }}</span>
          </label>
          <label class="fx-campo">
            Telefone
            <input v-model="form.telefone" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.telefone }" inputmode="tel" placeholder="(12) 99999-9999" />
            <span v-if="errosCampo.telefone" class="fx-erro-campo">{{ errosCampo.telefone }}</span>
          </label>
        </div>
        <label class="fx-campo">
          E-mail
          <input v-model="form.email" type="email" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.email }" autocomplete="email" />
          <span v-if="errosCampo.email" class="fx-erro-campo">{{ errosCampo.email }}</span>
        </label>
        <div class="fx-grade">
          <label class="fx-campo">
            Senha
            <input v-model="form.senha" type="password" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.senha }" autocomplete="new-password" />
            <span v-if="errosCampo.senha" class="fx-erro-campo">{{ errosCampo.senha }}</span>
          </label>
          <label class="fx-campo">
            Confirmar senha
            <input v-model="form.confirmarSenha" type="password" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.confirmarSenha }" autocomplete="new-password" />
            <span v-if="errosCampo.confirmarSenha" class="fx-erro-campo">{{ errosCampo.confirmarSenha }}</span>
          </label>
        </div>

        <div class="fx-acoes">
          <button type="submit" class="fx-botao" :disabled="carregando">
            {{ carregando ? 'Cadastrando...' : 'Criar meu acesso' }}
          </button>
          <router-link to="/login" class="fx-botao-secundario link-botao">Voltar ao login</router-link>
        </div>
      </form>
    </div>
  </main>
</template>

<style scoped>
.cadastro {
  max-width: 640px;
}

.marca {
  margin: 0 0 0.75rem;
  font-weight: 700;
  color: var(--fx-verde);
}

.link-botao {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  align-self: flex-start;
}
</style>
