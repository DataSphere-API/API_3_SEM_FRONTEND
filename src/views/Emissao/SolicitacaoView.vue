<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { buscarBeneficiarios } from '../../services/beneficiarioService.js'
import { listarContratos } from '../../services/contratoService.js'
import { listarMedicos } from '../../services/usuarioService.js'
import {
  buscarPreGuiaDoFluxo,
  criarPreGuia,
  editarPreGuia,
  enviarParaAprovacao,
  aprovarPreGuia
} from '../../services/fluxoPreGuiaService.js'
import { sessao } from '../../stores/sessao.js'
import { formatarMoeda } from '../../utils/avaliarLisura.js'
import { EDITAVEIS, numeroPreGuia } from '../../utils/fluxoPreGuia.js'

const route = useRoute()
const router = useRouter()

const ehMedico = sessao.perfilAtivo === 'MEDICO'
const idEdicao = route.name === 'editar-pre-guia' ? Number(route.params.id) : null

const contratos = ref([])
const medicos = ref([])
const pendencias = ref([])
const carregando = ref(false)
const erroCarga = ref('')
const erro = ref('')
const errosCampo = ref({})
const salvando = ref(false)
const resultado = ref(null)

const busca = ref('')
const buscando = ref(false)
const resultadosBusca = ref([])
const beneficiario = ref(null)

const form = reactive({
  medicoId: ehMedico ? sessao.usuario.id : '',
  itens: [{ contratoId: '', quantidade: 1 }]
})

const titulo = computed(() => {
  if (idEdicao) return `Editar pré-guia ${numeroPreGuia(idEdicao)}`
  return ehMedico ? 'Nova solicitação de exame' : 'Criar pré-guia'
})

function contratoDe(item) {
  return contratos.value.find(c => c.id === Number(item.contratoId))
}

const valorTotal = computed(() =>
  form.itens.reduce((total, item) => total + (contratoDe(item)?.valor || 0) * (Number(item.quantidade) || 0), 0)
)

async function carregar() {
  carregando.value = true
  erroCarga.value = ''
  try {
    const [listaContratos, listaMedicos] = await Promise.all([listarContratos(), ehMedico ? [] : listarMedicos()])
    contratos.value = listaContratos
    medicos.value = listaMedicos
    if (idEdicao) {
      const preGuia = await buscarPreGuiaDoFluxo(idEdicao)
      if (!EDITAVEIS.includes(preGuia.status)) {
        erroCarga.value = 'Esta pré-guia já foi enviada para aprovação e não pode mais ser editada.'
        return
      }
      beneficiario.value = preGuia.beneficiario
      pendencias.value = preGuia.validacao?.pendencias || []
      form.medicoId = preGuia.medico.id
      form.itens = preGuia.procedimentos.map(p => ({
        contratoId: contratos.value.find(c => c.procedimentoId === p.procedimentoId && c.ocsCnpj === p.ocs.cnpj)?.id || '',
        quantidade: p.qtdSessoes
      }))
    }
  } catch (e) {
    erroCarga.value = e.mensagemUsuario || 'Não foi possível carregar os dados.'
  } finally {
    carregando.value = false
  }
}

async function pesquisarBeneficiario() {
  if (!busca.value.trim()) return
  buscando.value = true
  try {
    resultadosBusca.value = await buscarBeneficiarios(busca.value)
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível buscar beneficiários.'
  } finally {
    buscando.value = false
  }
}

function escolherBeneficiario(b) {
  beneficiario.value = { precCp: b.precCp, nome: b.nome }
  resultadosBusca.value = []
  busca.value = ''
}

function adicionarItem() {
  form.itens.push({ contratoId: '', quantidade: 1 })
}

function removerItem(indice) {
  form.itens.splice(indice, 1)
}

function validar() {
  const erros = {}
  if (!beneficiario.value) erros.beneficiario = 'Escolha o beneficiário.'
  if (!form.medicoId) erros.medico = 'Escolha o médico responsável.'
  if (form.itens.length === 0) erros.itens = 'Adicione pelo menos um procedimento.'
  else if (form.itens.some(i => !contratoDe(i) || !(Number(i.quantidade) > 0))) {
    erros.itens = 'Escolha o procedimento e informe uma quantidade maior que zero em todas as linhas.'
  }
  errosCampo.value = erros
  return Object.keys(erros).length === 0
}

