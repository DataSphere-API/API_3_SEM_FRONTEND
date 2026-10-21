<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { criarEspelho } from '../../services/espelhoService.js'
import { listarAtendimentosDaOcs } from '../../services/checkMutuoService.js'
import { sessao } from '../../stores/sessao.js'
import { formatarMoeda } from '../../utils/avaliarLisura.js'
import { formatarData } from '../../utils/documentos.js'

const router = useRouter()
const cnpj = sessao.usuario?.ocsCnpj || ''

const hoje = new Date().toISOString().slice(0, 10)
const dataInicio = ref(`${hoje.slice(0, 7)}-01`)
const dataFim = ref(hoje)

const atendimentos = ref([])
const selecionados = ref({})
const valores = ref({})
const carregando = ref(false)
const erro = ref('')
const enviando = ref(false)

// Realizados (beneficiário confirmou), sem espelho e com a última sessão dentro do período.
const disponiveis = computed(() =>
  atendimentos.value.filter(a => {
    if (a.statusProcedimento !== 'REALIZADA' || a.espelhoId || !a.dataRealizacao) return false
    const dia = a.dataRealizacao.slice(0, 10)
    return dia >= dataInicio.value && dia <= dataFim.value
  })
)

const escolhidos = computed(() => disponiveis.value.filter(a => selecionados.value[a.atendimentoId]))
const total = computed(() => escolhidos.value.reduce((soma, a) => soma + (Number(valores.value[a.atendimentoId]) || 0), 0))

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    atendimentos.value = await listarAtendimentosDaOcs(cnpj)
    atendimentos.value.forEach(a => {
      if (selecionados.value[a.atendimentoId] === undefined) selecionados.value[a.atendimentoId] = true
    })
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível carregar os atendimentos.'
  } finally {
    carregando.value = false
  }
}

async function enviar() {
  erro.value = ''
  if (dataFim.value < dataInicio.value) {
    erro.value = 'O fim do período não pode ser antes do início.'
    return
  }
  if (escolhidos.value.length === 0) {
    erro.value = 'Marque pelo menos um atendimento.'
    return
  }
  if (escolhidos.value.some(a => !(Number(valores.value[a.atendimentoId]) > 0))) {
    erro.value = 'Informe o valor cobrado de todos os atendimentos marcados.'
    return
  }

  enviando.value = true
  try {
    await criarEspelho({
      ocsId: cnpj,
      dataInicio: dataInicio.value,
      dataFim: dataFim.value,
      itens: escolhidos.value.map(a => ({ atendimentoId: a.atendimentoId, valor: Number(valores.value[a.atendimentoId]) }))
    })
    router.push('/espelhos')
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível enviar o espelho.'
  } finally {
    enviando.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <main class="fx-pagina">
    <form class="fx-conteudo fx-conteudo-largo" novalidate @submit.prevent="enviar">
      <div>
        <router-link to="/espelhos" class="voltar">← Voltar</router-link>
      </div>
      <header>
        <h1 class="fx-titulo">Novo espelho</h1>
        <p class="fx-subtitulo">
          O espelho junta todos os atendimentos realizados no período. Informe quanto a clínica cobra por cada um.
        </p>
      </header>

      <section class="fx-cartao">
        <h2 class="fx-secao-titulo">1. Período</h2>
        <div class="fx-grade">
          <label class="fx-campo">
            De
            <input v-model="dataInicio" type="date" class="fx-entrada" />
          </label>
          <label class="fx-campo">
            Até
            <input v-model="dataFim" type="date" class="fx-entrada" />
          </label>
        </div>
      </section>

      <section class="fx-cartao">
        <h2 class="fx-secao-titulo">2. Atendimentos realizados no período</h2>
        <p class="fx-suave">
          Só aparecem atendimentos confirmados pelo beneficiário e que ainda não estão em outro espelho.
        </p>

        <p v-if="carregando" class="fx-alerta fx-alerta-cinza">Carregando atendimentos...</p>
        <p v-else-if="disponiveis.length === 0" class="fx-alerta fx-alerta-cinza">
          Nenhum atendimento realizado neste período.
        </p>

        <div v-else class="fx-tabela-rolagem">
          <table class="fx-tabela">
            <thead>
              <tr>
                <th><span class="fx-suave">Incluir</span></th>
                <th>Atendimento</th>
                <th>Beneficiário</th>
                <th>Procedimento</th>
                <th>Realizado em</th>
                <th>Valor cobrado (R$)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in disponiveis" :key="a.atendimentoId">
                <td>
                  <input
                    v-model="selecionados[a.atendimentoId]"
                    type="checkbox"
                    class="marcar"
                    :aria-label="`Incluir atendimento ${a.atendimentoId}`"
                  />
                </td>
                <td class="fx-mono">{{ a.atendimentoId }}</td>
                <td>{{ a.beneficiario.nome }} <span class="fx-suave fx-mono">· {{ a.beneficiario.precCp }}</span></td>
                <td>{{ a.procedimento }}<span v-if="a.qtdAutorizada > 1" class="fx-suave"> · {{ a.qtdAutorizada }} sessões</span></td>
                <td>{{ formatarData(a.dataRealizacao) }}</td>
                <td>
                  <input
                    v-model="valores[a.atendimentoId]"
                    type="number"
                    min="0.01"
                    step="0.01"
                    class="fx-entrada campo-valor"
                    :disabled="!selecionados[a.atendimentoId]"
                    :aria-label="`Valor cobrado do atendimento ${a.atendimentoId}`"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

      <div class="rodape">
        <strong>{{ escolhidos.length }} atendimento(s) · Total: <span class="fx-mono">{{ formatarMoeda(total) }}</span></strong>
        <div class="fx-acoes">
          <router-link to="/espelhos" class="fx-botao-secundario link-botao">Cancelar</router-link>
          <button type="submit" class="fx-botao" :disabled="enviando || carregando">
            {{ enviando ? 'Enviando...' : 'Enviar espelho para auditoria' }}
          </button>
        </div>
      </div>
    </form>
  </main>
</template>

<style scoped>
.voltar {
  color: var(--fx-verde);
  font-weight: 600;
}

.marcar {
  width: 20px;
  height: 20px;
}

.campo-valor {
  width: 140px;
}

.rodape {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.link-botao {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}
</style>
