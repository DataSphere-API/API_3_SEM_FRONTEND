<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  preGuias: {
    type: Array,
    required: true,
    default: () => []
  }
})

const emit = defineEmits(['abrir'])

const termoBusca = ref('')

const PRIORIDADE_STATUS = {
  COM_PENDENCIAS: 1,
  'COM PENDÊNCIAS': 1,
  RASCUNHO: 2,
  PRE_GUIA: 2,
  VALIDADA: 3,
  AGUARDANDO_APROVACAO: 4,
  'AGUARDANDO APROVAÇÃO': 4,
  APROVADA: 5,
  EMITIDA: 6,
  REPROVADA: 7
}

function obterPesoPrioridade(item) {
  const status = (item.status || item.situacao || '').toUpperCase().trim()
  return PRIORIDADE_STATUS[status] ?? 99
}

const preGuiasFiltradasEOrdenadas = computed(() => {
  const busca = termoBusca.value.toLowerCase().trim()

  return [...props.preGuias]
    .filter((item) => {
      if (!busca) return true
      const nome = (item.beneficiario?.nome || item.beneficiario || '').toLowerCase()
      const precCp = (item.beneficiario?.precCp || item.precCp || '').toLowerCase()
      return nome.includes(busca) || precCp.includes(busca)
    })
    .sort((a, b) => {
      const diffPrioridade = obterPesoPrioridade(a) - obterPesoPrioridade(b)
      if (diffPrioridade !== 0) return diffPrioridade
      return (b.id || 0) - (a.id || 0)
    })
})

function obterClasseSelo(status) {
  const s = (status || '').toUpperCase()
  switch (s) {
    case 'APROVADA':
    case 'VALIDADA':
      return 'fx-selo-verde'
    case 'REPROVADA':
      return 'fx-selo-vermelho'
    case 'COM_PENDENCIAS':
    case 'COM PENDÊNCIAS':
    case 'PRE_GUIA':
    case 'RASCUNHO':
      return 'fx-selo-ambar'
    case 'EMITIDA':
      return 'fx-selo-azul'
    default:
      return 'fx-selo-cinza'
  }
}
</script>

<template>
  <div class="container-lista-pre-guias">
    <div class="barra-busca">
      <input
        v-model="termoBusca"
        type="text"
        class="fx-entrada"
        placeholder="Buscar por nome do beneficiário ou Prec-CP..."
      />
      <button
        v-if="termoBusca"
        type="button"
        class="fx-botao-secundario"
        @click="termoBusca = ''"
      >
        Limpar
      </button>
    </div>

    <ul class="fx-lista">
      <li
        v-for="guia in preGuiasFiltradasEOrdenadas"
        :key="guia.id"
        class="fx-cartao item-lista"
      >
        <div class="info-topo">
          <span class="fx-mono"><strong>{{ guia.numero || guia.id }}</strong></span>
          <span class="fx-selo" :class="obterClasseSelo(guia.status || guia.situacao)">
            {{ guia.status || guia.situacao }}
          </span>
        </div>
        <p class="beneficiario">Beneficiário: {{ guia.beneficiario?.nome || guia.beneficiario }}</p>
        <div class="rodape-card">
          <span v-if="guia.pendencias && guia.pendencias.length > 0" class="fx-suave">
            {{ guia.pendencias.length }} pendência(s) encontrada(s)
          </span>
          <span v-else class="fx-suave">Sem pendências</span>

          <button type="button" class="fx-botao btn-detalhes" @click="$emit('abrir', guia.id || guia)">
            Detalhes
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.container-lista-pre-guias {
  margin-top: 1rem;
}
.barra-busca {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}
.barra-busca input {
  max-width: 450px;
  width: 100%;
}
.item-lista {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  margin-bottom: 0.75rem;
}
.item-lista:hover {
  border-color: var(--fx-verde);
  box-shadow: 0 2px 6px rgba(30, 77, 54, 0.08);
}
.info-topo {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.beneficiario {
  margin: 0;
  font-size: 0.95rem;
  color: var(--fx-texto-suave);
}
.rodape-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--fx-borda);
}
.btn-detalhes {
  background-color: var(--fx-verde);
  color: #ffffff;
  border: 1px solid var(--fx-verde);
  padding: 0.4rem 1rem;
  font-size: 0.85rem;
  min-height: 36px;
}
.btn-detalhes:hover {
  background-color: var(--fx-verde-escuro);
}
</style>