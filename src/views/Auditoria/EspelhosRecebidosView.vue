<script setup>
import { ref, computed, onMounted } from 'vue'
import { listarEspelhos, listarItensEspelho, aprovarEspelho, reprovarEspelho } from '../../services/espelhoService.js'
import { formatarMoeda } from '../../utils/avaliarLisura.js'
import { formatarData, formatarDataHora } from '../../utils/documentos.js'
import { avaliarCobranca, pontuacaoDoEspelho, classeDaPontuacao } from '../../utils/pontuacao.js'

const STATUS = {
  EM_ABERTO: { texto: 'A auditar', classe: 'fx-selo-ambar' },
  APROVADO: { texto: 'Aprovado', classe: 'fx-selo-verde' },
  REPROVADO: { texto: 'Reprovado', classe: 'fx-selo-vermelho' },
  FATURADO: { texto: 'Faturado', classe: 'fx-selo-azul' },
  CANCELADO: { texto: 'Cancelado', classe: 'fx-selo-cinza' }
}

const FILTROS = [
  { valor: 'EM_ABERTO', rotulo: 'A auditar' },
  { valor: 'APROVADO', rotulo: 'Aprovados' },
  { valor: 'REPROVADO', rotulo: 'Reprovados' },
  { valor: '', rotulo: 'Todos' }
]

const espelhos = ref([])
const carregando = ref(false)
const erro = ref('')
const aviso = ref('')
const filtro = ref('EM_ABERTO')
const selecionado = ref(null)
const itens = ref([])
const motivo = ref('')
const reprovando = ref(false)
const erroDecisao = ref('')
const decidindo = ref(false)

const lista = computed(() => (filtro.value ? espelhos.value.filter(e => e.status === filtro.value) : espelhos.value))
const aAuditar = computed(() => espelhos.value.filter(e => e.status === 'EM_ABERTO').length)

const totalContratado = computed(() => itens.value.reduce((soma, i) => soma + (Number(i.valorContratado) || 0), 0))
const totalCobrado = computed(() => itens.value.reduce((soma, i) => soma + (Number(i.valor) || 0), 0))
const pontuacaoGeral = computed(() => pontuacaoDoEspelho(itens.value))
const itensAcima = computed(() => itens.value.filter(i => avaliarCobranca(i.valor, i.valorContratado).pontuacao < 100).length)

function selo(status) {
  return STATUS[status] || { texto: status, classe: 'fx-selo-cinza' }
}

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    espelhos.value = (await listarEspelhos()).sort((a, b) => b.id - a.id)
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível carregar os espelhos.'
  } finally {
    carregando.value = false
  }
}

async function abrir(espelho) {
  aviso.value = ''
  erroDecisao.value = ''
  motivo.value = ''
  reprovando.value = false
  try {
    itens.value = await listarItensEspelho(espelho.id)
    selecionado.value = espelho
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível abrir o espelho.'
  }
}

async function aprovar() {
  erroDecisao.value = ''
  decidindo.value = true
  try {
    await aprovarEspelho(selecionado.value.id)
    aviso.value = `Espelho #${selecionado.value.id} aprovado.`
    selecionado.value = null
    await carregar()
  } catch (e) {
    erroDecisao.value = e.mensagemUsuario || 'Não foi possível aprovar.'
  } finally {
    decidindo.value = false
  }
}

