<script setup>
import { ref, computed, onMounted } from 'vue'
import { listarFaturasMensais, buscarFaturaMensal } from '../../services/faturaMensalService.js'
import { formatarMoeda } from '../../utils/avaliarLisura.js'
import { formatarData, formatarDataHora } from '../../utils/documentos.js'
import { prazoDeEnvioEncerrado, rotuloCompetencia } from '../../utils/competencia.js'
import { avaliarCobranca, pontuacaoDoEspelho, classeDaPontuacao } from '../../utils/pontuacao.js'

const faturas = ref([])
const carregando = ref(false)
const erro = ref('')
const filtroCompetencia = ref('')
const filtroOcs = ref('')
const aberta = ref(null)

const competencias = computed(() => [...new Set(faturas.value.map(f => f.competencia))].sort().reverse())
const ocs = computed(() => [...new Map(faturas.value.map(f => [f.ocsId, f.ocsNome])).entries()])

const lista = computed(() =>
  faturas.value
    .filter(f => (!filtroCompetencia.value || f.competencia === filtroCompetencia.value) && (!filtroOcs.value || f.ocsId === filtroOcs.value))
    .sort((a, b) => b.competencia.localeCompare(a.competencia) || a.ocsNome.localeCompare(b.ocsNome))
)

const itensDaAberta = computed(() =>
  (aberta.value?.espelhos || []).flatMap(e => e.itens).map(i => ({ valor: i.valorApresentado, valorContratado: i.valorContratado }))
)

function situacao(fatura) {
  if (fatura.status === 'ENCAMINHADA_APROVACAO') return { texto: 'Encaminhada', classe: 'fx-selo-azul' }
  if (!prazoDeEnvioEncerrado(fatura.competencia)) return { texto: 'Recebendo espelhos', classe: 'fx-selo-cinza' }
  if (fatura.espelhosPendentes) return { texto: 'Aguardando espelhos', classe: 'fx-selo-ambar' }
  return { texto: 'Pronta para encaminhar', classe: 'fx-selo-verde' }
}

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    faturas.value = await listarFaturasMensais()
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível carregar as faturas.'
  } finally {
    carregando.value = false
  }
}

async function abrir(id) {
  try {
    aberta.value = await buscarFaturaMensal(id)
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível abrir a fatura.'
  }
}