function corpo() {
  return {
    beneficiarioPrecCp: beneficiario.value.precCp,
    medicoId: Number(form.medicoId),
    procedimentos: form.itens.map(i => {
      const contrato = contratoDe(i)
      return { procedimentoId: contrato.procedimentoId, ocsCnpj: contrato.ocsCnpj, quantidade: Number(i.quantidade) }
    })
  }
}

// enviar = false só salva (fica PRE_GUIA); enviar = true também valida (US006) e, se for o médico, já aprova.
async function salvar(enviar) {
  erro.value = ''
  if (!validar()) return

  salvando.value = true
  try {
    const salva = idEdicao ? await editarPreGuia(idEdicao, corpo()) : await criarPreGuia(corpo())
    if (!enviar) {
      router.push({ name: 'acompanhamento', query: { salva: salva.id } })
      return
    }
    const validacao = await enviarParaAprovacao(salva.id)
    if (!validacao.validada) {
      if (ehMedico) {
        resultado.value = { id: salva.id, pendencias: validacao.pendencias }
      } else {
        // Abre a edição já com as pendências que a validação apontou.
        router.replace({ name: 'editar-pre-guia', params: { id: salva.id }, query: { pendente: 1 } })
      }
      return
    }
    if (ehMedico) await aprovarPreGuia(salva.id)
    resultado.value = { id: salva.id, pendencias: [] }
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível salvar a pré-guia.'
  } finally {
    salvando.value = false
  }
}

function novaSolicitacao() {
  resultado.value = null
  beneficiario.value = null
  form.itens = [{ contratoId: '', quantidade: 1 }]
  if (!ehMedico) form.medicoId = ''
}

