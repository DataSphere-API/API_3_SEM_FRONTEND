<script setup>
import { reactive, ref, computed } from 'vue'
import { criarUsuario } from '../../../services/usuarioService.js'
import { buscarBeneficiarios } from '../../../services/beneficiarioService.js'
import { PERFIS, PERFIS_DE_MILITAR, rotuloPerfil } from '../../../utils/perfis.js'
import { cpfValido, formatarCpf, somenteDigitos } from '../../../utils/documentos.js'

const props = defineProps({
  ocs: { type: Array, required: true },
  usuarios: { type: Array, required: true }
})

const emit = defineEmits(['fechar', 'salvo'])

const form = reactive({
  tipo: 'MILITAR',
  cpf: '',
  senha: '',
  perfis: [],
  crm: '',
  ocsCnpj: '',
  cargo: ''
})

const busca = ref('')
const buscando = ref(false)
const resultadosBusca = ref([])
const militar = ref(null)
const errosCampo = ref({})
const erro = ref('')
const salvando = ref(false)

// O login do militar nasce no autocadastro. Aqui o chefe só acrescenta perfis
// a quem já tem acesso; CPF e senha só são pedidos para funcionário de OCS, que não é beneficiário.
function acessoDe(precCp) {
  return props.usuarios.find(u => u.precCp === precCp) || null
}
const acessoExistente = computed(() => (form.tipo === 'MILITAR' && militar.value ? acessoDe(militar.value.precCp) : null))
const semPrimeiroAcesso = computed(() => form.tipo === 'MILITAR' && Boolean(militar.value) && !acessoExistente.value)

async function pesquisar() {
  if (!busca.value.trim()) return
  buscando.value = true
  try {
    resultadosBusca.value = await buscarBeneficiarios(busca.value)
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível buscar.'
  } finally {
    buscando.value = false
  }
}

function escolher(b) {
  militar.value = b
  form.perfis = []
  resultadosBusca.value = []
  busca.value = ''
}

function validar() {
  const erros = {}
  if (form.tipo === 'MILITAR') {
    if (!militar.value) erros.militar = 'Escolha a pessoa pelo nome ou Prec-CP.'
    else if (semPrimeiroAcesso.value) erros.militar = 'Esta pessoa ainda não fez o primeiro acesso.'
    if (form.perfis.length === 0) erros.perfis = 'Marque pelo menos um perfil.'
    if (form.perfis.includes('MEDICO') && !form.crm.trim()) erros.crm = 'Médico precisa de CRM.'
  } else {
    if (!form.ocsCnpj) erros.ocsCnpj = 'Escolha a OCS.'
    if (!form.cargo.trim()) erros.cargo = 'Informe o cargo.'
    if (!cpfValido(form.cpf)) erros.cpf = 'CPF inválido.'
    if (form.senha.length < 8) erros.senha = 'Mínimo de 8 caracteres.'
  }
  errosCampo.value = erros
  return Object.keys(erros).length === 0
}

