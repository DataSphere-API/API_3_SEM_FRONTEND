<script setup>
import { ref, computed } from 'vue'
import { darBaixaPorQr } from '../../../services/atendimentoService.js'
import { formatarData } from '../../../utils/documentos.js'

const props = defineProps({
  dados: { type: Object, required: true },
  codigo: { type: String, required: true }
})

const emit = defineEmits(['baixa-confirmada'])

const carregando = ref(false)
const erro = ref('')

const percentual = computed(() => {
  const autorizada = props.dados.qtdAutorizada || 1
  return Math.min(100, ((props.dados.qtdRealizada || 0) / autorizada) * 100)
})

async function confirmarBaixa() {
  erro.value = ''
  carregando.value = true
  try {
    const resposta = await darBaixaPorQr(props.codigo)
    emit('baixa-confirmada', resposta)
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível dar a baixa.'
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <section class="fx-cartao conferencia">
    <h2 class="fx-secao-titulo">Conferência do atendimento</h2>

    <dl class="dados">
      <div>
        <dt>Beneficiário</dt>
        <dd>{{ dados.beneficiario?.nome }} <span class="fx-suave fx-mono">· Prec-CP {{ dados.beneficiario?.precCp }}</span></dd>
      </div>
      <div>
        <dt>Procedimento</dt>
        <dd>{{ dados.procedimento }}</dd>
      </div>
      <div>
        <dt>Guia · atendimento</dt>
        <dd class="fx-mono">{{ dados.guiaId }} · {{ dados.atendimentoId }}</dd>
      </div>
      <div>
        <dt>Válida até</dt>
        <dd>{{ formatarData(dados.dataValidade) }}</dd>
      </div>
    </dl>

    <div>
      <div class="fx-suave">{{ dados.qtdRealizada }}/{{ dados.qtdAutorizada }} sessões</div>
      <div class="fx-progresso">
        <div class="fx-progresso-preenchido" :style="{ width: `${percentual}%` }"></div>
      </div>
    </div>

    <p v-if="!dados.prontoParaBaixa" class="fx-alerta fx-alerta-ambar">
      Ainda faltam sessões. Registre-as na tela de Atendimentos antes da baixa final.
    </p>
    <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

    <div class="fx-acoes">
      <button type="button" class="fx-botao" :disabled="carregando || !dados.prontoParaBaixa" @click="confirmarBaixa">
        {{ carregando ? 'Confirmando...' : 'Confirmar baixa final' }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.conferencia {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dados {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem 1.25rem;
}

.dados dt {
  font-size: 0.8rem;
  color: var(--fx-texto-suave);
}

.dados dd {
  margin: 0.2rem 0 0;
}
</style>