async function reprovar() {
  erroDecisao.value = ''
  if (!motivo.value.trim()) {
    erroDecisao.value = 'Escreva o motivo da reprovação.'
    return
  }
  decidindo.value = true
  try {
    await reprovarEspelho(selecionado.value.id, motivo.value)
    aviso.value = `Espelho #${selecionado.value.id} reprovado. A OCS vê o motivo.`
    selecionado.value = null
    await carregar()
  } catch (e) {
    erroDecisao.value = e.mensagemUsuario || 'Não foi possível reprovar.'
  } finally {
    decidindo.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo fx-conteudo-largo">
      <header>
        <h1 class="fx-titulo">Espelhos recebidos</h1>
        <p class="fx-subtitulo">Espelhos enviados pelas OCS. Confira os itens e aprove ou reprove.</p>
      </header>

      <p v-if="aviso" class="fx-alerta fx-alerta-verde" role="status">{{ aviso }}</p>

      <template v-if="!selecionado">
        <div class="filtros">
          <button
            v-for="f in FILTROS"
            :key="f.valor"
            type="button"
            class="fx-botao-secundario"
            :class="{ 'filtro-ativo': filtro === f.valor }"
            @click="filtro = f.valor"
          >
            {{ f.rotulo }}<template v-if="f.valor === 'EM_ABERTO' && !carregando"> ({{ aAuditar }})</template>
          </button>
        </div>

        <p v-if="carregando" class="fx-alerta fx-alerta-cinza">Carregando espelhos...</p>
        <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

        <div v-if="!carregando && !erro" class="fx-tabela-rolagem">
          <table class="fx-tabela">
            <thead>
              <tr>
                <th>Espelho</th>
                <th>OCS</th>
                <th>Período</th>
                <th>Atendimentos</th>
                <th>Valor</th>
                <th>Situação</th>
                <th><span class="fx-suave">Ação</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in lista" :key="e.id">
                <td class="fx-mono">#{{ e.id }}</td>
                <td>{{ e.ocsNome }}</td>
                <td>{{ formatarData(e.dataInicio) }} a {{ formatarData(e.dataFim) }}</td>
                <td>{{ e.quantidadeItens }}</td>
                <td class="fx-mono">{{ formatarMoeda(e.valorTotal) }}</td>
                <td><span class="fx-selo" :class="selo(e.status).classe">{{ selo(e.status).texto }}</span></td>
                <td>
                  <button type="button" class="fx-botao-secundario" @click="abrir(e)">
                    {{ e.status === 'EM_ABERTO' ? 'Auditar' : 'Ver' }}
                  </button>
                </td>
              </tr>
              <tr v-if="lista.length === 0">
                <td colspan="7" class="fx-suave">Nenhum espelho neste filtro.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <template v-else>
        <div>
          <button type="button" class="fx-botao-secundario" @click="selecionado = null">← Voltar para a lista</button>
        </div>

        <article class="fx-cartao">
          <div class="topo">
            <h2 class="fx-mono numero">Espelho #{{ selecionado.id }}</h2>
            <span class="fx-selo" :class="selo(selecionado.status).classe">{{ selo(selecionado.status).texto }}</span>
          </div>
          <dl class="dados">
            <div><dt>OCS</dt><dd>{{ selecionado.ocsNome }}</dd></div>
            <div><dt>Período</dt><dd>{{ formatarData(selecionado.dataInicio) }} a {{ formatarData(selecionado.dataFim) }}</dd></div>
            <div><dt>Atendimentos</dt><dd>{{ itens.length }}</dd></div>
            <div v-if="selecionado.dataAtualizacao"><dt>Auditado em</dt><dd>{{ formatarDataHora(selecionado.dataAtualizacao) }}</dd></div>
          </dl>
          <p v-if="selecionado.motivoReprovacao" class="fx-alerta fx-alerta-vermelho">
            <strong>Motivo da reprovação:</strong> {{ selecionado.motivoReprovacao }}
          </p>

          <div class="placar">
            <div class="placar-item">
              <span class="fx-suave">Pontuação do espelho</span>
              <span class="fx-selo nota" :class="classeDaPontuacao(pontuacaoGeral)">{{ pontuacaoGeral }}/100</span>
            </div>
            <div class="placar-item">
              <span class="fx-suave">Contrato</span>
              <strong class="fx-mono">{{ formatarMoeda(totalContratado) }}</strong>
            </div>
            <div class="placar-item">
              <span class="fx-suave">Cobrado pela OCS</span>
              <strong class="fx-mono">{{ formatarMoeda(totalCobrado) }}</strong>
            </div>
            <div class="placar-item">
              <span class="fx-suave">Diferença</span>
              <strong class="fx-mono" :class="{ acima: totalCobrado > totalContratado }">
                {{ formatarMoeda(totalCobrado - totalContratado) }}
              </strong>
            </div>
          </div>
          <p v-if="itensAcima" class="fx-alerta fx-alerta-ambar">
            {{ itensAcima }} atendimento(s) cobrado(s) acima do contrato ou sem contrato.
          </p>

          <div class="fx-tabela-rolagem">
            <table class="fx-tabela">
              <thead>
                <tr>
                  <th>Atendimento</th>
                  <th>Procedimento</th>
                  <th>Beneficiário</th>
                  <th>Contrato</th>
                  <th>Cobrado</th>
                  <th>Diferença</th>
                  <th>Pontuação</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="i in itens" :key="i.id">
                  <td class="fx-mono">{{ i.atendimentoId }}</td>
                  <td>{{ i.descricao }}</td>
                  <td class="fx-mono">{{ i.beneficiarioId }}</td>
                  <td class="fx-mono">{{ i.valorContratado === null ? '—' : formatarMoeda(i.valorContratado) }}</td>
                  <td class="fx-mono">{{ formatarMoeda(i.valor) }}</td>
                  <td class="fx-mono" :class="{ acima: avaliarCobranca(i.valor, i.valorContratado).diferenca > 0 }">
                    <template v-if="avaliarCobranca(i.valor, i.valorContratado).diferenca === null">—</template>
                    <template v-else>
                      {{ formatarMoeda(avaliarCobranca(i.valor, i.valorContratado).diferenca) }}
                      <span v-if="avaliarCobranca(i.valor, i.valorContratado).diferenca > 0" class="fx-suave">
                        (+{{ avaliarCobranca(i.valor, i.valorContratado).percentual.toFixed(1) }}%)
                      </span>
                    </template>
                  </td>
                  <td>
                    <span class="fx-selo" :class="avaliarCobranca(i.valor, i.valorContratado).classe">
                      {{ avaliarCobranca(i.valor, i.valorContratado).pontuacao }} · {{ avaliarCobranca(i.valor, i.valorContratado).texto }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="fx-suave">
            Pontuação: 100 quando o valor cobrado está dentro do contrato; cai 1 ponto por ponto percentual acima.
            Faixas da US002-2: baixa até 5%, média até 15%, alta acima disso. Sem contrato vale 0.
          </p>

          <router-link :to="{ name: 'historico', query: { espelho: selecionado.id } }" class="link">
            Ver histórico deste espelho →
          </router-link>
        </article>

        <section v-if="selecionado.status === 'EM_ABERTO'" class="fx-cartao">
          <h2 class="fx-secao-titulo">Sua decisão</h2>
          <p v-if="erroDecisao" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erroDecisao }}</p>
          <template v-if="reprovando">
            <label class="fx-campo">
              Motivo da reprovação (obrigatório)
              <textarea v-model="motivo" class="fx-entrada fx-texto-longo" placeholder="Ex.: item cobrado acima do contrato."></textarea>
            </label>
            <div class="fx-acoes">
              <button type="button" class="fx-botao-secundario fx-botao-perigo" :disabled="decidindo" @click="reprovar">
                Confirmar reprovação
              </button>
              <button type="button" class="fx-botao-secundario" @click="reprovando = false">Cancelar</button>
            </div>
          </template>
          <div v-else class="fx-acoes">
            <button type="button" class="fx-botao" :disabled="decidindo" @click="aprovar">Aprovar espelho</button>
            <button type="button" class="fx-botao-secundario fx-botao-perigo" :disabled="decidindo" @click="reprovando = true">
              Reprovar
            </button>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<style scoped>
.filtros {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filtro-ativo {
  background-color: var(--fx-verde-claro);
  border-color: var(--fx-verde);
  color: var(--fx-verde);
}

.topo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.numero {
  margin: 0;
  font-size: 1.15rem;
}

.dados {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem 1.25rem;
}

.dados dt {
  font-size: 0.8rem;
  color: var(--fx-texto-suave);
}

.dados dd {
  margin: 0.2rem 0 0;
}

.link {
  color: var(--fx-verde);
  font-weight: 600;
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
