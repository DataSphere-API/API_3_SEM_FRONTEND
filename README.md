# FUSEx — Frontend

Interface web do sistema de gestão integrada de guias, atendimentos, espelhos e faturamento médico-hospitalar do **FUSEx (Fundo de Saúde do Exército)** em parceria com as Organizações Civis de Saúde (OCS/PSA), desenvolvido pelo time **DataSphere**.

Construído com **Vue 3**, **Vite** e **Pinia**.

---

## 📋 Pré-requisitos

- **Node.js**: versão `>= 22.18.0` (recomendado LTS)
- **npm**: versão `>= 10`

---

## ⚙️ Variáveis de Ambiente

Copie o arquivo de exemplo para configurar o ambiente local:

```bash
cp .env.example .env
```

| Variável | Descrição | Padrão |
| :--- | :--- | :--- |
| `VITE_API_URL` | URL base da API backend (Spring Boot) | `http://localhost:8080` |

---

## 🚀 Instalação e Execução

### 1. Instalar as dependências

```bash
npm install
# ou para instalação estrita
npm ci
```

### 2. Rodar em modo de desenvolvimento

```bash
npm run dev
```

A aplicação ficará disponível em `http://localhost:5173`.

### 3. Build para produção

```bash
npm run build
```

Os artefatos otimizados serão gerados no diretório `dist/`.

---

## 🐳 Executando com Docker

### Build da imagem Docker

```bash
docker build --build-arg VITE_API_URL=http://localhost:8080 -t fusex-frontend .
```

### Executar o container

```bash
docker run -d -p 5173:80 --name fusex-frontend fusex-frontend
```

Acesse em `http://localhost:5173`.
