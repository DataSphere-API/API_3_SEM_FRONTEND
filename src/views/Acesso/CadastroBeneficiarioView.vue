<script setup>
import { reactive, ref, computed } from 'vue'
import { cadastrarBeneficiario } from '../../services/authService.js'
import {
  basePrecCp,
  cpfValido,
  ehTitular,
  formatarCpf,
  formatarPrecCp,
  precCpValido,
  somenteDigitos,
  SUFIXO_TITULAR
} from '../../utils/documentos.js'

const form = reactive({
  nome: '',
  dataNascimento: '',
  dependente: false,
  precCpTitular: '',
  precCpDependente: '',
  cpfResponsavel: '',
  cpf: '',
  senha: '',
  confirmarSenha: ''
})

const errosCampo = ref({})
const erro = ref('')
const carregando = ref(false)
const cadastrado = ref(null)

// Titular digita só os 9 números (o -00 entra sozinho); dependente digita o Prec-CP inteiro.
const precCp = computed(() =>
  form.dependente ? form.precCpDependente : form.precCpTitular ? `${form.precCpTitular}-${SUFIXO_TITULAR}` : ''
)

function validar() {
  const erros = {}
  if (form.nome.trim().length < 3) erros.nome = 'Informe seu nome completo.'
  if (!form.dataNascimento) erros.dataNascimento = 'Informe a data de nascimento.'
  if (form.dependente) {
    if (!precCpValido(form.precCpDependente)) erros.precCp = 'Use o formato 123456789-01.'
    else if (ehTitular(form.precCpDependente)) erros.precCp = 'O final -00 é do beneficiário principal.'
    if (!cpfValido(form.cpfResponsavel)) erros.cpfResponsavel = 'CPF inválido.'
    else if (somenteDigitos(form.cpfResponsavel) === somenteDigitos(form.cpf)) {
      erros.cpfResponsavel = 'Informe o CPF do responsável, não o seu.'
    }
  } else if (form.precCpTitular.length !== 9) {
    erros.precCp = 'O Prec-CP tem 9 números antes do -00.'
  }
  if (!cpfValido(form.cpf)) erros.cpf = 'CPF inválido.'
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
      nome: form.nome.trim(),
      precCp: precCp.value,
      dataNascimento: form.dataNascimento,
      dependente: form.dependente,
      cpfResponsavel: form.dependente ? somenteDigitos(form.cpfResponsavel) : null,
      cpf: somenteDigitos(form.cpf),
      senha: form.senha
    })
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível concluir o cadastro.'
  } finally {
    carregando.value = false
  }
}

// Ao virar dependente, já sugere o início do Prec-CP digitado como titular.
function trocarTipo(dependente) {
  form.dependente = dependente
  errosCampo.value = {}
  if (dependente && !form.precCpDependente && form.precCpTitular) form.precCpDependente = `${form.precCpTitular}-`
  if (!dependente && !form.precCpTitular && form.precCpDependente) form.precCpTitular = basePrecCp(form.precCpDependente)
}
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo cadastro">
      <header>
        <p class="marca">FUSEx · Guias</p>
        <h1 class="fx-titulo">Cadastro do beneficiário</h1>
        <p class="fx-subtitulo">
          Crie seu acesso com o seu Prec-CP. Dependente informa também o CPF do beneficiário principal.
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
        <div class="fx-checks" role="radiogroup" aria-label="Tipo de beneficiário">
          <label class="fx-check">
            <input type="radio" name="tipo" :checked="!form.dependente" @change="trocarTipo(false)" />
            Beneficiário principal (titular)
          </label>
          <label class="fx-check">
            <input type="radio" name="tipo" :checked="form.dependente" @change="trocarTipo(true)" />
            Sou dependente
          </label>
        </div>
        <label class="fx-campo">
          Nome completo
          <input v-model="form.nome" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.nome }" maxlength="150" autocomplete="name" />
          <span v-if="errosCampo.nome" class="fx-erro-campo">{{ errosCampo.nome }}</span>
        </label>
        <div class="fx-grade">
          <label v-if="!form.dependente" class="fx-campo">
            Prec-CP
            <span class="com-sufixo">
              <input
                :value="form.precCpTitular"
                class="fx-entrada fx-mono"
                :class="{ 'fx-entrada-erro': errosCampo.precCp }"
                inputmode="numeric"
                maxlength="9"
                placeholder="123456789"
                @input="form.precCpTitular = somenteDigitos($event.target.value).slice(0, 9); $event.target.value = form.precCpTitular"
              />
              <span class="sufixo fx-mono">-{{ SUFIXO_TITULAR }}</span>
            </span>
            <span v-if="errosCampo.precCp" class="fx-erro-campo">{{ errosCampo.precCp }}</span>
          </label>
          <label v-else class="fx-campo">
            Prec-CP
            <input
              :value="form.precCpDependente"
              class="fx-entrada fx-mono"
              :class="{ 'fx-entrada-erro': errosCampo.precCp }"
              inputmode="numeric"
              maxlength="12"
              placeholder="123456789-01"
              @input="form.precCpDependente = formatarPrecCp($event.target.value); $event.target.value = form.precCpDependente"
            />
            <span v-if="errosCampo.precCp" class="fx-erro-campo">{{ errosCampo.precCp }}</span>
          </label>
          <label class="fx-campo">
            Data de nascimento
            <input v-model="form.dataNascimento" type="date" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.dataNascimento }" />
            <span v-if="errosCampo.dataNascimento" class="fx-erro-campo">{{ errosCampo.dataNascimento }}</span>
          </label>
        </div>
        <template v-if="form.dependente">
          <label class="fx-campo">
            CPF do responsável (beneficiário principal)
            <input
              :value="form.cpfResponsavel"
              class="fx-entrada"
              :class="{ 'fx-entrada-erro': errosCampo.cpfResponsavel }"
              inputmode="numeric"
              placeholder="000.000.000-00"
              @input="form.cpfResponsavel = formatarCpf($event.target.value)"
            />
            <span v-if="errosCampo.cpfResponsavel" class="fx-erro-campo">{{ errosCampo.cpfResponsavel }}</span>
          </label>
          <p class="fx-suave">
            O seu Prec-CP começa igual ao do responsável e termina em -01, -02... O responsável precisa já ter
            feito o cadastro dele.
          </p>
        </template>

        <h2 class="fx-secao-titulo">2. Seu acesso</h2>
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
        </div>
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

.com-sufixo {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.sufixo {
  font-weight: 600;
}

.link-botao {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  align-self: flex-start;
}
</style>
