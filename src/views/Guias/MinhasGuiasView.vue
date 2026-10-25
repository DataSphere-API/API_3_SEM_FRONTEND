<script setup>
import { ref, onMounted } from 'vue'
import GuiasLista from './components/GuiasLista.vue'
import GuiaDetalhe from './components/GuiaDetalhe.vue'
import { listarGuias } from '../../services/guiasService.js'
import { sessao } from '../../stores/sessao.js'

const precCpDoLogin = sessao.usuario?.precCp || ''
const precCp = ref(precCpDoLogin)
const guias = ref([])
const carregando = ref(false)
const erro = ref('')
const consultou = ref(false)

const procedimentoSelecionadoModal = ref(null)
const guiaDetalhesModal = ref(null)
const urlQrCodeAtual = ref('')

let sequencia = 0

async function buscar() {
  const valor = precCp.value.trim()

  if (!valor) {
    erro.value = 'Informe o PrecCP do beneficiário.'
    return
  }

  const minhaSequencia = ++sequencia

  carregando.value = true
  erro.value = ''
  guias.value = []

  try {
    const lista = await listarGuias(valor)

    if (minhaSequencia === sequencia) {
      guias.value = lista
      consultou.value = true
    }
  } catch (e) {
    if (minhaSequencia === sequencia) {
      erro.value = e.mensagemUsuario || 'Não foi possível carregar as guias.'
      consultou.value = false
    }
  } finally {
    if (minhaSequencia === sequencia) {
      carregando.value = false
    }
  }
}

function lidarBaixarQr(procedimento) {
}

function tratarAbrirQrCode({ guia, procedimento }) {
  procedimentoSelecionadoModal.value = {
    ...procedimento,
    atendimentoId: guia.atendimentoId || procedimento.atendimentoId || guia.id,
    codigoManual: procedimento.codigoManual || procedimento.atendimentoId || 'FUSEX-' + (procedimento.atendimentoId || '000')
  }

  const dadosQr = procedimentoSelecionadoModal.value.codigoManual
  urlQrCodeAtual.value = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${dadosQr}`
}

function tratarAbrirDetalhes(guia) {
  guiaDetalhesModal.value = guia
}

onMounted(() => {
  if (precCpDoLogin) buscar()
})
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo">
      <header>
        <h1 class="fx-titulo">Minhas guias</h1>
        <p class="fx-subtitulo">
          Acompanhe o status das guias e consulte os QR Codes para atendimento na clínica.
        </p>
      </header>

      <form v-if="!precCpDoLogin" class="fx-cartao busca" @submit.prevent="buscar">
        <label class="fx-campo">
          PrecCP do beneficiário
          <input
            v-model="precCp"
            type="text"
            class="fx-entrada"
            placeholder="Ex.: 100100100-00"
            autocomplete="off"
          />
        </label>

        <button type="submit" class="fx-botao" :disabled="carregando">
          Buscar guias
        </button>
      </form>

      <p v-if="carregando" class="fx-alerta fx-alerta-cinza" role="status">
        Carregando guias...
      </p>

      <div v-else-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">
        <p class="mensagem-erro">{{ erro }}</p>
        <button type="button" class="fx-botao-secundario" @click="buscar">
          Tentar novamente
        </button>
      </div>

      <p v-else-if="consultou && guias.length === 0" class="fx-alerta fx-alerta-cinza">
        Nenhuma guia encontrada para este beneficiário.
      </p>

      <GuiasLista
        v-else-if="guias.length > 0"
        :guias="guias"
        @abrir-qrcode="tratarAbrirQrCode"
        @abrir-detalhe="tratarAbrirDetalhes"
      />
    </div>

    <!-- Componente de Modal de Detalhe / QR Code integrado corretamente com a URL -->
    <GuiaDetalhe
      :visivel="Boolean(procedimentoSelecionadoModal)"
      :procedimento="procedimentoSelecionadoModal"
      :url-qr-code="urlQrCodeAtual"
      @baixar="lidarBaixarQr"
      @fechar="procedimentoSelecionadoModal = null"
    />

    <div v-if="guiaDetalhesModal" class="modal-overlay" @click="guiaDetalhesModal = null">
      <div class="modal-conteudo-guia" @click.stop>
        <div class="modal-cabecalho">
          <h3>Detalhes da Guia: {{ guiaDetalhesModal.numero || 'Sem número' }}</h3>
          <button type="button" class="btn-fechar-topo" @click="guiaDetalhesModal = null">✕</button>
        </div>

        <p class="fx-suave status-modal">Status da Guia: {{ guiaDetalhesModal.status }}</p>

        <div class="lista-procedimentos-modal">
          <div v-for="(proc, i) in guiaDetalhesModal.procedimentos" :key="i" class="detalhe-proc-item">
            <strong>{{ proc.descricao || proc.nome }}</strong>
            <p class="fx-suave">Sessões: {{ proc.qtdRealizada || 0 }} / {{ proc.qtdAutorizada || 0 }}</p>
          </div>
        </div>

        <button type="button" class="fx-botao btn-fechar-inferior" @click="guiaDetalhesModal = null">
          Fechar
        </button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.busca {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-end;
}

.mensagem-erro {
  margin: 0 0 0.6rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-conteudo-guia {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 12px;
  width: 450px;
  max-width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.modal-cabecalho h3 {
  margin: 0;
  color: var(--fx-verde, #1e4d36);
}

.btn-fechar-topo {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #666;
}

.status-modal {
  margin: 0;
  font-size: 0.85rem;
}

.lista-procedimentos-modal {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detalhe-proc-item {
  padding: 0.5rem;
  background: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #eee;
}

.detalhe-proc-item p {
  margin: 0.2rem 0 0 0;
}

.btn-fechar-inferior {
  margin-top: 0.5rem;
  background-color: #4a5568 !important;
}
</style>