<script setup>
defineProps({
  preGuia: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['fechar', 'editar', 'enviar', 'atualizar'])

function permiteEditarOuEnviar(preGuia) {
  const status = (preGuia?.status || preGuia?.situacao || '').toUpperCase().trim()
  return ['RASCUNHO', 'PRE_GUIA', 'COM_PENDENCIAS', 'COM PENDÊNCIAS'].includes(status)
}
</script>

<template>
  <div class="fx-cartao detalhe-container">
    <div class="detalhe-topo">
      <h3>Detalhes da Pré-Guia</h3>
      <button type="button" class="fx-fechar" @click="emit('fechar')">&times;</button>
    </div>

    <p><strong>Número:</strong> {{ preGuia.numero }}</p>
    <p><strong>Beneficiário:</strong> {{ preGuia.beneficiario }}</p>
    <p><strong>Situação:</strong> {{ preGuia.status || preGuia.situacao }}</p>

    <div
      v-if="permiteEditarOuEnviar(preGuia)"
      class="modal-acoes-rodape"
    >
      <button
        type="button"
        class="fx-botao-secundario"
        @click="emit('editar', preGuia)"
      >
        Editar
      </button>

      <button
        type="button"
        class="fx-botao"
        @click="emit('enviar', preGuia)"
      >
        Enviar
      </button>
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
  margin-bottom: 1rem;
}
.modal-acoes-rodape {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}
</style>