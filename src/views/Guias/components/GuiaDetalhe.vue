<script setup>
import { ref, watch } from 'vue'
import QRCode from 'qrcode'
import { buscarQrCode } from '../../../services/guiasService.js'
// 1. Importando a API e o seu novo componente
import api from '../../../services/api'
import LinhaDoTempo from './LinhaDoTempo.vue'

import {
  alertaValidade,
  resumoSessoes,
  rotuloStatus,
  situacaoQr,
  tomStatus
} from '../../../utils/guiaRegras.js'

const props = defineProps({
  visivel: Boolean,
  procedimento: Object,
  urlQrCode: String
})

defineEmits(['fechar'])

const qrs = ref({})
const ampliado = ref(null)

// 2. Estados para a Linha do Tempo
const linhaDoTempoDados = ref(null)
const carregandoLinhaDoTempo = ref(false)
const erroLinhaDoTempo = ref('')

// Função que busca os dados no backend
async function carregarLinhaDoTempo(guiaId) {
  if (!guiaId) return

  carregandoLinhaDoTempo.value = true
  erroLinhaDoTempo.value = ''
  linhaDoTempoDados.value = null

  try {
    // Chama o endpoint mapeado na US007-2
    const response = await api.get(`/guias/${guiaId}/linha-do-tempo`)
    linhaDoTempoDados.value = response.data
  } catch (erro) {
    console.error('Erro na linha do tempo:', erro)
    erroLinhaDoTempo.value = 'Não foi possível carregar o histórico desta guia.'
  } finally {
    carregandoLinhaDoTempo.value = false
  }
}

async function carregarQr(guiaAtual, atendimentoId) {
  qrs.value = {
    ...qrs.value,
    [atendimentoId]: { carregando: true, erro: '', imagem: '' }
  }

  try {
    const { codigo } = await buscarQrCode(atendimentoId)
    const imagem = await QRCode.toDataURL(codigo, { width: 320, margin: 2 })

    if (props.guia !== guiaAtual) {
      return
    }

    qrs.value = {
      ...qrs.value,
      [atendimentoId]: { carregando: false, erro: '', imagem }
    }
  } catch (erro) {
    if (props.guia !== guiaAtual) {
      return
    }

    qrs.value = {
      ...qrs.value,
      [atendimentoId]: {
        carregando: false,
        erro: erro.mensagemUsuario || 'Não foi possível gerar o QR Code.',
        imagem: ''
      }
    }
  }
}

const QR_NO_ESCOPO = false

const sessoesRestantes = computed(() => {
  if (!props.procedimento) return 0
  return (props.procedimento.qtdAutorizada || 0) - (props.procedimento.qtdRealizada || 0)
})

const deveExibirQr = computed(() => {
  if (!props.procedimento) return false
  const status = props.procedimento.status
  const realizado = sessoesRestantes.value <= 0
  const expirado = status === 'EXPIRADO' || status === 'REALIZADO'

// 3. Atualizando o Watch para buscar os QR Codes e a Linha do Tempo quando abrir o modal
watch([() => props.aberto, () => props.guia], () => {
  carregarQrs()

  if (props.aberto && props.guia) {
    // ATENÇÃO: Verifique se o ID da guia no frontend é props.guia.id ou props.guia.guiaId
    carregarLinhaDoTempo(props.guia.id || props.guia.guiaId)
  } else {
    linhaDoTempoDados.value = null
  }
}, { immediate: true })

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

          <p v-else-if="situacao(proc).mensagem" class="fx-alerta fx-alerta-cinza">{{ situacao(proc).mensagem }}</p>
        </section>

        <!-- 4. Nova seção da Linha do Tempo -->
        <div class="linha-tempo-secao">
          <hr class="divisor" />
          <h3>Histórico da Guia</h3>

          <p v-if="carregandoLinhaDoTempo" class="fx-suave">Carregando histórico...</p>
          <p v-else-if="erroLinhaDoTempo" class="fx-alerta fx-alerta-vermelho">{{ erroLinhaDoTempo }}</p>
          <LinhaDoTempo
            v-else-if="linhaDoTempoDados"
            :linhaDoTempo="linhaDoTempoDados"
          />
        </div>

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

/* 5. Estilos para a seção da Linha do Tempo */
.linha-tempo-secao {
  margin-top: 1.5rem;
}

.divisor {
  border: none;
  border-top: 1px solid var(--fx-borda, #e5e7eb);
  margin-bottom: 1.5rem;
}

.linha-tempo-secao h3 {
  margin-bottom: 1rem;
  color: var(--fx-texto);
}
</style>
