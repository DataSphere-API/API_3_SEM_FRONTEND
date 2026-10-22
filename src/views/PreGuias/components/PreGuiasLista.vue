<script setup>
defineProps({
  preGuias: {
    type: Array,
    required: true
  }
})

defineEmits(['abrir'])

function obterClasseSelo(status) {
  switch (status) {
    case 'APROVADA':
    case 'VALIDADA':
      return 'fx-selo-verde'
    case 'REPROVADA':
      return 'fx-selo-vermelho'
    case 'COM_PENDENCIAS':
    case 'PRE_GUIA':
      return 'fx-selo-ambar'
    case 'EMITIDA':
      return 'fx-selo-azul'
    default:
      return 'fx-selo-cinza'
  }
}
</script>

<template>
  <ul class="fx-lista">
    <li
      v-for="guia in preGuias"
      :key="guia.id"
      class="fx-cartao item-lista"
    >
      <div class="info-topo">
        <span class="fx-mono"><strong>{{ guia.numero }}</strong></span>
        <span class="fx-selo" :class="obterClasseSelo(guia.status)">
          {{ guia.status }}
        </span>
      </div>
      <p class="beneficiario">Beneficiário: {{ guia.beneficiario }}</p>
      <div class="rodape-card">
        <span v-if="guia.pendencias && guia.pendencias.length > 0" class="fx-suave">
          {{ guia.pendencias.length }} pendência(s) encontrada(s)
        </span>
        <span v-else class="fx-suave">Sem pendências</span>

        <button type="button" class="fx-botao btn-detalhes" @click="$emit('abrir', guia.id)">
          Ver detalhes
        </button>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.item-lista {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
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