onMounted(carregar)
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo">
      <header>
        <h1 class="fx-titulo">{{ titulo }}</h1>
        <p class="fx-subtitulo">
          <template v-if="ehMedico">Ao enviar, sua aprovação já fica registrada. Falta só a do Chefe do FUSEx.</template>
          <template v-else>Ao enviar, o sistema valida a pré-guia e ela vai para o Médico e para o Chefe do FUSEx.</template>
        </p>
      </header>

      <p v-if="carregando" class="fx-alerta fx-alerta-cinza">Carregando...</p>
      <p v-if="erroCarga" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erroCarga }}</p>

      <section v-if="resultado" class="fx-cartao">
        <p v-if="resultado.pendencias.length === 0" class="fx-alerta fx-alerta-verde" role="status">
          Pré-guia <span class="fx-mono">{{ numeroPreGuia(resultado.id) }}</span> enviada para aprovação.
        </p>
        <div v-else class="fx-alerta fx-alerta-ambar" role="status">
          Pré-guia <span class="fx-mono">{{ numeroPreGuia(resultado.id) }}</span> salva, mas ficou com pendências.
          O emissor vai corrigir:
          <ul class="pendencias">
            <li v-for="(p, i) in resultado.pendencias" :key="i">{{ p.mensagem }}</li>
          </ul>
        </div>
        <div class="fx-acoes">
          <button type="button" class="fx-botao" @click="novaSolicitacao">Criar outra</button>
          <router-link v-if="ehMedico" to="/aprovacao" class="fx-botao-secundario link-botao">Ir para as aprovações</router-link>
          <router-link v-else to="/emissor/acompanhamento" class="fx-botao-secundario link-botao">Ir para o acompanhamento</router-link>
        </div>
      </section>

      <form v-else-if="!carregando && !erroCarga" class="fx-conteudo" novalidate @submit.prevent="salvar(true)">
        <div v-if="pendencias.length" class="fx-alerta fx-alerta-vermelho" role="alert">
          <strong>{{ route.query.pendente ? 'A validação encontrou pendências. Corrija e envie de novo:' : 'Pendências da última validação:' }}</strong>
          <ul class="pendencias">
            <li v-for="(p, i) in pendencias" :key="i">{{ p.mensagem }}</li>
          </ul>
        </div>

        <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

        <section class="fx-cartao">
          <h2 class="fx-secao-titulo">1. Paciente</h2>
          <div v-if="beneficiario" class="escolhido">
            <span>
              <strong>{{ beneficiario.nome }}</strong>
              <span class="fx-suave fx-mono"> · Prec-CP {{ beneficiario.precCp }}</span>
            </span>
            <button type="button" class="fx-botao-secundario" @click="beneficiario = null">Trocar</button>
          </div>
          <template v-else>
            <div class="busca">
              <label class="fx-campo">
                Buscar beneficiário
                <input
                  v-model="busca"
                  class="fx-entrada"
                  :class="{ 'fx-entrada-erro': errosCampo.beneficiario }"
                  placeholder="Nome ou Prec-CP"
                  @keydown.enter.prevent="pesquisarBeneficiario"
                />
              </label>
              <button type="button" class="fx-botao-secundario" :disabled="buscando" @click="pesquisarBeneficiario">
                {{ buscando ? 'Buscando...' : 'Buscar' }}
              </button>
            </div>
            <span v-if="errosCampo.beneficiario" class="fx-erro-campo">{{ errosCampo.beneficiario }}</span>
            <ul v-if="resultadosBusca.length" class="fx-lista resultados">
              <li v-for="b in resultadosBusca" :key="b.precCp">
                <button type="button" class="resultado" @click="escolherBeneficiario(b)">
                  <strong>{{ b.nome }}</strong>
                  <span class="fx-suave fx-mono">Prec-CP {{ b.precCp }}{{ b.dependente ? ' · dependente' : '' }}</span>
                </button>
              </li>
            </ul>
          </template>
        </section>

        <section class="fx-cartao">
          <h2 class="fx-secao-titulo">2. Médico responsável</h2>
          <p v-if="ehMedico" class="escolhido">
            <span><strong>{{ sessao.usuario.nome }}</strong> <span class="fx-suave fx-mono">· CRM {{ sessao.usuario.crm }}</span></span>
          </p>
          <label v-else class="fx-campo">
            Médico que vai aprovar a pré-guia
            <select v-model="form.medicoId" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.medico }">
              <option value="" disabled>Escolha o médico</option>
              <option v-for="m in medicos" :key="m.id" :value="m.id">{{ m.nome }} · CRM {{ m.crm }}</option>
            </select>
            <span v-if="errosCampo.medico" class="fx-erro-campo">{{ errosCampo.medico }}</span>
          </label>
        </section>

        <section class="fx-cartao">
          <h2 class="fx-secao-titulo">3. Procedimentos</h2>
          <p class="fx-suave">Só aparecem os procedimentos que têm contrato com alguma OCS.</p>
          <div v-for="(item, indice) in form.itens" :key="indice" class="linha-item">
            <label class="fx-campo">
              Procedimento · OCS
              <select v-model="item.contratoId" class="fx-entrada">
                <option value="" disabled>Escolha</option>
                <option v-for="c in contratos" :key="c.id" :value="c.id">
                  {{ c.procedimentoNome }} · {{ c.ocsNome }} · {{ formatarMoeda(c.valor) }}
                </option>
              </select>
            </label>
            <label class="fx-campo campo-qtd">
              Qtde
              <input v-model.number="item.quantidade" type="number" min="1" class="fx-entrada" />
            </label>
            <button
              type="button"
              class="fx-botao-secundario fx-botao-perigo"
              :disabled="form.itens.length === 1"
              @click="removerItem(indice)"
            >
              Remover
            </button>
          </div>
          <span v-if="errosCampo.itens" class="fx-erro-campo">{{ errosCampo.itens }}</span>
          <div class="rodape-itens">
            <button type="button" class="fx-botao-secundario" @click="adicionarItem">+ Procedimento</button>
            <strong>Total: <span class="fx-mono">{{ formatarMoeda(valorTotal) }}</span></strong>
          </div>
        </section>

        <div class="fx-acoes">
          <button type="submit" class="fx-botao" :disabled="salvando">
            {{ salvando ? 'Enviando...' : 'Enviar para aprovação' }}
          </button>
          <button v-if="!ehMedico" type="button" class="fx-botao-secundario" :disabled="salvando" @click="salvar(false)">
            Salvar rascunho
          </button>
        </div>
      </form>
    </div>
  </main>
</template>

<style scoped>
.escolhido,
.busca,
.linha-item,
.rodape-itens {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem;
}

.escolhido {
  margin: 0;
  align-items: center;
}

.resultados {
  gap: 0.4rem;
}

.resultado {
  width: 100%;
  min-height: 44px;
  padding: 0.5rem 0.85rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  border: 1px solid var(--fx-borda);
  border-radius: 8px;
  background-color: #ffffff;
  font-family: inherit;
  cursor: pointer;
}

.resultado:hover {
  border-color: var(--fx-verde);
}

.campo-qtd {
  flex: 0 1 100px;
  min-width: 90px;
}

.pendencias {
  margin: 0.4rem 0 0;
  padding-left: 1.2rem;
}

.link-botao {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}
</style>
