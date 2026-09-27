<template>
  <nav class="navbar">
    <span class="brand">FUSEX</span>

    <div class="links">
      <router-link to="/espelhos" class="link">
        Espelhos
      </router-link>

      <router-link to="/espelhos/novo" class="link">
        Novo espelho
      </router-link>

      <router-link to="/faturas" class="link">
        Faturas
      </router-link>
    </div>
  </nav>
</template>

<script setup>
</script>

<style scoped>
.navbar {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background-color: #ffffff;
  border-bottom: 1px solid var(--color-border);
}

.brand {
  color: var(--text-color);
  font-family: "DM Sans", sans-serif;
  font-weight: 700;
  font-size: 1.1rem;
}

.links {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.link {
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  color: var(--tertiary-text-color);
  font-family: "Vend Sans", sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  text-decoration: none;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.link:hover {
  background-color: var(--primary-light-bg-color);
  color: var(--secondary-text-color);
}

.router-link-active {
  background-color: var(--primary-color);
  color: #ffffff;
}

@media (max-width: 600px) {
  .navbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .links {
    flex-wrap: wrap;
  }
}
</style>