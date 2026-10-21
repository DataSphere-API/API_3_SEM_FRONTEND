<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { buscarBeneficiarios } from '../../services/beneficiarioService.js'
import { listarContratos } from '../../services/contratoService.js'
import { buscarPreGuiaDoFluxo, criarPreGuia, corrigirPreGuia } from '../../services/fluxoPreGuiaService.js'
import { sessao } from '../../stores/sessao.js'
import { formatarMoeda } from '../../utils/avaliarLisura.js'
import { apontamentos, CARATER } from '../../utils/fluxoPreGuia.js'

const route = useRoute()
const router = useRouter()

const ehMedico = sessao.perfilAtivo === 'MEDICO'
const idCorrecao = route.name === 'corrigir-pre-guia' ? Number(route.params.id) : null

const contratos = ref([])
const preGuiaOriginal = ref(null)
const carregando = ref(false)
const erroCarga = ref('')
const erro = ref('')
const errosCampo = ref({})
const enviando = ref(false)
const criada = ref(null)

const busca = ref('')
const buscando = ref(false)
const resultadosBusca = ref([])
const beneficiario = ref(null)

const form = reactive({
  medicoSolicitante: {
    nome: ehMedico ? sessao.usuario.nome : '',
    crm: ehMedico ? sessao.usuario.crm : '',
    uf: ehMedico ? sessao.usuario.crmUf : ''
  },
  cid: '',
  carater: 'ELETIVO',
  justificativa: '',
  observacoesEmissor: '',
  respostaEmissor: '',
  itens: [{ contratoId: '', quantidade: 1 }]
})

const titulo = computed(() => {
  if (idCorrecao) return 'Corrigir pré-guia devolvida'
  return ehMedico ? 'Nova solicitação de exame' : 'Criar pré-guia'
})

const hoje = new Date().toISOString().slice(0, 10)
const contratosVigentes = computed(() =>
  contratos.value.filter(c => c.inicioVigencia <= hoje && hoje <= c.fimVigencia)
)

function contratoDe(item) {
  return contratosVigentes.value.find(c => c.id === Number(item.contratoId))
}

const valorTotal = computed(() =>
  form.itens.reduce((total, item) => total + (contratoDe(item)?.valor || 0) * (Number(item.quantidade) || 0), 0)
)