onMounted(carregar)
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo fx-conteudo-largo">
      <header>
        <h1 class="fx-titulo">Faturas mensais</h1>
        <p class="fx-subtitulo">
          Uma fatura por OCS por mês, com todos os espelhos aprovados daquele mês. O espelho entra na fatura quando
          você o aprova.
        </p>
      </header>

      <template v-if="!aberta">
        <div class="fx-grade filtros">
          <label class="fx-campo">
            Mês
            <select v-model="filtroCompetencia" class="fx-entrada">
              <option value="">Todos</option>
              <option v-for="c in competencias" :key="c" :value="c">{{ rotuloCompetencia(c) }}</option>
            </select>
          </label>
          <label class="fx-campo">
            OCS
            <select v-model="filtroOcs" class="fx-entrada">
              <option value="">Todas</option>
              <option v-for="[cnpj, nome] in ocs" :key="cnpj" :value="cnpj">{{ nome }}</option>
            </select>
          </label>
        </div>

        <p v-if="carregando" class="fx-alerta fx-alerta-cinza">Carregando faturas...</p>
        <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

        <div v-if="!carregando && !erro" class="fx-tabela-rolagem">
          <table class="fx-tabela">
            <thead>
              <tr>
                <th>Mês</th>
                <th>OCS</th>
                <th>Espelhos</th>
                <th>Atendimentos</th>
                <th>Contrato</th>
                <th>Cobrado</th>
                <th>Situação</th>
                <th><span class="fx-suave">Ação</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="f in lista" :key="f.id">
                <td><strong>{{ rotuloCompetencia(f.competencia) }}</strong></td>
                <td>{{ f.ocsNome }}</td>
                <td>{{ f.quantidadeEspelhos }}</td>
                <td>{{ f.quantidadeItens }}</td>
                <td class="fx-mono">{{ formatarMoeda(f.valorContratado) }}</td>
                <td class="fx-mono">{{ formatarMoeda(f.valorApresentado) }}</td>
                <td><span class="fx-selo" :class="situacao(f).classe">{{ situacao(f).texto }}</span></td>
                <td><button type="button" class="fx-botao-secundario" @click="abrir(f.id)">Ver</button></td>
              </tr>
              <tr v-if="lista.length === 0">
                <td colspan="8" class="fx-suave">Nenhuma fatura. Elas aparecem quando o primeiro espelho do mês é aprovado.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <template v-else>
        <div>
          <button type="button" class="fx-botao-secundario" @click="aberta = null">← Voltar para as faturas</button>
        </div>

        <article class="fx-cartao">
          <div class="topo">
            <h2 class="titulo-fatura">Fatura de {{ rotuloCompetencia(aberta.competencia) }} · {{ aberta.ocsNome }}</h2>
            <span class="fx-selo" :class="situacao(aberta).classe">{{ situacao(aberta).texto }}</span>
          </div>
          <p v-if="aberta.dataEncaminhamento" class="fx-suave">Encaminhada em {{ formatarDataHora(aberta.dataEncaminhamento) }}</p>

          <div class="placar">
            <div class="placar-item">
              <span class="fx-suave">Pontuação da fatura</span>
              <span class="fx-selo nota" :class="classeDaPontuacao(pontuacaoDoEspelho(itensDaAberta))">
                {{ pontuacaoDoEspelho(itensDaAberta) }}/100
              </span>
            </div>
            <div class="placar-item">
              <span class="fx-suave">Contrato</span>
              <strong class="fx-mono">{{ formatarMoeda(aberta.valorContratado) }}</strong>
            </div>
            <div class="placar-item">
              <span class="fx-suave">Cobrado pela OCS</span>
              <strong class="fx-mono">{{ formatarMoeda(aberta.valorApresentado) }}</strong>
            </div>
            <div class="placar-item">
              <span class="fx-suave">Diferença</span>
              <strong class="fx-mono" :class="{ acima: aberta.valorApresentado > aberta.valorContratado }">
                {{ formatarMoeda(aberta.valorApresentado - aberta.valorContratado) }}
              </strong>
            </div>
          </div>

          <p v-if="aberta.pendentes.length" class="fx-alerta fx-alerta-ambar">
            Espelhos deste mês ainda fora da fatura:
            <template v-for="(p, i) in aberta.pendentes" :key="p.espelhoId">
              {{ i ? ', ' : '' }}#{{ p.espelhoId }} ({{ p.status === 'EM_ABERTO' ? 'na auditoria' : 'em correção pela OCS' }})
            </template>.
          </p>
        </article>

        <section v-for="espelho in aberta.espelhos" :key="espelho.espelhoId" class="fx-cartao">
          <h3 class="fx-secao-titulo">
            Espelho <span class="fx-mono">#{{ espelho.espelhoId }}</span>
            <span class="fx-suave"> · {{ formatarData(espelho.dataInicio) }} a {{ formatarData(espelho.dataFim) }}</span>
          </h3>
          <div class="fx-tabela-rolagem">
            <table class="fx-tabela">
              <thead>
                <tr>
                  <th>Atendimento</th>
                  <th>Procedimento</th>
                  <th>Beneficiário</th>
                  <th>Contrato</th>
                  <th>Cobrado</th>
                  <th>Pontuação</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="i in espelho.itens" :key="i.id">
                  <td class="fx-mono">{{ i.atendimentoId }}</td>
                  <td>{{ i.descricao }}</td>
                  <td class="fx-mono">{{ i.beneficiarioId }}</td>
                  <td class="fx-mono">{{ i.valorContratado === null ? '—' : formatarMoeda(i.valorContratado) }}</td>
                  <td class="fx-mono">{{ formatarMoeda(i.valorApresentado) }}</td>
                  <td>
                    <span class="fx-selo" :class="avaliarCobranca(i.valorApresentado, i.valorContratado).classe">
                      {{ avaliarCobranca(i.valorApresentado, i.valorContratado).pontuacao }} ·
                      {{ avaliarCobranca(i.valorApresentado, i.valorContratado).texto }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </template>
    </div>
  </main>
</template>

<style scoped>
.filtros {
  max-width: 640px;
}

.topo {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.titulo-fatura {
  margin: 0;
  font-size: 1.15rem;
}

.placar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 0.75rem;
}

.placar-item {
  padding: 0.75rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  border: 1px solid var(--fx-borda);
  border-radius: 10px;
  background-color: #fafbf8;
}

.nota {
  align-self: flex-start;
  font-size: 0.95rem;
}

.acima {
  color: #a3261b;
}
</style>
