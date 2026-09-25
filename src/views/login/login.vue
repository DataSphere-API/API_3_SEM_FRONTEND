<template>
  <div class="login-screen">

    <!-- Área da logo -->
    <div class="brand-panel">
      <div class="logo-wrapper">
        <div class="logo-box">
          <span class="logo-placeholder">FUSEX</span>
        </div>
      </div>
    </div>

    <!-- Área do login -->
    <div class="form-panel">
      <div class="form-content">

        <h1 class="title">Bem-vindo de volta</h1>

        <p class="subtitle">
          Entre com suas credenciais para continuar
        </p>

        <form @submit.prevent="handleSubmit" class="login-form">

          <div class="field">
            <label for="email">E-mail</label>

            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div class="field">
            <label for="password">Senha</label>

            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <a href="#" class="forgot-link">
            Esqueci minha senha
          </a>

          <button type="submit" class="button submit-button">
            Entrar
          </button>

        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')
const password = ref('')

function handleSubmit() {
  // integrar com a lógica de autenticação
  console.log('login:', email.value, password.value)
}
</script>

<style scoped>
.login-screen {
  display: flex;
  min-height: 100vh;
  width: 100%;
  background-color: var(--tertiary-light-bg-color);
}

/* =========================
   PAINEL DA LOGO
   ========================= */

.brand-panel {
  flex: 0 0 60%;

  display: flex;
  align-items: center;
  justify-content: center;

  background-color: var(--primary-light-bg-color);
}

.logo-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-box {
  width: 180px;
  height: 180px;

  display: flex;
  align-items: center;
  justify-content: center;

  background-color: var(--primary-color);

  border-radius: 28px;

  box-shadow:
    0 12px 30px rgba(var(--primary-color-decimal), 0.18);
}

.logo-placeholder {
  color: #ffffff;

  font-family: "DM Sans", sans-serif;
  font-size: 1.5rem;
  font-weight: 700;

  letter-spacing: 0.05em;
}


/* =========================
   PAINEL DO LOGIN
   ========================= */

.form-panel {
  flex: 0 0 40%;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 2rem;

  background-color: var(--tertiary-light-bg-color);
}

.form-content {
  width: 100%;
  max-width: 360px;
}


/* =========================
   TEXTOS
   ========================= */

.title {
  margin: 0 0 0.5rem;

  color: var(--text-color);

  font-family: "DM Sans", sans-serif;
  font-size: 1.7rem;
  font-weight: 700;
}

.subtitle {
  margin: 0 0 2rem;

  color: var(--text-light-color);

  font-size: 0.9rem;
  line-height: 1.5;
}


/* =========================
   FORMULÁRIO
   ========================= */

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.field label {
  color: var(--text-color);

  font-size: 0.85rem;
  font-weight: 500;
}

.field input {
  width: 100%;

  padding: 0.8rem 1rem;

  border: 1px solid var(--color-border);
  border-radius: 10px;

  color: var(--text-color);
  background-color: #ffffff;

  font-family: "DM Sans", sans-serif;
  font-size: 0.95rem;

  outline: none;

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.field input::placeholder {
  color: var(--text-light-color);
  opacity: 0.7;
}

.field input:focus {
  border-color: var(--primary-color);

  box-shadow:
    0 0 0 3px rgba(var(--primary-color-decimal), 0.10);
}


/* =========================
   LINK
   ========================= */

.forgot-link {
  align-self: flex-end;

  margin-top: -0.3rem;

  color: var(--secondary-text-color);

  font-size: 0.85rem;

  text-decoration: none;

  transition: color 0.2s ease;
}

.forgot-link:hover {
  color: var(--primary-dark-bg-color);
  text-decoration: underline;
}


/* =========================
   BOTÃO
   ========================= */

.submit-button {
  width: 100%;

  margin-top: 0.3rem;
  padding: 0.85rem 1.5rem;

  border: none;
  border-radius: 9999px;

  background-color: var(--primary-color);
  color: #ffffff;

  font-family: "Vend Sans", sans-serif;
  font-size: 1rem;
  font-weight: 500;

  cursor: pointer;

  box-shadow:
    0 6px 16px rgba(var(--primary-color-decimal), 0.18);

  transition:
    background-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.submit-button:hover {
  background-color: var(--primary-dark-bg-color);

  transform: translateY(-1px);

  box-shadow:
    0 8px 20px rgba(var(--primary-color-decimal), 0.22);
}

.submit-button:active {
  transform: translateY(0);
}


/* =========================
   RESPONSIVO
   ========================= */

@media (max-width: 768px) {
  .login-screen {
    flex-direction: column;
  }

  .brand-panel {
    flex: 0 0 auto;

    min-height: 180px;
    padding: 2rem;
  }

  .logo-box {
    width: 110px;
    height: 110px;

    border-radius: 22px;
  }

  .logo-placeholder {
    font-size: 1rem;
  }

  .form-panel {
    flex: 1;

    padding: 2rem 1.5rem;
  }

  .form-content {
    max-width: 400px;
  }
}
</style>