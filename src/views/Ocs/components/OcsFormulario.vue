<script setup>
import { reactive, ref, computed } from 'vue'
import { salvarOcs } from '../../../services/ocsService.js'
import { formatarCnpj, somenteDigitos } from '../../../utils/documentos.js'

const props = defineProps({
  ocs: { type: Object, default: null }
})

const emit = defineEmits(['fechar', 'salvo'])

const editando = computed(() => Boolean(props.ocs))

const form = reactive({
  cnpj: formatarCnpj(props.ocs?.cnpj || ''),
  nome: props.ocs?.nome || '',
  nomeFantasia: props.ocs?.nomeFantasia || '',
  telefone: props.ocs?.telefone || '',
  endereco: props.ocs?.endereco || '',
  tipoServico: props.ocs?.tipoServico || '',
  ativa: props.ocs?.ativa ?? true
})

const errosCampo = ref({})
const erro = ref('')
const salvando = ref(false)

function validar() {
  const erros = {}
  if (somenteDigitos(form.cnpj).length !== 14) erros.cnpj = 'O CNPJ tem 14 dígitos.'
  if (!form.nome.trim()) erros.nome = 'Informe a razão social.'
  if (!form.nomeFantasia.trim()) erros.nomeFantasia = 'Informe o nome fantasia.'
  errosCampo.value = erros
  return Object.keys(erros).length === 0
}

async function salvar() {
  erro.value = ''
  if (!validar()) return

  salvando.value = true
  try {
    const dados = {
      ...form,
      cnpj: somenteDigitos(form.cnpj),
      nome: form.nome.trim(),
      nomeFantasia: form.nomeFantasia.trim(),
      telefone: somenteDigitos(form.telefone)
    }
    emit('salvo', await salvarOcs(dados, props.ocs?.cnpj ?? null))
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível salvar a OCS.'
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
          <h2>{{ editando ? 'Editar OCS' : 'Cadastrar OCS' }}</h2>
          <p>Clínica, hospital ou profissional credenciado.</p>
        </div>
        <button type="button" class="fx-fechar" aria-label="Fechar" @click="emit('fechar')">&times;</button>
      </div>

      <div class="fx-modal-corpo">
        <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

        <div class="fx-grade">
          <label class="fx-campo">
            CNPJ
            <input
              :value="form.cnpj"
              class="fx-entrada"
              :class="{ 'fx-entrada-erro': errosCampo.cnpj }"
              inputmode="numeric"
              placeholder="00.000.000/0000-00"
              @input="form.cnpj = formatarCnpj($event.target.value)"
            />
            <span v-if="errosCampo.cnpj" class="fx-erro-campo">{{ errosCampo.cnpj }}</span>
          </label>
          <label class="fx-campo">
            Telefone
            <input v-model="form.telefone" class="fx-entrada" inputmode="tel" />
          </label>
        </div>
        <label class="fx-campo">
          Razão social
          <input v-model="form.nome" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.nome }" />
          <span v-if="errosCampo.nome" class="fx-erro-campo">{{ errosCampo.nome }}</span>
        </label>
        <div class="fx-grade">
          <label class="fx-campo">
            Nome fantasia
            <input v-model="form.nomeFantasia" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.nomeFantasia }" />
            <span v-if="errosCampo.nomeFantasia" class="fx-erro-campo">{{ errosCampo.nomeFantasia }}</span>
          </label>
          <label class="fx-campo">
            Tipo de serviço
            <input v-model="form.tipoServico" class="fx-entrada" placeholder="Ex.: Diagnóstico por imagem" />
          </label>
        </div>
        <label class="fx-campo">
          Endereço
          <input v-model="form.endereco" class="fx-entrada" />
        </label>
        <label class="fx-check ativa">
          <input v-model="form.ativa" type="checkbox" />
          OCS ativa
        </label>
        <p class="fx-suave">Os contratos (procedimento, valor e vigência) são cadastrados na tela Contratos.</p>
      </div>

      <div class="fx-modal-rodape">
        <button type="button" class="fx-botao-secundario" @click="emit('fechar')">Cancelar</button>
        <button type="submit" class="fx-botao" :disabled="salvando">
          {{ salvando ? 'Salvando...' : 'Salvar' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.ativa {
  align-self: flex-start;
}
</style>
