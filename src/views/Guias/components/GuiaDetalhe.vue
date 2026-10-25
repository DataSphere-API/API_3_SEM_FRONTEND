<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  visivel: Boolean,
  procedimento: Object,
  urlQrCode: String
})

const emit = defineEmits(['fechar'])
const copiado = ref(false)
const ampliado = ref(false)

const sessoesRestantes = computed(() => {
  if (!props.procedimento) return 0
  return (props.procedimento.qtdAutorizada || 0) - (props.procedimento.qtdRealizada || 0)
})

const deveExibirQr = computed(() => {
  if (!props.procedimento) return false
  const status = props.procedimento.status
  const realizado = sessoesRestantes.value <= 0
  const expirado = status === 'EXPIRADO' || status === 'REALIZADO'

  return !realizado && !expirado
})

function copiarCodigo(codigo) {
  navigator.clipboard.writeText(codigo)
  copiado.value = true
  setTimeout(() => {
    copiado.value = false
  }, 2500)
}

// Função para baixar a imagem do QR Code automaticamente
async function baixarQrCode() {
  try {
    const response = await fetch(props.urlQrCode)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `qrcode-${props.procedimento?.atendimentoId || 'procedimento'}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (e) {
    console.error('Erro ao baixar QR Code', e)
    window.open(props.urlQrCode, '_blank')
  }
}
</script>

<template>
  <div v-if="visivel" class="modal-overlay">
    <div class="fx-cartao modal-conteudo">
      <header class="modal-cabecalho">
        <h2>Detalhe do Procedimento</h2>
        <button type="button" class="fx-botao-secundario" @click="emit('fechar')">✕</button>
      </header>

      <div class="conteudo-qr">
        <p><strong>{{ procedimento?.nome }}</strong></p>
        <p class="fx-suave">
          Sessões realizadas: {{ procedimento?.qtdRealizada || 0 }} / {{ procedimento?.qtdAutorizada || 0 }}
        </p>

        <template v-if="deveExibirQr">
          <div class="container-qrcode" :class="{ 'qrcode-ampliado': ampliado }" @click="ampliado = false">
            <img :src="urlQrCode" alt="QR Code do Atendimento" />
          </div>
          <span v-if="ampliado" class="fx-suave dica-fechar">Clique na imagem para fechar o zoom</span>

          <div class="fx-acoes">
            <button type="button" class="fx-botao" @click="ampliado = !ampliado">
              {{ ampliado ? 'Reduzir' : 'Ampliar' }}
            </button>
            <button type="button" class="fx-botao-secundario" @click="baixarQrCode">
              Baixar PNG
            </button>
          </div>

          <div class="bloco-manual">
            <label class="fx-campo">
              <span class="fx-suave">Código para digitação manual (caso a leitura falhe):</span>
              <div class="input-com-copia">
                <input
                  type="text"
                  class="fx-entrada fx-mono"
                  readonly
                  :value="procedimento?.codigoManual || procedimento?.atendimentoId || 'ATEND-9823-XYZ7'"
                />
                <button
                  type="button"
                  class="fx-botao-secundario"
                  @click="copiarCodigo(procedimento?.codigoManual || procedimento?.atendimentoId || 'ATEND-9823-XYZ7')"
                >
                  {{ copiado ? 'Copiado!' : 'Copiar' }}
                </button>
              </div>
            </label>
          </div>
        </template>

        <template v-else>
          <div class="fx-alerta fx-alerta-cinza">
            <template v-if="sessoesRestantes > 0">
              Faltam {{ sessoesRestantes }} sessão(ões) para este procedimento.
            </template>
            <template v-else>
              Procedimento concluído ou expirado. QR Code indisponível.
            </template>
          </div>
        </template>

      </div>

      <div class="rodape-modal">
        <button type="button" class="fx-botao-secundario" @click="emit('fechar')">Fechar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal-conteudo {
  background: #fff; width: 100%; max-width: 450px;
  padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;
}
.modal-cabecalho { display: flex; justify-content: space-between; align-items: center; }
.conteudo-qr { display: flex; flex-direction: column; align-items: center; gap: 1rem; text-align: center; }
.container-qrcode img { width: 180px; height: 180px; object-fit: contain; border: 1px solid var(--fx-borda); padding: 6px; border-radius: 6px; cursor: pointer; transition: transform 0.2s; }
.container-qrcode.qrcode-ampliado {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 2000;
}
.container-qrcode.qrcode-ampliado img {
  width: 320px; height: 320px; background: #fff; padding: 1rem; border-radius: 8px;
}
.dica-fechar { font-size: 0.75rem; color: #666; margin-top: -0.5rem; }
.bloco-manual { width: 100%; text-align: left; margin-top: 0.5rem; border-top: 1px solid var(--fx-borda); padding-top: 1rem; }
.input-com-copia { display: flex; gap: 0.5rem; align-items: center; margin-top: 0.25rem; }
.rodape-modal { display: flex; justify-content: flex-end; margin-top: 0.5rem; }
</style>