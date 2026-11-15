<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import QRCode from 'qrcode'
import { buscarQrCode } from '../../../services/guiasService.js'
import {
  alertaValidade,
  resumoSessoes,
  rotuloStatus,
  situacaoQr,
  tomStatus
} from '../../../utils/guiaRegras.js'

const props = defineProps({
  aberto: {
    type: Boolean,
    default: false
  },
  guia: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['fechar'])

const qrs = ref({})
const ampliado = ref(null)
let sequencia = 0

function consultaAtual(guiaAtual, minhaSequencia) {
  return props.aberto && props.guia === guiaAtual && minhaSequencia === sequencia
}

async function carregarQr(guiaAtual, atendimentoId, minhaSequencia) {
  qrs.value = {
    ...qrs.value,
    [atendimentoId]: { carregando: true, erro: '', imagem: '' }
  }

  try {
    const { codigo } = await buscarQrCode(atendimentoId)
    if (!consultaAtual(guiaAtual, minhaSequencia)) return
    const imagem = await QRCode.toDataURL(codigo, { type: 'image/png', width: 320, margin: 2 })

    if (!consultaAtual(guiaAtual, minhaSequencia)) {
      return
    }

    qrs.value = {
      ...qrs.value,
      [atendimentoId]: { carregando: false, erro: '', imagem }
    }
  } catch (erro) {
    if (!consultaAtual(guiaAtual, minhaSequencia)) {
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

function carregarQrs() {
  const minhaSequencia = ++sequencia
  qrs.value = {}
  ampliado.value = null

  if (!props.aberto || !props.guia) {
    return
  }

  const guiaAtual = props.guia

  guiaAtual.procedimentos.forEach(proc => {
    if (situacaoQr(guiaAtual, proc).exibir) {
      carregarQr(guiaAtual, proc.atendimentoId, minhaSequencia)
    }
  })
}

watch([() => props.aberto, () => props.guia], carregarQrs, { immediate: true })

function situacao(proc) {
  return situacaoQr(props.guia, proc)
}

function ampliar(proc) {
  if (!qrs.value[proc.atendimentoId]?.imagem) return
  ampliado.value = {
    imagem: qrs.value[proc.atendimentoId].imagem,
    titulo: proc.descricao
  }
}

function baixar(proc) {
  if (!qrs.value[proc.atendimentoId]?.imagem) return
  const link = document.createElement('a')
  const nome = `qrcode-${props.guia.numero || 'guia'}-${proc.atendimentoId}`

  link.href = qrs.value[proc.atendimentoId].imagem
  link.download = `${nome.replace(/[^\w.-]+/g, '-')}.png`
  document.body.appendChild(link)
  link.click()
  link.remove()
}

function aoPressionarTecla(evento) {
  if (evento.key !== 'Escape' || !props.aberto) return
  if (ampliado.value) ampliado.value = null
  else emit('fechar')
}

onMounted(() => window.addEventListener('keydown', aoPressionarTecla))
onBeforeUnmount(() => window.removeEventListener('keydown', aoPressionarTecla))
</script>

<template>
  <div v-if="aberto && guia" class="fx-modal-fundo" @click.self="$emit('fechar')">
    <div class="fx-modal" role="dialog" aria-modal="true" aria-labelledby="guia-detalhe-titulo">
      <header class="fx-modal-topo">
        <div>
          <h2 id="guia-detalhe-titulo">{{ guia.numero ? 'Guia ' + guia.numero : 'Guia sem número' }}</h2>
          <p>{{ rotuloStatus(guia.status) }}</p>
        </div>

        <button type="button" class="fx-fechar" aria-label="Fechar" @click="$emit('fechar')">
          ×
        </button>
      </header>

      <div class="fx-modal-corpo">
        <p class="fx-alerta fx-alerta-cinza">
          Após concluir todas as sessões, apresente o QR Code na clínica para a baixa final do procedimento.
          Ele será exibido somente quando liberado pelo sistema.
        </p>
        <p v-if="alertaValidade(guia)" class="fx-alerta fx-alerta-ambar" role="alert">
          {{ alertaValidade(guia) }}
        </p>

        <p v-if="guia.procedimentos.length === 0" class="fx-alerta fx-alerta-cinza">
          Esta guia não possui procedimentos.
        </p>

        <section v-for="(proc, i) in guia.procedimentos" :key="proc.atendimentoId ?? i" class="fx-cartao">
          <div class="proc-topo">
            <strong>{{ proc.descricao }}</strong>
            <span class="fx-selo" :class="'fx-selo-' + tomStatus(proc.status)">
              {{ rotuloStatus(proc.status) }}
            </span>
          </div>

          <span class="fx-suave">{{ resumoSessoes(proc).texto }}</span>

          <template v-if="situacao(proc).exibir">
            <p v-if="qrs[proc.atendimentoId]?.carregando" class="fx-suave">
              Consultando QR Code...
            </p>

            <p
              v-else-if="qrs[proc.atendimentoId]?.erro"
              class="fx-alerta fx-alerta-vermelho"
              role="alert"
            >
              {{ qrs[proc.atendimentoId].erro }}
            </p>

            <div v-else-if="qrs[proc.atendimentoId]?.imagem" class="qr-area">
              <img
                :src="qrs[proc.atendimentoId].imagem"
                :alt="'QR Code de ' + proc.descricao"
                class="qr-imagem"
              />

              <div class="qr-botoes">
                <button type="button" class="fx-botao-secundario" @click="ampliar(proc)">
                  Ampliar
                </button>
                <button type="button" class="fx-botao" @click="baixar(proc)">
                  Baixar PNG
                </button>
              </div>
            </div>
          </template>

          <p v-else-if="situacao(proc).mensagem" class="fx-alerta fx-alerta-cinza">{{ situacao(proc).mensagem }}</p>
        </section>
      </div>

      <footer class="fx-modal-rodape">
        <button type="button" class="fx-botao-secundario" @click="$emit('fechar')">
          Voltar
        </button>
      </footer>
    </div>

    <div v-if="ampliado" class="fx-modal-fundo fx-ampliado" @click.self="ampliado = null">
      <div class="ampliado-caixa" role="dialog" aria-modal="true" :aria-label="'QR Code ampliado de ' + ampliado.titulo">
        <strong>{{ ampliado.titulo }}</strong>
        <img :src="ampliado.imagem" :alt="'QR Code ampliado de ' + ampliado.titulo" />
        <button type="button" class="fx-botao" @click="ampliado = null">Fechar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.proc-topo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.qr-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.qr-imagem {
  width: 180px;
  height: 180px;
  padding: 0.5rem;
  border: 1px solid var(--fx-borda);
  border-radius: 14px;
}

.qr-botoes {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

.ampliado-caixa {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
  background-color: #ffffff;
  border-radius: 20px;
  color: var(--fx-texto);
  font-family: var(--fx-fonte);
}

.ampliado-caixa img {
  width: min(80vw, 360px);
  height: auto;
}
</style>
