<script setup>
import { ref, computed, onMounted } from 'vue'
import UsuarioFormulario from './components/UsuarioFormulario.vue'
import { listarUsuarios } from '../../services/usuarioService.js'
import { listarOcs } from '../../services/ocsService.js'
import { rotuloPerfil } from '../../utils/perfis.js'
import { formatarCpf, somenteDigitos } from '../../utils/documentos.js'

const usuarios = ref([])
const ocs = ref([])
const carregando = ref(false)
const erro = ref('')
const aviso = ref('')
const busca = ref('')
const formularioAberto = ref(false)

const usuariosFiltrados = computed(() => {
  const termo = busca.value.trim().toLowerCase()
  if (!termo) return usuarios.value
  const digitos = somenteDigitos(termo)
  return usuarios.value.filter(
    u => u.nome.toLowerCase().includes(termo) || (digitos && (u.cpf.includes(digitos) || u.precCp?.includes(digitos)))
  )
})

function vinculo(usuario) {
  const partes = []
  if (usuario.precCp) partes.push(`Prec-CP ${usuario.precCp}`)
  if (usuario.crm) partes.push(`CRM ${usuario.crm}`)
  if (usuario.ocsCnpj) partes.push(ocs.value.find(o => o.cnpj === usuario.ocsCnpj)?.nome || usuario.ocsCnpj)
  return partes.join(' · ') || '—'
}

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    const [listaUsuarios, listaOcs] = await Promise.all([listarUsuarios(), listarOcs()])
    usuarios.value = listaUsuarios
    ocs.value = listaOcs
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível carregar os usuários.'
  } finally {
    carregando.value = false
  }
}

function abrirFormulario() {
  aviso.value = ''
  formularioAberto.value = true
  // Recarrega para ver quem fez o primeiro acesso depois que a tela abriu.
  carregar()
}

function aoSalvar(usuario) {
  aviso.value = `${usuario.nome} cadastrado com os perfis: ${usuario.perfis.map(rotuloPerfil).join(', ')}.`
  formularioAberto.value = false
  carregar()
}

onMounted(carregar)
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo fx-conteudo-largo">
      <header class="fx-topo-pagina">
        <div>
          <h1 class="fx-titulo">Usuários e perfis</h1>
          <p class="fx-subtitulo">
            Dê os perfis da equipe do FUSEx e cadastre os funcionários das OCS. Militares e beneficiários criam o
            próprio acesso em "Cadastre-se", na tela de login.
          </p>
        </div>
        <button type="button" class="fx-botao" @click="abrirFormulario">Novo usuário</button>
      </header>

      <label class="fx-campo">
        Buscar
        <input v-model="busca" class="fx-entrada" placeholder="Nome, CPF ou Prec-CP" />
      </label>

      <p v-if="aviso" class="fx-alerta fx-alerta-verde" role="status">{{ aviso }}</p>
      <p v-if="carregando" class="fx-alerta fx-alerta-cinza">Carregando usuários...</p>
      <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

      <div v-if="!carregando && !erro" class="fx-tabela-rolagem">
        <table class="fx-tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF (login)</th>
              <th>Perfis</th>
              <th>Vínculo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in usuariosFiltrados" :key="u.id">
              <td><strong>{{ u.nome }}</strong></td>
              <td class="fx-mono">{{ formatarCpf(u.cpf) }}</td>
              <td>
                <div class="selos">
                  <span v-for="p in u.perfis" :key="p" class="fx-selo fx-selo-cinza">{{ rotuloPerfil(p) }}</span>
                </div>
              </td>
              <td class="fx-suave">{{ vinculo(u) }}</td>
            </tr>
            <tr v-if="usuariosFiltrados.length === 0">
              <td colspan="4" class="fx-suave">Nenhum usuário encontrado.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <UsuarioFormulario
      v-if="formularioAberto"
      :ocs="ocs"
      :usuarios="usuarios"
      @fechar="formularioAberto = false"
      @salvo="aoSalvar"
    />
  </main>
</template>

<style scoped>
.selos {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}
</style>
