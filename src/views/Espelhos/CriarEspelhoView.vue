<template>
  <div class="criar-espelho-page">
    <div class="page-content">
      <router-link to="/espelhos" class="back-link">
        &larr; Voltar
      </router-link>

      <div class="page-header">
        <h1>Novo espelho</h1>
        <p>
          Cadastre um espelho a partir de um atendimento já realizado.
        </p>
      </div>

      <form class="section-card" @submit.prevent="enviar">
        <div class="field-row">
          <div class="field">
            <label for="atendimentoId">
              ID do atendimento
            </label>

            <input
              id="atendimentoId"
              v-model.number="form.atendimentoId"
              type="number"
              required
            />
          </div>

          <div class="field">
            <label for="ocsId">
              CNPJ da OCS
            </label>

            <input
              id="ocsId"
              v-model="form.ocsId"
              type="text"
              placeholder="00000000000000"
              required
            />
          </div>
        </div>

        <div class="itens-section">
          <div class="itens-header">
            <h2>Itens do espelho</h2>

            <button
              type="button"
              class="add-button"
              @click="adicionarItem"
            >
              + Adicionar item
            </button>
          </div>

          <div
            v-for="(item, index) in form.itens"
            :key="index"
            class="item-row"
          >
            <div class="field">
              <label>Beneficiário (PrecCP)</label>

              <input
                v-model="item.beneficiarioId"
                type="text"
                required
              />
            </div>

            <div class="field">
              <label>Descrição</label>

              <input
                v-model="item.descricao"
                type="text"
                required
              />
            </div>

            <div class="field valor-field">
              <label>Valor</label>

              <input
                v-model.number="item.valor"
                type="number"
                min="0"
                step="0.01"
                required
              />
            </div>

            <button
              type="button"
              class="remove-button"
              :disabled="form.itens.length === 1"
              @click="removerItem(index)"
            >
              Remover
            </button>
          </div>
        </div>

        <p v-if="erro" class="error-message">
          {{ erro }}
        </p>

        <div class="actions">
          <router-link
            to="/espelhos"
            class="cancel-button"
          >
            Cancelar
          </router-link>

          <button
            type="submit"
            class="submit-button"
            :disabled="enviando"
          >
            {{ enviando ? 'Criando...' : 'Criar espelho' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const form = reactive({
  atendimentoId: null,
  ocsId: '',
  itens: [
    {
      beneficiarioId: '',
      descricao: '',
      valor: null
    }
  ]
})

const erro = ref('')
const enviando = ref(false)

function adicionarItem() {
  form.itens.push({
    beneficiarioId: '',
    descricao: '',
    valor: null
  })
}

function removerItem(index) {
  form.itens.splice(index, 1)
}

async function enviar() {
  erro.value = ''
  enviando.value = true

  try {
    await axios.post('http://localhost:8080/espelhos', {
      atendimentoId: form.atendimentoId,
      ocsId: form.ocsId,
      itens: form.itens
    })

    router.push('/espelhos')
  } catch (error) {
    erro.value =
      error.response?.data ||
      'Não foi possível criar o espelho.'
  } finally {
    enviando.value = false
  }
}
</script>

<style scoped>
.criar-espelho-page {
  min-height: 100vh;
  padding: 2.5rem 1.5rem;
  background-color: var(--color-background);
}

.page-content {
  width: min(800px, 100%);
  margin: 0 auto;
}

.back-link {
  display: inline-block;
  margin-bottom: 1.5rem;
  color: var(--secondary-text-color);
  font-size: 0.85rem;
  text-decoration: none;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h1 {
  margin: 0;
  color: var(--text-color);
  font-family: "DM Sans", sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
}

.page-header p {
  margin: 0.4rem 0 0;
  color: var(--text-light-color);
  font-size: 0.9rem;
}

.section-card {
  padding: 1.5rem;
  background-color: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: 16px;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field label {
  color: var(--text-color);
  font-size: 0.85rem;
  font-weight: 500;
}

.field input {
  width: 100%;
  min-width: 0;
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-family: "DM Sans", sans-serif;
  font-size: 0.9rem;
  outline: none;
}

.field input:focus {
  border-color: var(--primary-color);
}

.itens-section {
  margin-bottom: 1rem;
}

.itens-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.itens-header h2 {
  margin: 0;
  color: var(--text-color);
  font-size: 1rem;
  font-weight: 600;
}

.add-button {
  padding: 0.45rem 0.9rem;
  border: 1px solid var(--primary-color);
  border-radius: 9999px;
  background-color: var(--primary-light-bg-color);
  color: var(--secondary-text-color);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
}

.item-row {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr auto;
  gap: 0.75rem;
  align-items: end;
  margin-bottom: 1rem;
}

.remove-button {
  padding: 0.65rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: #ffffff;
  color: var(--tertiary-text-color);
  cursor: pointer;
}

.remove-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.error-message {
  margin: 1rem 0 0;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background-color: #FDEAEA;
  color: #C05A5A;
  font-size: 0.85rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.cancel-button {
  display: flex;
  align-items: center;
  padding: 0.7rem 1.2rem;
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  color: var(--tertiary-text-color);
  font-size: 0.85rem;
  text-decoration: none;
}

.submit-button {
  padding: 0.7rem 1.4rem;
  border: none;
  border-radius: 9999px;
  background-color: var(--primary-color);
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .criar-espelho-page {
    padding: 1.5rem 1rem;
  }

  .section-card {
    padding: 1rem;
  }

  .field-row,
  .item-row {
    grid-template-columns: 1fr;
  }

  .itens-header {
    align-items: stretch;
    flex-direction: column;
    gap: 0.75rem;
  }

  .add-button {
    width: 100%;
  }

  .actions {
    flex-direction: column-reverse;
  }

  .cancel-button,
  .submit-button {
    width: 100%;
    justify-content: center;
    text-align: center;
  }
}
</style>