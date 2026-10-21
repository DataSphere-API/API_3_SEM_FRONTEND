<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { listarEspelhos, listarItensEspelho } from '../../services/espelhoService.js'
import { sessao } from '../../stores/sessao.js'
import { formatarMoeda } from '../../utils/avaliarLisura.js'
import { formatarData } from '../../utils/documentos.js'
import { competenciaDe, rotuloCompetencia } from '../../utils/competencia.js'

const STATUS = {
  EM_ABERTO: { texto: 'Na auditoria', classe: 'fx-selo-ambar' },
  APROVADO: { texto: 'Aprovado', classe: 'fx-selo-verde' },
  REPROVADO: { texto: 'Devolvido', classe: 'fx-selo-vermelho' },
  FATURADO: { texto: 'Faturado', classe: 'fx-selo-azul' }
}

const route = useRoute()
const espelhos = ref([])
const carregando = ref(false)
const erro = ref('')
const aberto = ref(null)
const itens = ref([])

// A OCS vê só os dela, do mais novo para o mais antigo.
const lista = computed(() => [...espelhos.value].sort((a, b) => b.id - a.id))
// Reprovados pelo auditor: a OCS corrige e reenvia.
const reprovados = computed(() => espelhos.value.filter(e => e.status === 'REPROVADO'))

function selo(status) {
  return STATUS[status] || { texto: status, classe: 'fx-selo-cinza' }
}

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    espelhos.value = await listarEspelhos({ cnpj: sessao.usuario?.ocsCnpj })
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível carregar os espelhos.'
  } finally {
    carregando.value = false
  }
}

async function abrir(espelho) {
  erro.value = ''
  try {
    itens.value = await listarItensEspelho(espelho.id)
    aberto.value = espelho
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível abrir o espelho.'
  }
}

onMounted(carregar)
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo fx-conteudo-largo">
      <header class="topo">
        <div>
          <h1 class="fx-titulo">Espelhos</h1>
          <p class="fx-subtitulo">Os espelhos que a clínica enviou para a auditoria do FUSEx.</p>
        </div>
        <router-link to="/espelhos/novo" class="fx-botao link-botao">Novo espelho</router-link>
      </header>

      <p v-if="route.query.reenviado" class="fx-alerta fx-alerta-verde" role="status">
        Espelho #{{ route.query.reenviado }} corrigido e reenviado para a auditoria.
      </p>

      <section v-if="reprovados.length && !aberto" class="fx-cartao">
        <h2 class="fx-secao-titulo">Devolvidos pelo auditor</h2>
        <div v-for="e in reprovados" :key="e.id" class="reprovado">
          <span><span class="fx-mono">#{{ e.id }}</span> · {{ e.motivoReprovacao }}</span>
          <router-link :to="`/espelhos/${e.id}/corrigir`" class="fx-botao link-botao">Corrigir e reenviar</router-link>
        </div>
      </section>

      <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

      <template v-if="!aberto">
        <p v-if="carregando" class="fx-alerta fx-alerta-cinza">Carregando espelhos...</p>
        <div v-else class="fx-tabela-rolagem">
          <table class="fx-tabela">
            <thead>
              <tr>
                <th>Espelho</th>
                <th>Mês</th>
                <th>Período</th>
                <th>Atendimentos</th>
                <th>Total cobrado</th>
                <th>Situação</th>
                <th><span class="fx-suave">Ação</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in lista" :key="e.id">
                <td class="fx-mono">#{{ e.id }}</td>
                <td>{{ rotuloCompetencia(competenciaDe(e.dataInicio)) }}</td>
                <td>{{ formatarData(e.dataInicio) }} a {{ formatarData(e.dataFim) }}</td>
                <td>{{ e.quantidadeItens }}</td>
                <td class="fx-mono">{{ formatarMoeda(e.valorTotal) }}</td>
                <td>
                  <span class="fx-selo" :class="selo(e.status).classe">{{ selo(e.status).texto }}</span>
                  <span v-if="e.devolucoes && e.status === 'EM_ABERTO'" class="fx-suave"> · reenviado</span>
                </td>
                <td><button type="button" class="fx-botao-secundario" @click="abrir(e)">Ver</button></td>
              </tr>
              <tr v-if="lista.length === 0">
                <td colspan="7" class="fx-suave">Nenhum espelho ainda. Use "Novo espelho" para enviar os atendimentos do mês.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <template v-else>
        <div>
          <button type="button" class="fx-botao-secundario" @click="aberto = null">← Voltar para os espelhos</button>
        </div>
        <article class="fx-cartao">
          <div class="topo">
            <h2 class="titulo-espelho">
              Espelho <span class="fx-mono">#{{ aberto.id }}</span> · {{ rotuloCompetencia(competenciaDe(aberto.dataInicio)) }}
            </h2>
            <span class="fx-selo" :class="selo(aberto.status).classe">{{ selo(aberto.status).texto }}</span>
          </div>
          <p class="fx-suave">
            {{ formatarData(aberto.dataInicio) }} a {{ formatarData(aberto.dataFim) }} · {{ aberto.quantidadeItens }}
            atendimento(s) · Total <span class="fx-mono">{{ formatarMoeda(aberto.valorTotal) }}</span>
          </p>
          <p v-if="aberto.status === 'REPROVADO'" class="fx-alerta fx-alerta-vermelho">
            Devolvido pelo auditor: {{ aberto.motivoReprovacao }}
          </p>
          <div class="fx-tabela-rolagem">
            <table class="fx-tabela">
              <thead>
                <tr>
                  <th>Atendimento</th>
                  <th>Procedimento</th>
                  <th>Beneficiário (Prec-CP)</th>
                  <th>Valor cobrado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="i in itens" :key="i.id">
                  <td class="fx-mono">{{ i.atendimentoId }}</td>
                  <td>{{ i.descricao }}</td>
                  <td class="fx-mono">{{ i.beneficiarioId }}</td>
                  <td class="fx-mono">{{ formatarMoeda(i.valor) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="aberto.status === 'REPROVADO'">
            <router-link :to="`/espelhos/${aberto.id}/corrigir`" class="fx-botao link-botao">Corrigir e reenviar</router-link>
          </div>
        </article>
      </template>
    </div>
  </main>
</template>

<style scoped>
.topo {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.titulo-espelho {
  margin: 0;
  font-size: 1.15rem;
}

.reprovado {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0;
  border-top: 1px solid var(--fx-borda);
}

.link-botao {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}
</style>
