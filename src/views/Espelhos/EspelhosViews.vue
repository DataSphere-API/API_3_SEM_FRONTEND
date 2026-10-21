<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { listarEspelhos, listarItensEspelho } from '../../services/espelhoService.js'
import { sessao } from '../../stores/sessao.js'
import EspelhosList from './components/EspelhosList.vue'
import EspelhoDetalhes from './components/EspelhoDetalhes.vue'

const modalAberto = ref(false)
const espelhoSelecionado = ref(null)
const espelhos = ref([])
const route = useRoute()

// Reprovados pelo auditor: a OCS corrige e reenvia.
const reprovados = computed(() => espelhos.value.filter(e => e.status === 'reprovado'))

async function carregarEspelhos() {
  try {
    // A OCS vê só os espelhos dela.
    const lista = await listarEspelhos({ cnpj: sessao.usuario?.ocsCnpj })

    espelhos.value = lista.map(espelho => ({
      ...espelho,
      ocs: espelho.ocsNome || espelho.ocsId,
      data: `${espelho.dataInicio} - ${espelho.dataFim}`,
      status: espelho.status.toLowerCase()
    }))
  } catch (error) {
    console.error('Erro ao carregar espelhos:', error)
  }
}

async function visualizarEspelho(espelho) {
  try {
    // Cada item do espelho é um atendimento: preço padrão = contrato, corrigido = o que a OCS cobrou.
    const itens = await listarItensEspelho(espelho.id)
    espelhoSelecionado.value = {
      ...espelho,
      guias: itens.map(item => ({
        id: item.atendimentoId,
        procedimento: item.descricao,
        paciente: item.beneficiarioId,
        precoPadrao: item.valorContratado ?? item.valor,
        precoCorrigido: item.valor
      }))
    }
    modalAberto.value = true
  } catch (error) {
    console.error('Erro ao carregar itens do espelho:', error)
  }
}

function fecharDetalhes() {
  modalAberto.value = false
  espelhoSelecionado.value = null
}

function salvarEspelho(espelhoAtualizado) {
  const index = espelhos.value.findIndex(
    espelho => espelho.id === espelhoAtualizado.id
  )

  if (index === -1) {
    return
  }

  espelhos.value[index] = espelhoAtualizado
  espelhoSelecionado.value = espelhoAtualizado
}

onMounted(() => {
  carregarEspelhos()
})
</script>

<template>
  <div class="espelhos-page">
    <div class="page-content">
      <div class="page-header">
        <div class="header-row">
          <div>
            <h1>Espelhos</h1>
            <p>Acompanhe e corrija os espelhos gerados.</p>
          </div>

          <router-link to="/espelhos/novo" class="new-button">
            + Novo espelho
          </router-link>
        </div>
      </div>

      <p v-if="route.query.reenviado" class="fx-alerta fx-alerta-verde aviso" role="status">
        Espelho #{{ route.query.reenviado }} corrigido e reenviado para a auditoria.
      </p>

      <section v-if="reprovados.length" class="fx-cartao aviso">
        <strong>Espelhos reprovados pelo auditor</strong>
        <div v-for="e in reprovados" :key="e.id" class="reprovado">
          <span>
            <span class="fx-mono">#{{ e.id }}</span> · {{ e.motivoReprovacao }}
          </span>
          <router-link :to="`/espelhos/${e.id}/corrigir`" class="fx-botao link-corrigir">Corrigir e reenviar</router-link>
        </div>
      </section>

      <div class="section-card">
        <EspelhosList
          :espelhos="espelhos"
          @visualizar="visualizarEspelho"
        />
      </div>
    </div>

    <EspelhoDetalhes
      :aberto="modalAberto"
      :espelho="espelhoSelecionado"
      @fechar="fecharDetalhes"
      @salvar="salvarEspelho"
    />
  </div>
</template>

<style scoped>
.aviso {
  margin-bottom: 1.25rem;
}

.reprovado {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--fx-borda);
}

.link-corrigir {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.espelhos-page {
  min-height: 100vh;
  padding: 2.5rem 1.5rem;
  background-color: var(--color-background);
}

.page-content {
  width: min(1200px, 100%);
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.header-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.page-header h1 {
  margin: 0;
  color: var(--text-color);
  font-family: "DM Sans", sans-serif;
  font-size: 1.8rem;
  font-weight: 700;
}

.page-header p {
  margin: 0.5rem 0 0;
  color: var(--text-light-color);
  font-size: 0.9rem;
}

.section-card {
  padding: 1.5rem;
  background-color: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: 16px;
}

.new-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0.7rem 1.2rem;
  border: 1px solid var(--primary-color);
  border-radius: 9999px;
  background-color: var(--primary-color);
  color: #ffffff;
  font-family: "Vend Sans", sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.new-button:hover {
  background-color: var(--primary-dark-bg-color);
  border-color: var(--primary-dark-bg-color);
}

@media (max-width: 768px) {
  .espelhos-page {
    padding: 1.5rem 1rem;
  }

  .header-row {
    flex-direction: column;
    align-items: stretch;
  }

  .new-button {
    width: 100%;
  }

  .section-card {
    padding: 1rem;
  }
}
</style>