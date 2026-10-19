<script setup>
import { ref } from 'vue'
import PainelValidacaoPreGuia from './PainelValidacaoPreGuia.vue'
import { aprovarPreGuia, reprovarPreGuia, emitirPreGuia } from '../../../services/preGuiaService.js'

const props = defineProps({
  preGuia: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['fechar', 'atualizar'])

const carregando = ref(false)
const erro = ref('')
const erroModal = ref('')
const exibirModalReprovacao = ref(false)
const motivoReprovacao = ref('')

function podeAprovarReprovar() {
  return props.preGuia?.status === 'VALIDADA'
}

function podeEmitir() {
  return props.preGuia?.status === 'APROVADA'
}

async function executarAprovar() {
  carregando.value = true
  erro.value = ''
  try {
    await aprovarPreGuia(props.preGuia.id)
    emit('atualizar')
  } catch (err) {
    erro.value = err.mensagemUsuario || 'Erro ao aprovar pré-guia.'
  } finally {
    carregando.value = false
  }
}

function abrirModalReprovacao() {
  motivoReprovacao.value = ''
  erroModal.value = ''
  exibirModalReprovacao.value = true
}

async function executarReprovar() {
  if (!motivoReprovacao.value.trim()) {
    erroModal.value = 'O motivo da reprovação é obrigatório.'
    return
  }
  carregando.value = true
  erroModal.value = ''
  try {
    await reprovarPreGuia(props.preGuia.id, motivoReprovacao.value)
    exibirModalReprovacao.value = false
    motivoReprovacao.value = ''
    emit('atualizar')
  } catch (err) {
    erroModal.value = err.mensagemUsuario || 'Erro ao reprovar pré-guia.'
  } finally {
    carregando.value = false
  }
}

async function executarEmitir() {
  carregando.value = true
  erro.value = ''
  try {
    await emitirPreGuia(props.preGuia.id)
    emit('atualizar')
  } catch (err) {
    erro.value = err.mensagemUsuario || 'Erro ao emitir guia definitiva.'
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <div class="fx-cartao detalhe-container">
    <div class="detalhe-topo">
      <h3>Detalhes da Pré-Guia</h3>
      <span class="fx-selo" :class="'fx-selo-' + (preGuia.status === 'APROVADA' ? 'verde' : 'ambar')">
        {{ preGuia.status }}
      </span>
    </div>

    <p><strong>Número:</strong> {{ preGuia.numero }}</p>
    <p><strong>Beneficiário:</strong> {{ preGuia.beneficiario }}</p>

    <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

    <div class="acoes-chefe">
      <button
        v-if="podeAprovarReprovar()"
        type="button"
        class="fx-botao"
        :disabled="carregando"
        @click="executarAprovar"
      >
        Aprovar Pré-Guia
      </button>

      <button
        v-if="podeAprovarReprovar()"
        type="button"
        class="fx-botao-secundario btn-reprovar"
        :disabled="carregando"
        @click="abrirModalReprovacao"
      >
        Reprovar
      </button>

      <button
        v-if="podeEmitir()"
        type="button"
        class="fx-botao"
        :disabled="carregando"
        @click="executarEmitir"
      >
        Emitir Guia Definitiva
      </button>
    </div>

    <PainelValidacaoPreGuia
      :pre-guia="preGuia"
      @atualizar="$emit('atualizar')"
    />

    <!-- Modal de Reprovação com a mensagem de erro posicionada corretamente dentro dele -->
    <div v-if="exibirModalReprovacao" class="fx-modal-fundo">
      <div class="fx-modal">
        <div class="fx-modal-topo">
          <h2>Reprovar Pré-Guia</h2>
          <button type="button" class="fx-fechar" @click="exibirModalReprovacao = false">&times;</button>
        </div>
        <div class="fx-modal-corpo">
          <p v-if="erroModal" class="fx-alerta fx-alerta-vermelho" role="alert">
            {{ erroModal }}
          </p>
          <label class="fx-campo">
            Motivo da reprovação (Obrigatório):
            <textarea
              v-model="motivoReprovacao"
              class="fx-entrada textarea-motivo"
              placeholder="Digite o motivo detalhado..."
              rows="4"
            ></textarea>
          </label>
        </div>
        <div class="fx-modal-rodape">
          <button type="button" class="fx-botao-secundario" @click="exibirModalReprovacao = false">Cancelar</button>
          <button type="button" class="fx-botao btn-confirmar-reprovar" @click="executarReprovar" :disabled="carregando">
            Confirmar Reprovação
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detalhe-container {
  margin-top: 1rem;
}
.detalhe-topo {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.acoes-chefe {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--fx-borda);
}
.btn-reprovar {
  border-color: #a3261b;
  color: #a3261b;
}
.textarea-motivo {
  height: auto;
  padding: 0.5rem;
  font-family: inherit;
}
</style>