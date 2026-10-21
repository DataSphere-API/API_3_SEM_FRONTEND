<script setup>
import { reactive, ref, computed } from 'vue'
import { salvarUsuario } from '../../../services/usuarioService.js'
import { PERFIS, PERFIS_ATRIBUIVEIS } from '../../../utils/perfis.js'
import { cpfValido, emailValido, formatarCpf, somenteDigitos } from '../../../utils/documentos.js'

const props = defineProps({
  usuario: { type: Object, default: null },
  ocs: { type: Array, required: true }
})

const emit = defineEmits(['fechar', 'salvo'])

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

const editando = computed(() => Boolean(props.usuario))
const ehBeneficiario = computed(() => props.usuario?.perfis.includes('BENEFICIARIO'))

const form = reactive({
  nome: props.usuario?.nome || '',
  cpf: formatarCpf(props.usuario?.cpf || ''),
  postoGraduacao: props.usuario?.postoGraduacao || '',
  email: props.usuario?.email || '',
  telefone: props.usuario?.telefone || '',
  perfis: (props.usuario?.perfis || []).filter(p => PERFIS_ATRIBUIVEIS.includes(p)),
  crm: props.usuario?.crm || '',
  crmUf: props.usuario?.crmUf || '',
  ocsCnpj: props.usuario?.ocsCnpj || '',
  ativo: props.usuario?.ativo ?? true,
  senhaProvisoria: ''
})

const errosCampo = ref({})
const erro = ref('')
const salvando = ref(false)

function validar() {
  const erros = {}
  if (!form.nome.trim()) erros.nome = 'Informe o nome completo.'
  if (!cpfValido(form.cpf)) erros.cpf = 'CPF inválido.'
  if (!emailValido(form.email)) erros.email = 'E-mail inválido.'
  if (form.perfis.length === 0 && !ehBeneficiario.value) erros.perfis = 'Marque pelo menos um perfil.'
  if (form.perfis.includes('MEDICO') && (!form.crm.trim() || !form.crmUf)) erros.crm = 'Médico precisa de CRM e UF.'
  if (form.perfis.includes('OCS') && !form.ocsCnpj) erros.ocsCnpj = 'Escolha a OCS.'
  if (!editando.value && form.senhaProvisoria.length < 8) erros.senhaProvisoria = 'Mínimo de 8 caracteres.'
  errosCampo.value = erros
  return Object.keys(erros).length === 0
}

