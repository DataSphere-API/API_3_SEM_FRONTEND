# Sprint 3 — o que o back precisa fazer

As telas estão prontas e rodando com dados de teste. Para funcionarem com o banco, falta o back abaixo.
**O banco quase não muda: só 1 coluna nova.**

---

## Passo 1 — Arrumar a casa (antes de tudo)

- [ ] Trocar a base dos PRs **#21, #22, #24, #25, #26 e #28** de `main` para `dev`
- [ ] Fazer o merge do **PR #23** (V8). Sem ele a pré-guia não existe no banco
- [ ] Depois do #23, a próxima migration é a **V9**. Não pode ter número repetido
- [ ] Status sempre em **MAIÚSCULO** (`REALIZADA`, e não `Realizada`)
- [ ] Erro sempre no formato `{ "codigo": "...", "mensagem": "..." }`

---

## Passo 2 — O que cada um faz

### @vncssd
- [ ] **#91 e #74:** carga de dados de teste (copiar os dados de `src/mocks/bancoMock.js` do front)
- [ ] **#92 (PR #20):** manter o `atendimentoId` no item do espelho
- [ ] **#92:** `GET /ocs/{cnpj}/atendimentos` devolver um DTO (hoje devolve a entidade) e lista vazia em vez de 404
- [ ] **#51:** na fatura, cada item usa o contrato do próprio atendimento

### @Glei-Rezende
- [ ] **#72 (PR #25):** tirar a V7 e a V8 do PR. O que faltar vira V9
- [ ] **#72:** a cada sessão, atualizar o status: `EM_ANDAMENTO`, ou `REALIZADA` na última

### @carolinaamedeiros
- [ ] **#77 (PR #27):** o **médico também aprova** (header `X-Medico-Id`, além do `X-Chefe-Id`)
- [ ] **#77:** gravar na tabela `Guia` (apagar a V10 e a tabela `Pre_Guia`). Só vira `APROVADA` quando médico **e** chefe aprovarem
- [ ] **#78:** emitir a guia

### @Rafael-SantosR
- [ ] **#76:** abrir o PR (a branch existe, o PR não)
- [ ] **#76, #64 e #82:** trocar os dados fixos pela leitura do banco (depois do #23)
- [ ] **#64:** corrigir o campo `procedimAentos` → `procedimentos`

### @matquirin0
- [ ] **#41:** login — `POST /auth/login` com `{ cpf, senha }`
- [ ] **#75:** listar pré-guias
- [ ] **#49:** espelho com **vários atendimentos** e período (`dataInicio`, `dataFim`, `atendimentoId` em cada item)
- [ ] **#55:** no encaminhar fatura, tirar a regra "todos os itens autorizados"

---

## Passo 3 — Issues novas (sem dono ainda)

| | O que é | Endpoints |
|---|---|---|
| 1 | Autocadastro do beneficiário | `POST /auth/cadastro` |
| 2 | Usuários (o chefe dá perfis) | `GET/POST /usuarios`, `GET /medicos`, `GET /beneficiarios?busca=` |
| 3 | OCS, procedimentos e contratos | `GET/POST /ocs`, `/procedimentos`, `/contratos` |
| 4 | Criar e editar pré-guia | `POST /pre-guias`, `PUT /pre-guias/{id}` |
| 5 | Check mútuo (OCS pede, beneficiário confirma) | `POST/DELETE /atendimentos/{id}/pedido-confirmacao`, `GET /beneficiarios/{precCp}/confirmacoes-pendentes` |
| 6 | Reprovar e reenviar espelho | `PATCH /espelhos/{id}/reprovar`, `POST /espelhos/{id}/reenviar` |
| 7 | Chefe cadastra beneficiário | `POST /beneficiarios` (Prec-CP, nome, nascimento) |

**A única mudança no banco:**
```sql
ALTER TABLE Espelho ADD COLUMN Motivo_Reprovacao VARCHAR(255);
```

---

## Regras combinadas

- **Usuário:** militar e beneficiário criam o próprio login no autocadastro. O chefe só dá perfis.
  Funcionário de OCS é o único que o chefe cria com CPF e senha.
- **Aprovar espelho** = `POST /faturas` (já existe). Não precisa endpoint novo.
- **Fatura mensal:** o back continua com uma fatura por espelho; o front junta por mês.

## Ordem

1. Passo 1 + login (#41)
2. Espelho e fatura (#49, #51, #55, issue 6)
3. Cadastros e pré-guia (issues 2, 3, 4 + #75, #76, #77, #78)
4. Check mútuo (#72 + issue 5)

---

Formato dos JSON de cada endpoint: [`o-que-precisamos-do-back.md`](o-que-precisamos-do-back.md).
Levantamento completo, tela por tela: [`integracao-sprint3-detalhes.md`](integracao-sprint3-detalhes.md).
