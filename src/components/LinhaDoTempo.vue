<script setup>
import { formatarDataHora } from '../utils/documentos.js'
import {
  traduzirEntidadeHistorico,
  traduzirOrigemHistorico,
  traduzirStatusHistorico
} from '../utils/historico.js'

// eventos no formato do HistoricoStatusResponse.
defineProps({
  eventos: { type: Array, required: true }
})
</script>

<template>
  <p v-if="eventos.length === 0" class="fx-suave vazio">Nenhuma mudança registrada.</p>
  <ol v-else class="linha">
    <li v-for="(e, i) in eventos" :key="`${e.id}-${i}`" class="evento">
      <span class="marcador" aria-hidden="true"></span>
      <div>
        <strong>{{ traduzirStatusHistorico(e.statusNovo) }}</strong>
        <span v-if="traduzirEntidadeHistorico(e.entidadeTipo)" class="fx-selo fx-selo-cinza entidade">
          {{ traduzirEntidadeHistorico(e.entidadeTipo) }}
        </span>
        <span v-if="e.statusAnterior" class="fx-suave"> (antes: {{ traduzirStatusHistorico(e.statusAnterior) }})</span>
        <div class="fx-suave">{{ formatarDataHora(e.data) }} · {{ traduzirOrigemHistorico(e.origem) }}</div>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.vazio {
  margin: 0;
}

.linha {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.evento {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.marcador {
  flex: none;
  width: 10px;
  height: 10px;
  margin-top: 0.4rem;
  border-radius: 50%;
  background-color: var(--fx-verde);
}

.entidade {
  margin-left: 0.4rem;
}
</style>