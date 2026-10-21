<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  listarEspelhos,
  listarItensEspelho,
  corrigirItemEspelho,
  removerItemEspelho,
  reenviarEspelho
} from '../../services/espelhoService.js'
import { sessao } from '../../stores/sessao.js'
import { formatarMoeda } from '../../utils/avaliarLisura.js'
import { formatarData } from '../../utils/documentos.js'
import { avaliarCobranca } from '../../utils/pontuacao.js'

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)

const espelho = ref(null)
const itens = ref([])
const valores = ref({})
const removidos = ref({})
const carregando = ref(false)
const erro = ref('')
const enviando = ref(false)

const mantidos = computed(() => itens.value.filter(i => !removidos.value[i.id]))
const total = computed(() => mantidos.value.reduce((soma, i) => soma + (Number(valores.value[i.id]) || 0), 0))

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    const lista = await listarEspelhos({ cnpj: sessao.usuario?.ocsCnpj })
    espelho.value = lista.find(e => e.id === id) || null
    if (!espelho.value) {
      erro.value = 'Espelho não encontrado.'
      return
    }
    if (espelho.value.status !== 'REPROVADO') {
      erro.value = 'Este espelho não está reprovado, então não precisa de correção.'
      return
    }
    itens.value = await listarItensEspelho(id)
    valores.value = Object.fromEntries(itens.value.map(i => [i.id, i.valor]))
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível carregar o espelho.'
  } finally {
    carregando.value = false
  }
}

async function reenviar() {
  erro.value = ''
  if (mantidos.value.length === 0) {
    erro.value = 'O espelho precisa ter pelo menos um atendimento.'
    return
  }
  if (mantidos.value.some(i => !(Number(valores.value[i.id]) > 0))) {
    erro.value = 'Informe um valor maior que zero em todos os atendimentos.'
    return
  }

  enviando.value = true
  try {
    for (const item of itens.value) {
      if (removidos.value[item.id]) {
        await removerItemEspelho(id, item.id)
      } else if (Number(valores.value[item.id]) !== item.valor) {
        await corrigirItemEspelho(id, item.id, Number(valores.value[item.id]))
      }
    }
    await reenviarEspelho(id)
    router.push({ name: 'espelhos', query: { reenviado: id } })
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível reenviar o espelho.'
  } finally {
    enviando.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo fx-conteudo-largo">
      <div>
        <router-link to="/ocs/espelhos" class="voltar">← Voltar</router-link>
      </div>
      <header>
        <h1 class="fx-titulo">Corrigir espelho #{{ id }}</h1>
        <p class="fx-subtitulo">
          Ajuste os valores ou tire os atendimentos apontados pelo auditor e reenvie. O espelho volta para a
          auditoria marcado como devolução corrigida.
        </p>
      </header>

      <p v-if="carregando" class="fx-alerta fx-alerta-cinza">Carregando...</p>
      <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

      <template v-if="espelho && espelho.status === 'REPROVADO' && !carregando">
        <p class="fx-alerta fx-alerta-ambar">
          <strong>Motivo da reprovação:</strong> {{ espelho.motivoReprovacao }}
        </p>

        <section class="fx-cartao">
          <p class="fx-suave">
            Período {{ formatarData(espelho.dataInicio) }} a {{ formatarData(espelho.dataFim) }}.
            O valor do contrato aparece para comparar.
          </p>
          <div class="fx-tabela-rolagem">
            <table class="fx-tabela">
              <thead>
                <tr>
                  <th>Atendimento</th>
                  <th>Procedimento</th>
                  <th>Beneficiário</th>
                  <th>Contrato</th>
                  <th>Valor cobrado (R$)</th>
                  <th><span class="fx-suave">Ação</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="i in itens" :key="i.id" :class="{ removido: removidos[i.id] }">
                  <td class="fx-mono">{{ i.atendimentoId }}</td>
                  <td>{{ i.descricao }}</td>
                  <td class="fx-mono">{{ i.beneficiarioId }}</td>
                  <td class="fx-mono">{{ i.valorContratado === null ? 'Sem contrato' : formatarMoeda(i.valorContratado) }}</td>
                  <td>
                    <input
                      v-model="valores[i.id]"
                      type="number"
                      min="0.01"
                      step="0.01"
                      class="fx-entrada campo-valor"
                      :class="{ 'fx-entrada-erro': !removidos[i.id] && avaliarCobranca(valores[i.id], i.valorContratado).diferenca > 0 }"
                      :disabled="removidos[i.id]"
                      :aria-label="`Valor cobrado do atendimento ${i.atendimentoId}`"
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      class="fx-botao-secundario"
                      :class="{ 'fx-botao-perigo': !removidos[i.id] }"
                      @click="removidos[i.id] = !removidos[i.id]"
                    >
                      {{ removidos[i.id] ? 'Manter' : 'Tirar do espelho' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="fx-suave">Atendimento tirado do espelho fica livre para entrar num próximo espelho.</p>
        </section>

        <div class="rodape">
          <strong>{{ mantidos.length }} atendimento(s) · Total: <span class="fx-mono">{{ formatarMoeda(total) }}</span></strong>
          <button type="button" class="fx-botao" :disabled="enviando" @click="reenviar">
            {{ enviando ? 'Reenviando...' : 'Reenviar para auditoria' }}
          </button>
        </div>
      </template>
    </div>
  </main>
</template>

<style scoped>
.voltar {
  color: var(--fx-verde);
  font-weight: 600;
}

.campo-valor {
  width: 140px;
}

.removido td {
  opacity: 0.5;
  text-decoration: line-through;
}

.removido td:last-child {
  opacity: 1;
  text-decoration: none;
}

.rodape {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
</style>
