<script setup>
import { ref } from 'vue'

const emit = defineEmits(['qr-lido'])

const codigo = ref('')
const cnpj = ref('')
const erroCodigo = ref('')
const erroCnpj = ref('')

function submeter() {
  erroCodigo.value = ''
  erroCnpj.value = ''
  let valido = true

  const codLimpo = codigo.value.trim()
  const cnpjLimpo = cnpj.value.trim()

  if (!codLimpo) {
    erroCodigo.value = 'Informe o código do QR.'
    valido = false
  }

  if (!cnpjLimpo || cnpjLimpo.length !== 14) {
    erroCnpj.value = 'O CNPJ da OCS deve conter exatamente 14 dígitos.'
    valido = false
  }

  if (!valido) return

  emit('qr-lido', { codigo: codLimpo, cnpj: cnpjLimpo })
}
</script>

<template>
  <form class="fx-cartao" @submit.prevent="submeter">
    <h2 class="fx-titulo" style="font-size: 1.2rem;">Validação de Atendimento por QR Code</h2>

    <label class="fx-campo">
      Código do QR
      <input
        v-model="codigo"
        type="text"
        class="fx-entrada"
        :class="{ 'fx-entrada-erro': erroCodigo }"
        placeholder="Digite o código do QR"
        autocomplete="off"
      />
      <span v-if="erroCodigo" class="fx-erro-campo">{{ erroCodigo }}</span>
    </label>

    <label class="fx-campo">
      CNPJ da OCS
      <input
        v-model="cnpj"
        type="text"
        class="fx-entrada"
        :class="{ 'fx-entrada-erro': erroCnpj }"
        placeholder="Ex.: 12345678000199"
        maxlength="14"
        autocomplete="off"
      />
      <span v-if="erroCnpj" class="fx-erro-campo">{{ erroCnpj }}</span>
    </label>

    <button type="submit" class="fx-botao">Consultar QR Code</button>
  </form>
</template>