async function carregar() {
  carregando.value = true
  erroCarga.value = ''
  try {
    contratos.value = await listarContratos()
    if (idCorrecao) {
      const preGuia = await buscarPreGuiaDoFluxo(idCorrecao)
      if (preGuia.status !== 'DEVOLVIDA') {
        erroCarga.value = 'Esta pré-guia não está devolvida, então não pode ser corrigida.'
        return
      }
      preGuiaOriginal.value = preGuia
      beneficiario.value = preGuia.beneficiario
      Object.assign(form, {
        medicoSolicitante: { ...preGuia.medicoSolicitante },
        cid: preGuia.cid,
        carater: preGuia.carater,
        justificativa: preGuia.justificativa,
        observacoesEmissor: preGuia.observacoesEmissor,
        itens: preGuia.procedimentos.map(p => ({
          contratoId:
            contratosVigentes.value.find(c => c.procedimentoId === p.procedimentoId && c.ocsCnpj === p.ocs.cnpj)?.id || '',
          quantidade: p.quantidade
        }))
      })
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
  const medico = form.medicoSolicitante
  if (!medico.nome.trim() || !medico.crm.trim() || !medico.uf.trim()) erros.medico = 'Informe nome, CRM e UF do médico.'
  if (!form.justificativa.trim()) erros.justificativa = 'A justificativa clínica é obrigatória.'
  if (form.itens.length === 0) erros.itens = 'Adicione pelo menos um procedimento.'
  else if (form.itens.some(i => !contratoDe(i) || !(Number(i.quantidade) > 0))) {
    erros.itens = 'Escolha o procedimento e informe uma quantidade maior que zero em todas as linhas.'
  }
  if (idCorrecao && !form.respostaEmissor.trim()) erros.respostaEmissor = 'Explique ao aprovador o que foi corrigido.'
  errosCampo.value = erros
  return Object.keys(erros).length === 0
}

async function enviar() {
  erro.value = ''
  if (!validar()) return

  const dados = {
    beneficiarioPrecCp: beneficiario.value.precCp,
    medicoSolicitante: {
      nome: form.medicoSolicitante.nome.trim(),
      crm: form.medicoSolicitante.crm.trim(),
      uf: form.medicoSolicitante.uf.trim().toUpperCase()
    },
    cid: form.cid.trim().toUpperCase(),
    carater: form.carater,
    justificativa: form.justificativa.trim(),
    observacoesEmissor: ehMedico ? '' : form.observacoesEmissor.trim(),
    procedimentos: form.itens.map(i => {
      const contrato = contratoDe(i)
      return { procedimentoId: contrato.procedimentoId, ocsCnpj: contrato.ocsCnpj, quantidade: Number(i.quantidade) }
    })
  }

  enviando.value = true
  try {
    if (idCorrecao) {
      await corrigirPreGuia(idCorrecao, { ...dados, respostaEmissor: form.respostaEmissor.trim() })
      router.push({ name: 'acompanhamento', query: { reenviada: preGuiaOriginal.value.numero } })
      return
    }
    criada.value = await criarPreGuia(dados)
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível enviar a pré-guia.'
  } finally {
    enviando.value = false
  }
}

function novaSolicitacao() {
  criada.value = null
  beneficiario.value = null
  Object.assign(form, {
    cid: '',
    carater: 'ELETIVO',
    justificativa: '',
    observacoesEmissor: '',
    itens: [{ contratoId: '', quantidade: 1 }]
  })
  if (!ehMedico) form.medicoSolicitante = { nome: '', crm: '', uf: '' }
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
          <template v-else>A pré-guia vai para o Médico e para o Chefe do FUSEx, que aprovam em paralelo.</template>
        </p>
      </header>

      <p v-if="carregando" class="fx-alerta fx-alerta-cinza">Carregando...</p>
      <p v-if="erroCarga" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erroCarga }}</p>

      <section v-if="criada" class="fx-cartao">
        <p class="fx-alerta fx-alerta-verde" role="status">
          Pré-guia <span class="fx-mono">{{ criada.numero }}</span> enviada para aprovação.
        </p>
        <div class="fx-acoes">
          <button type="button" class="fx-botao" @click="novaSolicitacao">Criar outra</button>
          <router-link v-if="!ehMedico" to="/emissor/acompanhamento" class="fx-botao-secundario link-botao">
            Ir para o acompanhamento
          </router-link>
          <router-link v-else to="/aprovacao" class="fx-botao-secundario link-botao">Ir para as aprovações</router-link>
        </div>
      </section>

      <form v-else-if="!carregando && !erroCarga" class="fx-conteudo" novalidate @submit.prevent="enviar">
        <section v-if="preGuiaOriginal" class="fx-cartao">
          <h2 class="fx-secao-titulo">Por que foi devolvida</h2>
          <p v-for="a in apontamentos(preGuiaOriginal)" :key="a.quem" class="fx-alerta fx-alerta-ambar">
            <strong>{{ a.quem }} ({{ a.por }}):</strong> “{{ a.observacao }}”
          </p>
        </section>

        <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

        <section class="fx-cartao">
          <h2 class="fx-secao-titulo">1. Paciente</h2>
          <div v-if="beneficiario" class="escolhido">
            <span>
              <strong>{{ beneficiario.nome }}</strong>
              <span class="fx-suave fx-mono"> · Prec-CP {{ beneficiario.precCp }}</span>
            </span>
            <button v-if="!idCorrecao" type="button" class="fx-botao-secundario" @click="beneficiario = null">Trocar</button>
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
          <h2 class="fx-secao-titulo">2. Pedido médico</h2>
          <div class="fx-grade">
            <label class="fx-campo">
              Médico solicitante
              <input v-model="form.medicoSolicitante.nome" class="fx-entrada" :readonly="ehMedico" />
            </label>
            <label class="fx-campo campo-curto">
              CRM
              <input v-model="form.medicoSolicitante.crm" class="fx-entrada" :readonly="ehMedico" inputmode="numeric" />
            </label>
            <label class="fx-campo campo-uf">
              UF
              <input v-model="form.medicoSolicitante.uf" class="fx-entrada" :readonly="ehMedico" maxlength="2" />
            </label>
          </div>
          <span v-if="errosCampo.medico" class="fx-erro-campo">{{ errosCampo.medico }}</span>
          <div class="fx-grade">
            <label class="fx-campo campo-curto">
              CID-10
              <input v-model="form.cid" class="fx-entrada" placeholder="Ex.: R10.1" maxlength="8" />
            </label>
            <label class="fx-campo campo-curto">
              Caráter
              <select v-model="form.carater" class="fx-entrada">
                <option v-for="(rotulo, valor) in CARATER" :key="valor" :value="valor">{{ rotulo }}</option>
              </select>
            </label>
          </div>
          <label class="fx-campo">
            Justificativa clínica
            <textarea
              v-model="form.justificativa"
              class="fx-entrada fx-texto-longo"
              :class="{ 'fx-entrada-erro': errosCampo.justificativa }"
              placeholder="Descreva a indicação do exame"
            ></textarea>
            <span v-if="errosCampo.justificativa" class="fx-erro-campo">{{ errosCampo.justificativa }}</span>
          </label>
        </section>

        <section class="fx-cartao">
          <h2 class="fx-secao-titulo">3. Procedimentos</h2>
          <p class="fx-suave">Só aparecem os procedimentos com contrato vigente.</p>
          <div v-for="(item, indice) in form.itens" :key="indice" class="linha-item">
            <label class="fx-campo">
              Procedimento · OCS
              <select v-model="item.contratoId" class="fx-entrada">
                <option value="" disabled>Escolha</option>
                <option v-for="c in contratosVigentes" :key="c.id" :value="c.id">
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
              aria-label="Remover procedimento"
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

        <section v-if="!ehMedico" class="fx-cartao">
          <h2 class="fx-secao-titulo">4. Observações</h2>
          <label class="fx-campo">
            Observações do emissor
            <textarea
              v-model="form.observacoesEmissor"
              class="fx-entrada fx-texto-longo"
              placeholder="Informações que ajudam o aprovador (opcional)"
            ></textarea>
          </label>
          <label v-if="idCorrecao" class="fx-campo">
            Resposta ao aprovador
            <textarea
              v-model="form.respostaEmissor"
              class="fx-entrada fx-texto-longo"
              :class="{ 'fx-entrada-erro': errosCampo.respostaEmissor }"
              placeholder="Ex.: CID incluído e laudo anexado."
            ></textarea>
            <span v-if="errosCampo.respostaEmissor" class="fx-erro-campo">{{ errosCampo.respostaEmissor }}</span>
          </label>
        </section>

        <div class="fx-acoes">
          <button type="submit" class="fx-botao" :disabled="enviando">
            {{ enviando ? 'Enviando...' : idCorrecao ? 'Reenviar para aprovação' : 'Enviar para aprovação' }}
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

.campo-curto {
  flex: 0 1 180px;
  min-width: 140px;
}

.campo-uf {
  flex: 0 1 90px;
  min-width: 80px;
}

.campo-qtd {
  flex: 0 1 100px;
  min-width: 90px;
}

.link-botao {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}
</style>