async function salvar() {
  erro.value = ''
  if (!validar()) return

  salvando.value = true
  try {
    const dados = {
      ...form,
      nome: form.nome.trim(),
      cpf: somenteDigitos(form.cpf),
      email: form.email.trim(),
      telefone: somenteDigitos(form.telefone),
      crm: form.crm.trim()
    }
    if (editando.value) delete dados.senhaProvisoria
    emit('salvo', await salvarUsuario(dados, props.usuario?.id ?? null))
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível salvar o usuário.'
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <div class="fx-modal-fundo" @click.self="emit('fechar')">
    <form class="fx-modal fx-modal-largo" novalidate @submit.prevent="salvar">
      <div class="fx-modal-topo">
        <div>
          <h2>{{ editando ? 'Editar usuário' : 'Novo usuário' }}</h2>
          <p>Com mais de um perfil, a pessoa escolhe com qual entrar depois do login.</p>
        </div>
        <button type="button" class="fx-fechar" aria-label="Fechar" @click="emit('fechar')">&times;</button>
      </div>

      <div class="fx-modal-corpo">
        <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

        <h3 class="fx-secao-titulo">1. Dados pessoais</h3>
        <label class="fx-campo">
          Nome completo
          <input v-model="form.nome" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.nome }" />
          <span v-if="errosCampo.nome" class="fx-erro-campo">{{ errosCampo.nome }}</span>
        </label>
        <div class="fx-grade">
          <label class="fx-campo">
            CPF (login)
            <input
              :value="form.cpf"
              class="fx-entrada"
              :class="{ 'fx-entrada-erro': errosCampo.cpf }"
              inputmode="numeric"
              @input="form.cpf = formatarCpf($event.target.value)"
            />
            <span v-if="errosCampo.cpf" class="fx-erro-campo">{{ errosCampo.cpf }}</span>
          </label>
          <label class="fx-campo">
            Posto / graduação
            <input v-model="form.postoGraduacao" class="fx-entrada" placeholder="Opcional" />
          </label>
        </div>
        <div class="fx-grade">
          <label class="fx-campo">
            E-mail
            <input v-model="form.email" type="email" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.email }" />
            <span v-if="errosCampo.email" class="fx-erro-campo">{{ errosCampo.email }}</span>
          </label>
          <label class="fx-campo">
            Telefone
            <input v-model="form.telefone" class="fx-entrada" inputmode="tel" />
          </label>
        </div>

        <h3 class="fx-secao-titulo">2. Perfis de acesso</h3>
        <div class="fx-checks">
          <label v-for="perfil in PERFIS_ATRIBUIVEIS" :key="perfil" class="fx-check">
            <input v-model="form.perfis" type="checkbox" :value="perfil" />
            {{ PERFIS[perfil].rotulo }}
          </label>
        </div>
        <span v-if="errosCampo.perfis" class="fx-erro-campo">{{ errosCampo.perfis }}</span>
        <p v-if="ehBeneficiario" class="fx-alerta fx-alerta-cinza">
          Também é beneficiário (Prec-CP <span class="fx-mono">{{ usuario.precCp }}</span>). Esse perfil vem do
          autocadastro e não é alterado aqui.
        </p>

        <template v-if="form.perfis.includes('MEDICO') || form.perfis.includes('OCS')">
          <h3 class="fx-secao-titulo">3. Dados por perfil</h3>
          <div v-if="form.perfis.includes('MEDICO')" class="fx-grade">
            <label class="fx-campo">
              CRM (Médico)
              <input v-model="form.crm" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.crm }" inputmode="numeric" />
              <span v-if="errosCampo.crm" class="fx-erro-campo">{{ errosCampo.crm }}</span>
            </label>
            <label class="fx-campo campo-uf">
              UF do CRM
              <select v-model="form.crmUf" class="fx-entrada">
                <option value="" disabled>UF</option>
                <option v-for="uf in UFS" :key="uf" :value="uf">{{ uf }}</option>
              </select>
            </label>
          </div>
          <label v-if="form.perfis.includes('OCS')" class="fx-campo">
            OCS onde trabalha
            <select v-model="form.ocsCnpj" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.ocsCnpj }">
              <option value="" disabled>Escolha a OCS</option>
              <option v-for="o in ocs" :key="o.cnpj" :value="o.cnpj">{{ o.nomeFantasia }}</option>
            </select>
            <span v-if="errosCampo.ocsCnpj" class="fx-erro-campo">{{ errosCampo.ocsCnpj }}</span>
          </label>
        </template>

        <label v-if="!editando" class="fx-campo">
          Senha provisória
          <input v-model="form.senhaProvisoria" type="text" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.senhaProvisoria }" autocomplete="off" />
          <span v-if="errosCampo.senhaProvisoria" class="fx-erro-campo">{{ errosCampo.senhaProvisoria }}</span>
          <span class="fx-suave">Passe essa senha para a pessoa entrar pela primeira vez.</span>
        </label>

        <label class="fx-check ativo">
          <input v-model="form.ativo" type="checkbox" />
          Usuário ativo
        </label>
      </div>

      <div class="fx-modal-rodape">
        <button type="button" class="fx-botao-secundario" @click="emit('fechar')">Cancelar</button>
        <button type="submit" class="fx-botao" :disabled="salvando">
          {{ salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar usuário' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.campo-uf {
  flex: 0 1 120px;
  min-width: 100px;
}

.ativo {
  align-self: flex-start;
}
</style>
