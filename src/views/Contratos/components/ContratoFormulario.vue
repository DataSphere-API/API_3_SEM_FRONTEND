<script setup>
import { reactive, ref, computed } from 'vue'
import { salvarContrato } from '../../../services/contratoService.js'

const props = defineProps({
  contrato: { type: Object, default: null },
  ocs: { type: Array, required: true },
  procedimentos: { type: Array, required: true }
})

const emit = defineEmits(['fechar', 'salvo'])

const editando = computed(() => Boolean(props.contrato))

const form = reactive({
  numero: props.contrato?.numero || '',
  ocsCnpj: props.contrato?.ocsCnpj || '',
  procedimentoId: props.contrato?.procedimentoId || '',
  valor: props.contrato?.valor ?? '',
  inicioVigencia: props.contrato?.inicioVigencia || '',
  fimVigencia: props.contrato?.fimVigencia || ''
})

const errosCampo = ref({})
const erro = ref('')
const salvando = ref(false)

function validar() {
  const erros = {}
  if (!form.numero.trim()) erros.numero = 'Informe o número do contrato.'
  if (!form.ocsCnpj) erros.ocsCnpj = 'Escolha a OCS.'
  if (!form.procedimentoId) erros.procedimentoId = 'Escolha o procedimento.'
  if (!(Number(form.valor) > 0)) erros.valor = 'O valor precisa ser maior que zero.'
  if (!form.inicioVigencia) erros.inicioVigencia = 'Informe o início.'
  if (!form.fimVigencia) erros.fimVigencia = 'Informe o fim.'
  else if (form.inicioVigencia && form.fimVigencia < form.inicioVigencia) erros.fimVigencia = 'O fim não pode ser antes do início.'
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
      numero: form.numero.trim(),
      procedimentoId: Number(form.procedimentoId),
      valor: Number(form.valor)
    }
    emit('salvo', await salvarContrato(dados, props.contrato?.id ?? null))
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível salvar o contrato.'
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <div class="fx-modal-fundo" @click.self="emit('fechar')">
    <form class="fx-modal" novalidate @submit.prevent="salvar">
      <div class="fx-modal-topo">
        <div>
          <h2>{{ editando ? 'Editar contrato' : 'Novo contrato' }}</h2>
          <p>Valor que o FUSEx paga por um procedimento numa OCS.</p>
        </div>
        <button type="button" class="fx-fechar" aria-label="Fechar" @click="emit('fechar')">&times;</button>
      </div>

      <div class="fx-modal-corpo">
        <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

        <label class="fx-campo">
          Nº do contrato
          <input v-model="form.numero" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.numero }" placeholder="CT 000/2026" />
          <span v-if="errosCampo.numero" class="fx-erro-campo">{{ errosCampo.numero }}</span>
        </label>
        <label class="fx-campo">
          OCS
          <select v-model="form.ocsCnpj" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.ocsCnpj }">
            <option value="" disabled>Escolha a OCS</option>
            <option v-for="o in ocs" :key="o.cnpj" :value="o.cnpj">{{ o.nomeFantasia }}</option>
          </select>
          <span v-if="errosCampo.ocsCnpj" class="fx-erro-campo">{{ errosCampo.ocsCnpj }}</span>
        </label>
        <label class="fx-campo">
          Procedimento
          <select v-model="form.procedimentoId" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.procedimentoId }">
            <option value="" disabled>Escolha o procedimento</option>
            <option v-for="p in procedimentos" :key="p.id" :value="p.id">{{ p.nome }}</option>
          </select>
          <span v-if="errosCampo.procedimentoId" class="fx-erro-campo">{{ errosCampo.procedimentoId }}</span>
        </label>
        <label class="fx-campo">
          Valor (R$)
          <input v-model="form.valor" type="number" min="0.01" step="0.01" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.valor }" />
          <span v-if="errosCampo.valor" class="fx-erro-campo">{{ errosCampo.valor }}</span>
        </label>
        <div class="fx-grade">
          <label class="fx-campo">
            Início da vigência
            <input v-model="form.inicioVigencia" type="date" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.inicioVigencia }" />
            <span v-if="errosCampo.inicioVigencia" class="fx-erro-campo">{{ errosCampo.inicioVigencia }}</span>
          </label>
          <label class="fx-campo">
            Fim da vigência
            <input v-model="form.fimVigencia" type="date" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.fimVigencia }" />
            <span v-if="errosCampo.fimVigencia" class="fx-erro-campo">{{ errosCampo.fimVigencia }}</span>
          </label>
        </div>
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
