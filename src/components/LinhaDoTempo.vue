<script setup>
import { formatarDataHora } from '../utils/documentos.js'
import {
  tituloDoEvento,
  traduzirEntidadeHistorico,
  traduzirOrigemHistorico,
  traduzirStatusHistorico
} from '../utils/historico.js'

// Recebe { eventos } com a lista de HistoricoStatusResponse do back.
defineProps({
  linhaDoTempo: { type: Object, required: true }
})
</script>

<template>
  <div class="container-linha-tempo">
    <p v-if="!linhaDoTempo.eventos || linhaDoTempo.eventos.length === 0" class="fx-suave vazio">
      Nenhuma mudança registrada.
    </p>

    <ol v-else class="linha">
      <li v-for="(e, i) in linhaDoTempo.eventos" :key="e.id ?? `${e.entidadeId}-${e.data}-${i}`" class="evento">
        <span class="marcador" aria-hidden="true"></span>
        <div>
          <div class="titulo-evento">
            <strong>{{ tituloDoEvento(e) }}</strong>
            <span v-if="traduzirEntidadeHistorico(e.entidadeTipo)" class="fx-selo fx-selo-cinza entidade">
              {{ traduzirEntidadeHistorico(e.entidadeTipo) }}
            </span>
          </div>

          <div class="status-evento">
            {{ traduzirStatusHistorico(e.statusNovo) }}
            <span v-if="e.statusAnterior" class="fx-suave">(antes: {{ traduzirStatusHistorico(e.statusAnterior) }})</span>
          </div>

          <div class="fx-suave meta">
            {{ formatarDataHora(e.data) }} · {{ traduzirOrigemHistorico(e.origem) }}
            <template v-if="e.usuarioNome"> · por {{ e.usuarioNome }}</template>
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.container-linha-tempo {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.linha { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 1rem; }
.evento { display: flex; gap: 0.75rem; align-items: flex-start; }
.marcador { flex: none; width: 10px; height: 10px; margin-top: 0.4rem; border-radius: 50%; background-color: var(--fx-verde); }
.titulo-evento { display: flex; align-items: center; gap: 0.5rem; }
.status-evento { font-weight: 500; margin-top: 0.2rem; }
.meta { font-size: 0.85em; margin-top: 0.2rem; }
</style>