async function salvar() {
  erro.value = ''
  if (!validar()) return

  const dados =
    form.tipo === 'MILITAR'
      ? { tipo: 'MILITAR', precCp: militar.value.precCp, perfis: form.perfis, crm: form.crm.trim() }
      : { tipo: 'OCS', cpf: somenteDigitos(form.cpf), senha: form.senha, ocsCnpj: form.ocsCnpj, cargo: form.cargo.trim() }

  salvando.value = true
  try {
    emit('salvo', await criarUsuario(dados))
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível cadastrar o usuário.'
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <div class="fx-modal-fundo" @click.self="emit('fechar')">
    <form class="fx-modal fx-modal-largo" novalidate @submit.prevent="salvar">
      <div class="fx-modal-topo">
        <div>
          <h2>Novo usuário</h2>
          <p>Com mais de um perfil, a pessoa escolhe com qual entrar depois do login.</p>
        </div>
        <button type="button" class="fx-fechar" aria-label="Fechar" @click="emit('fechar')">&times;</button>
      </div>

      <div class="fx-modal-corpo">
        <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

        <div class="fx-checks" role="radiogroup" aria-label="Tipo de usuário">
          <label class="fx-check">
            <input v-model="form.tipo" type="radio" value="MILITAR" />
            Militar do FUSEx
          </label>
          <label class="fx-check">
            <input v-model="form.tipo" type="radio" value="OCS" />
            Funcionário de OCS
          </label>
        </div>

        <template v-if="form.tipo === 'MILITAR'">
          <h3 class="fx-secao-titulo">1. Quem é</h3>
          <div v-if="militar" class="escolhido">
            <span><strong>{{ militar.nome }}</strong> <span class="fx-suave fx-mono">· Prec-CP {{ militar.precCp }}</span></span>
            <button type="button" class="fx-botao-secundario" @click="militar = null">Trocar</button>
          </div>
          <p v-if="acessoExistente" class="fx-alerta fx-alerta-cinza">
            Já tem acesso com o CPF <span class="fx-mono">{{ formatarCpf(acessoExistente.cpf) }}</span>
            ({{ acessoExistente.perfis.map(rotuloPerfil).join(', ') }}). Os perfis marcados abaixo serão
            acrescentados; o login e a senha continuam os mesmos.
          </p>
          <p v-else-if="semPrimeiroAcesso" class="fx-alerta fx-alerta-ambar" role="alert">
            {{ militar.nome }} ainda não fez o primeiro acesso. Peça para entrar em <strong>Cadastre-se</strong>,
            na tela de login, e criar a própria senha. Depois volte aqui
            para dar os perfis.
          </p>
          <template v-if="!militar">
            <div class="busca">
              <label class="fx-campo">
                Buscar pelo nome ou Prec-CP
                <input
                  v-model="busca"
                  class="fx-entrada"
                  :class="{ 'fx-entrada-erro': errosCampo.militar }"
                  @keydown.enter.prevent="pesquisar"
                />
              </label>
              <button type="button" class="fx-botao-secundario" :disabled="buscando" @click="pesquisar">Buscar</button>
            </div>
            <span v-if="errosCampo.militar" class="fx-erro-campo">{{ errosCampo.militar }}</span>
            <ul v-if="resultadosBusca.length" class="fx-lista resultados">
              <li v-for="b in resultadosBusca" :key="b.precCp">
                <button type="button" class="resultado" @click="escolher(b)">
                  <strong>{{ b.nome }}</strong>
                  <span class="fx-suave">
                    <span class="fx-mono">Prec-CP {{ b.precCp }}</span> ·
                    {{ acessoDe(b.precCp) ? 'já tem acesso' : 'ainda não fez o primeiro acesso' }}
                  </span>
                </button>
              </li>
            </ul>
            <p class="fx-suave">O nome vem do cadastro de beneficiários do FUSEx.</p>
          </template>

          <template v-if="!semPrimeiroAcesso">
            <h3 class="fx-secao-titulo">2. Perfis</h3>
            <div class="fx-checks">
              <label v-for="perfil in PERFIS_DE_MILITAR" :key="perfil" class="fx-check">
                <input
                  v-model="form.perfis"
                  type="checkbox"
                  :value="perfil"
                  :disabled="acessoExistente?.perfis.includes(perfil)"
                />
                {{ PERFIS[perfil].rotulo }}
              </label>
            </div>
            <span v-if="errosCampo.perfis" class="fx-erro-campo">{{ errosCampo.perfis }}</span>
            <label v-if="form.perfis.includes('MEDICO')" class="fx-campo">
              CRM
              <input v-model="form.crm" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.crm }" inputmode="numeric" />
              <span v-if="errosCampo.crm" class="fx-erro-campo">{{ errosCampo.crm }}</span>
            </label>
          </template>
        </template>

        <template v-else>
          <h3 class="fx-secao-titulo">1. Onde trabalha</h3>
          <div class="fx-grade">
            <label class="fx-campo">
              OCS
              <select v-model="form.ocsCnpj" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.ocsCnpj }">
                <option value="" disabled>Escolha a OCS</option>
                <option v-for="o in ocs" :key="o.cnpj" :value="o.cnpj">{{ o.nome }}</option>
              </select>
              <span v-if="errosCampo.ocsCnpj" class="fx-erro-campo">{{ errosCampo.ocsCnpj }}</span>
            </label>
            <label class="fx-campo">
              Cargo
              <input v-model="form.cargo" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.cargo }" placeholder="Ex.: Recepção" />
              <span v-if="errosCampo.cargo" class="fx-erro-campo">{{ errosCampo.cargo }}</span>
            </label>
          </div>
        </template>

        <template v-if="form.tipo === 'OCS'">
          <h3 class="fx-secao-titulo">2. Acesso</h3>
          <div class="fx-grade">
            <label class="fx-campo">
              CPF (login)
              <input
                :value="form.cpf"
                class="fx-entrada"
                :class="{ 'fx-entrada-erro': errosCampo.cpf }"
                inputmode="numeric"
                @input="form.cpf = formatarCpf($event.target.value)"
              />
              <span v-if="errosCampo.cpf" class="fx-erro-campo">{{ errosCampo.cpf }}</span>
            </label>
            <label class="fx-campo">
              Senha provisória
              <input v-model="form.senha" type="text" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.senha }" autocomplete="off" />
              <span v-if="errosCampo.senha" class="fx-erro-campo">{{ errosCampo.senha }}</span>
            </label>
          </div>
        </template>
      </div>

      <div class="fx-modal-rodape">
        <button type="button" class="fx-botao-secundario" @click="emit('fechar')">Cancelar</button>
        <button type="submit" class="fx-botao" :disabled="salvando || semPrimeiroAcesso">
          {{ salvando ? 'Salvando...' : 'Cadastrar usuário' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.escolhido,
.busca {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem;
}

.escolhido {
  align-items: center;
}

.resultados {
  gap: 0.4rem;
}

.resultado {
  width: 100%;
  min-height: 44px;
  padding: 0.5rem 0.85rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  border: 1px solid var(--fx-borda);
  border-radius: 8px;
  background-color: #ffffff;
  font-family: inherit;
  cursor: pointer;
}
</style>
