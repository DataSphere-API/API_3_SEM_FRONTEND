<script setup>
import {
  alertaValidade,
  guiaExpirada,
  resumoSessoes,
  rotuloStatus,
  tomStatus
} from '../../../utils/guiaRegras.js'

defineProps({
  guias: {
    type: Array,
    required: true
  }
})

defineEmits(['abrir-guia'])
</script>

<template>
  <ul class="fx-lista">
    <li v-for="(guia, indice) in guias" :key="indice" class="fx-cartao">
      <div class="guia-topo">
        <div class="guia-identificacao">
          <span class="fx-mono guia-numero">{{ guia.numero || 'Guia sem número' }}</span>
          <span class="fx-suave">{{ guia.procedimentos.length }} procedimento(s)</span>
        </div>

        <span class="fx-selo" :class="'fx-selo-' + tomStatus(guia.status)">
          {{ rotuloStatus(guia.status) }}
        </span>
      </div>

      <p v-if="alertaValidade(guia)" class="fx-alerta fx-alerta-ambar" role="alert">
        {{ alertaValidade(guia) }}
      </p>

      <div v-for="(proc, i) in guia.procedimentos" :key="i" class="procedimento">
        <div class="procedimento-linha">
          <span>{{ proc.descricao }}</span>
          <strong>{{ resumoSessoes(proc).texto }}</strong>
        </div>

        <div class="fx-progresso">
          <div
            class="fx-progresso-preenchido"
            :style="{ width: resumoSessoes(proc).percentual + '%' }"
          ></div>
        </div>
      </div>

      <button
        v-if="!guiaExpirada(guia)"
        type="button"
        class="fx-botao"
        @click="$emit('abrir-guia', guia)"
      >
        Ver QR Code
      </button>

      <p v-else class="fx-suave">Guia expirada: sem acesso ao QR Code.</p>
    </li>
  </ul>
</template>

<style scoped>
.guia-topo {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.guia-identificacao {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.guia-numero {
  font-size: 1rem;
  font-weight: 500;
}

.procedimento {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.procedimento-linha {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.9rem;
}

.procedimento-linha strong {
  color: var(--fx-verde);
  white-space: nowrap;
}
</style>