<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { listarConfirmacoesPendentes, confirmarSessao, recusarSessao } from '../../services/checkMutuoService.js'
import { sessao } from '../../stores/sessao.js'
import { formatarDataHora } from '../../utils/documentos.js'

const ATUALIZAR_A_CADA_MS = 8000

const precCp = sessao.usuario?.precCp
const pendentes = ref([])
const carregando = ref(false)
const erro = ref('')
const aviso = ref('')
const erroAcao = ref('')
const processando = ref(null)
const recusando = ref(null)
let temporizador = null

async function carregar(silencioso = false) {
  if (!silencioso) carregando.value = true
  try {
    pendentes.value = await listarConfirmacoesPendentes(precCp)
    erro.value = ''
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível carregar os atendimentos.'
  } finally {
    carregando.value = false
  }
}

async function confirmar(item) {
  aviso.value = ''
  erroAcao.value = ''
  processando.value = item.sessaoId
  try {
    const atendimento = await confirmarSessao(item.sessaoId)
    aviso.value =
      atendimento.statusProcedimento === 'REALIZADA'
        ? `${item.procedimento} confirmado. Procedimento concluído.`
        : `Sessão ${item.numeroSessao} de ${item.procedimento} confirmada.`
    await carregar(true)
  } catch (e) {
    erroAcao.value = e.mensagemUsuario || 'Não foi possível confirmar.'
  } finally {
    processando.value = null
  }
}

async function recusar(item) {
  aviso.value = ''
  erroAcao.value = ''
  processando.value = item.sessaoId
  try {
    await recusarSessao(item.sessaoId)
    aviso.value = `Você informou que não foi atendido em ${item.procedimento}. A clínica foi avisada.`
    recusando.value = null
    await carregar(true)
  } catch (e) {
    erroAcao.value = e.mensagemUsuario || 'Não foi possível registrar a recusa.'
  } finally {
    processando.value = null
  }
}

onMounted(() => {
  carregar()
  temporizador = setInterval(() => carregar(true), ATUALIZAR_A_CADA_MS)
})

onUnmounted(() => clearInterval(temporizador))
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo">
      <header>
        <h1 class="fx-titulo">Confirmar atendimento</h1>
        <p class="fx-subtitulo">
          Quando a clínica registrar o seu procedimento, ele aparece aqui. Confirme só se você foi atendido.
        </p>
      </header>

      <p v-if="!precCp" class="fx-alerta fx-alerta-vermelho" role="alert">
        Seu usuário não tem Prec-CP vinculado.
      </p>

      <template v-else>
        <p v-if="aviso" class="fx-alerta fx-alerta-verde" role="status">{{ aviso }}</p>
        <p v-if="erroAcao" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erroAcao }}</p>
        <p v-if="carregando" class="fx-alerta fx-alerta-cinza">Carregando...</p>
        <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>
        <p v-if="!carregando && !erro && pendentes.length === 0" class="fx-alerta fx-alerta-cinza">
          Nenhum atendimento aguardando a sua confirmação. Esta tela atualiza sozinha.
        </p>

        <ul class="fx-lista">
          <li v-for="item in pendentes" :key="item.sessaoId" class="fx-cartao">
            <p class="pergunta">
              <strong>{{ item.ocs.nome }}</strong> informou que realizou
              <strong>{{ item.procedimento }}</strong>
              <template v-if="item.qtdAutorizada > 1"> (sessão {{ item.numeroSessao }} de {{ item.qtdAutorizada }})</template>
              em {{ formatarDataHora(item.dataRealizacao) }}.
            </p>
            <p class="fx-suave">Guia <span class="fx-mono">{{ item.guiaNumero }}</span></p>

            <div v-if="recusando === item.sessaoId" class="fx-alerta fx-alerta-ambar confirmar-recusa">
              <span>Confirma que <strong>não</strong> foi atendido? A sessão não será contada.</span>
              <div class="fx-acoes">
                <button type="button" class="fx-botao-secundario fx-botao-perigo" :disabled="processando === item.sessaoId" @click="recusar(item)">
                  Sim, não fui atendido
                </button>
                <button type="button" class="fx-botao-secundario" @click="recusando = null">Voltar</button>
              </div>
            </div>

            <div v-else class="fx-acoes">
              <button type="button" class="fx-botao" :disabled="processando === item.sessaoId" @click="confirmar(item)">
                {{ processando === item.sessaoId ? 'Confirmando...' : 'Confirmar atendimento' }}
              </button>
              <button type="button" class="fx-botao-secundario" :disabled="processando === item.sessaoId" @click="recusando = item.sessaoId">
                Não fui atendido
              </button>
            </div>
          </li>
        </ul>
      </template>
    </div>
  </main>
</template>

<style scoped>
.pergunta {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.45;
}

.confirmar-recusa {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
</style>
