<script setup>
import { formatarDataHora, formatarData } from '../utils/documentos.js'
import {
  traduzirEntidadeHistorico,
  traduzirOrigemHistorico,
  traduzirStatusHistorico,
  traduzirEtapaLinhaDoTempo
} from '../utils/historico.js'

// Agora recebemos o objeto completo do backend
defineProps({
  linhaDoTempo: { type: Object, required: true }
})
</script>

<template>
  <div class="container-linha-tempo">
    <!-- Cabeçalho com informações atuais -->
    <div v-if="linhaDoTempo.statusAtual" class="cabecalho fx-suave">
      <p><strong>Status atual:</strong> {{ traduzirStatusHistorico(linhaDoTempo.statusAtual) }}</p>
      <p v-if="linhaDoTempo.dataEmissao"><strong>Emissão:</strong> {{ formatarData(linhaDoTempo.dataEmissao) }}</p>
    </div>

    <!-- Lista de Eventos -->
    <p v-if="!linhaDoTempo.eventos || linhaDoTempo.eventos.length === 0" class="fx-suave vazio">
      Nenhuma mudança registrada.
    </p>

    <ol v-else class="linha">
      <!-- Usamos entidadeId + data como fallback para o :key caso não tenha id -->
      <li v-for="(e, i) in linhaDoTempo.eventos" :key="`${e.entidadeId}-${e.data}-${i}`" class="evento">
        <span class="marcador" aria-hidden="true"></span>
        <div>
          <div class="titulo-evento">
            <strong>{{ traduzirEtapaLinhaDoTempo(e.etapa) }}</strong>
            <span class="fx-selo fx-selo-cinza entidade" v-if="traduzirEntidadeHistorico(e.entidadeTipo)">
              {{ traduzirEntidadeHistorico(e.entidadeTipo) }}
            </span>
          </div>

          <div class="status-evento">
            {{ traduzirStatusHistorico(e.statusNovo) }}
            <span v-if="e.statusAnterior" class="fx-suave">(antes: {{ traduzirStatusHistorico(e.statusAnterior) }})</span>
          </div>

          <p v-if="e.descricao" class="descricao">{{ e.descricao }}</p>

          <div class="fx-suave meta">{{ formatarDataHora(e.data) }} · {{ traduzirOrigemHistorico(e.origem) }}</div>
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

.cabecalho {
  padding: 0.75rem;
  background-color: var(--fx-cinza-claro, #f3f4f6);
  border-radius: 8px;
  border-left: 4px solid var(--fx-verde);
}
.cabecalho p { margin: 0; }
.cabecalho p + p { margin-top: 0.25rem; }

.linha { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 1rem; }
.evento { display: flex; gap: 0.75rem; align-items: flex-start; }
.marcador { flex: none; width: 10px; height: 10px; margin-top: 0.4rem; border-radius: 50%; background-color: var(--fx-verde); }
.titulo-evento { display: flex; align-items: center; gap: 0.5rem; }
.status-evento { font-weight: 500; margin-top: 0.2rem; }
.descricao { margin: 0.25rem 0; font-size: 0.9em; line-height: 1.4; }
.meta { font-size: 0.85em; margin-top: 0.2rem; }
</style>