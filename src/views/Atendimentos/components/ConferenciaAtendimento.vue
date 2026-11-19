<script setup>
import { ref } from 'vue'

const props = defineProps({
  atendimento: Object,
  qrCodeUrl: String // URL da imagem do QR Code gerada pelo backend ou mock
})

const emit = defineEmits(['baixaConfirmada'])

const carregando = ref(false)
const erro = ref('')
const sucesso = ref('')
const copiado = ref(false)

function copiarCodigoManual(codigo) {
  navigator.clipboard.writeText(codigo)
  copiado.value = true
  setTimeout(() => {
    copiado.value = false
  }, 2500)
}

async function registrarSessao() {
  erro.value = ''
  sucesso.value = ''
  carregando.value = true
  try {
    sucesso.value = 'Sessão registrada com sucesso!'
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Erro ao registrar sessão.'
  } finally {
    carregando.value = false
  }
}

async function confirmarBaixa() {
  erro.value = ''
  sucesso.value = ''

  if (!props.atendimento?.prontoParaBaixa) {
    erro.value = 'Sessões incompletas ou procedimento não elegível para baixa.'
    return
  }

  carregando.value = true
  try {
    emit('baixaConfirmada', props.atendimento)
    sucesso.value = 'Baixa confirmada com sucesso!'
  } catch (e) {
    const tipoErro = e.response?.data?.codigo || ''
    if (tipoErro === 'QR_INVALIDO') erro.value = 'QR inválido.'
    else if (tipoErro === 'JA_UTILIZADO') erro.value = 'QR Code já utilizado.'
    else if (tipoErro === 'OCS_DIFERENTE') erro.value = 'OCS diferente da autorizada.'
    else if (tipoErro === 'GUIA_VENCIDA') erro.value = 'Guia vencida.'
    else erro.value = e.mensagemUsuario || 'Erro ao confirmar baixa.'
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <div class="fx-cartao conferencia-container">
    <header>
      <h3>Conferência do Atendimento</h3>
      <p class="fx-suave">Progresso: {{ atendimento?.qtdRealizada || 0 }} / {{ atendimento?.qtdAutorizada || 0 }} sessões</p>
    </header>

    <div class="fx-progresso">
      <div
        class="fx-progresso-preenchido"
        :style="{ width: `${((atendimento?.qtdRealizada || 0) / (atendimento?.qtdAutorizada || 1)) * 100}%` }"
      ></div>
    </div>

    <!-- Área visível do QR Code e Código Manual -->
    <div class="area-validacao-dual">
      <div class="container-qrcode">
        <img
          :src="qrCodeUrl || 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + (atendimento?.codigoManual || 'GUIA-DEFAULT')"
          alt="QR Code do Atendimento"
        />
      </div>

      <div class="bloco-manual">
        <label class="fx-campo">
          <span class="fx-suave">Caso o leitor falhe, digite ou copie o código:</span>
          <div class="input-com-copia">
            <input
              type="text"
              class="fx-entrada fx-mono"
              readonly
              :value="atendimento?.codigoManual || 'ATEND-9823-XYZ7'"
            />
            <button
              type="button"
              class="fx-botao-secundario"
              @click="copiarCodigoManual(atendimento?.codigoManual || 'ATEND-9823-XYZ7')"
            >
              {{ copiado ? 'Copiado!' : 'Copiar' }}
            </button>
          </div>
        </label>
      </div>
    </div>

    <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>
    <p v-if="sucesso" class="fx-alerta fx-alerta-verde" role="status">{{ sucesso }}</p>

    <div class="fx-acoes">
      <button
        type="button"
        class="fx-botao-secundario"
        :disabled="carregando"
        @click="registrarSessao"
      >
        Registrar sessão
      </button>

      <button
        type="button"
        class="fx-botao"
        :disabled="carregando || !atendimento?.prontoParaBaixa"
        @click="confirmarBaixa"
      >
        Confirmar baixa
      </button>
    </div>
  </div>
</template>

<style scoped>
.conferencia-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.area-validacao-dual {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: center;
  background: var(--fx-fundo-claro, #f9f9f9);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--fx-borda, #ddd);
}

.container-qrcode img {
  width: 140px;
  height: 140px;
  object-fit: contain;
  background: #fff;
  padding: 6px;
  border: 1px solid var(--fx-borda, #ddd);
  border-radius: 6px;
}

.bloco-manual {
  flex: 1;
  min-width: 220px;
}

.input-com-copia {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.25rem;
}

.fx-acoes {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}
</style>