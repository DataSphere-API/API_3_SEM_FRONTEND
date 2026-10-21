# O que o front precisa do back para entregar o escopo da Sprint

Regra combinada: **mexer o mínimo no back**. Usamos o que as issues já preveem e o banco que já
existe; quando der, quem se adapta é o front. Só entra aqui o que não tem como evitar.

Legenda:
- ✅ **Já existe** (no `dev` ou num PR aberto) — o back não precisa fazer nada.
- 🔧 **Ajuste pequeno** numa issue que já existe — mudar uma regra ou acrescentar um campo no DTO.
- 🆕 **Novo** — não tem issue. Precisa criar.

Erros sempre no formato da US000-12: `{ "codigo": "...", "mensagem": "..." }`.

---

## 1. Login e níveis de acesso

| | O quê | Por quê |
|---|---|---|
| 🆕 | **Definir o contrato da #41 (Spring Security)**: `POST /auth/login` com `{ cpf, senha }` devolvendo `{ token, usuario: { id, nome, perfis: [...], precCp, ocsCnpj } }` | A issue não diz o formato. Sem isso nenhuma tela funciona com o back |
| 🆕 | O token tem que levar o perfil, e cada endpoint confere o perfil (ex.: só CHEFE aprova como chefe) | Hoje qualquer um chama qualquer endpoint |

**Banco: nada.** O `Usuario` já tem `Login` (vai guardar o CPF) e `Senha`. O perfil sai das tabelas
que já existem: tem linha em `Chefe_Fusex` → CHEFE; em `Medico` → MEDICO; em `Analista` → EMISSOR;
em `Auditor` → AUDITOR; em `FunOcs` → OCS; `Beneficiario.Usuario_ID` preenchido → BENEFICIARIO.

## 2. Criação de usuários

| | O quê | Por quê |
|---|---|---|
| 🆕 | `POST /auth/cadastro` — autocadastro do beneficiário: `{ precCp, dataNascimento, cpf, senha }`. Confere Prec-CP + data de nascimento na tabela `Beneficiario`, cria o `Usuario` e preenche `Beneficiario.Usuario_ID` | Decisão da reunião: o beneficiário se cadastra sozinho |
| 🆕 | `GET /usuarios` e `POST /usuarios` — o chefe cria a equipe: `{ precCp, cpf, senha, perfis: [...], crm }` para militar (cria as linhas em `Medico`/`Analista`/`Chefe_Fusex`/`Auditor` pelo `Benef_ID`); `{ cpf, senha, ocsCnpj, cargo }` para funcionário de OCS (linha em `FunOcs`) | Escopo: chefe cadastra emissor e médico |
| 🆕 | `GET /beneficiarios?busca=` — busca por nome ou Prec-CP | Para escolher o paciente e o militar no cadastro |

**Banco: nada.** Fica tudo nas tabelas que já existem. O que **não** cabe no banco e por isso o front
vai **tirar** das telas: e-mail, telefone, posto/graduação, "usuário ativo" e UF do CRM.

## 3. OCS e contratos

| | O quê | Por quê |
|---|---|---|
| 🆕 | `GET /ocs`, `POST /ocs` com `{ cnpj, nome }` | Escopo: chefe cadastra OCS |
| 🆕 | `GET /procedimentos` | Para montar contrato e pré-guia |
| 🆕 | `GET /contratos`, `POST /contratos` com `{ ocsCnpj, procedimentoId, valor }` | Escopo: chefe cadastra contrato |

**Banco: nada.** O front vai **tirar** das telas o que não tem coluna: nome fantasia, endereço,
telefone, tipo de serviço e OCS ativa; número e vigência do contrato.

## 4. Fluxo de aprovação da pré-guia

O front passa a usar os **status das issues** (`PRE_GUIA`, `COM_PENDENCIAS`, `VALIDADA`, `APROVADA`,
`REPROVADA`, `EMITIDA`) e o botão **"Enviar para aprovação" do emissor chama a validação da US006**.

```
Emissor/Médico cria ─► PRE_GUIA ─(Enviar para aprovação = validar)─► VALIDADA ─(Médico e Chefe aprovam)─► APROVADA ─(Emissor emite)─► EMITIDA
                                         │                                 │
                                         └─► COM_PENDENCIAS                └─(Médico ou Chefe reprova)─► REPROVADA
                                             (emissor edita e reenvia)
```

| | O quê | Issue | Por quê |
|---|---|---|---|
| 🆕 | `POST /pre-guias` — `{ beneficiarioPrecCp, medicoId, procedimentos: [{ procedimentoId, ocsCnpj, quantidade }] }`, nasce `PRE_GUIA` | — | As issues só usam pré-guias do seed; ninguém cria |
| 🆕 | `PUT /pre-guias/{id}` — mesmo corpo, só em `PRE_GUIA` ou `COM_PENDENCIAS` | — | Escopo: emissor edita a guia |
| 🆕 | `GET /medicos` | — | O emissor escolhe o médico responsável (`Guia.Med_ID`) |
| ✅ | `POST /pre-guias/{id}/validar` | #82 | Vira o "Enviar para aprovação" |
| 🔧 | `GET /pre-guias` | #75 | Acrescentar no resumo: `medicoAprovou` e `chefeAprovou` (booleanos) |
| 🔧 | `GET /pre-guias/{id}` | #76 | Acrescentar: `dataAprovacaoMedico`, `dataAprovacaoChefe`, `motivoReprovacao` |
| 🔧 | `PATCH /pre-guias/{id}/aprovar` e `/reprovar` | #77 | **A mudança mais importante.** Hoje só o chefe aprova. Passa a aceitar MEDICO **ou** CHEFE (pelo token): grava `Data_Aprovacao_Medico` ou `Data_Aprovacao_Chefe`; só vira `APROVADA` quando as duas datas estão preenchidas. Reprovar por qualquer um → `REPROVADA`. Tirar o header `X-Chefe-Id` |
| ✅ | `POST /pre-guias/{id}/emitir` | #78 | Igual |

**Banco: nada.** A V8 (PR #23) já tem `Med_ID` e `Chefe_ID` opcionais, `Data_Aprovacao_Medico`,
`Data_Aprovacao_Chefe` e `Motivo_Reprovacao`.

O front vai **tirar** o que não tem coluna: CID-10, caráter, justificativa clínica, observações do
emissor, resposta ao aprovador, médico externo e o botão "Devolver" (fica só aprovar/reprovar, como
na reunião).

## 5. Check mútuo (OCS ↔ beneficiário)

A OCS clica em "Realizar procedimento", o beneficiário confirma no app, e só então a sessão conta.
Aproveita a **US004-6 (#72)**, que já registra sessões na tabela `Sessao_Procedimento`.

| | O quê | Issue | Por quê |
|---|---|---|---|
| 🔧 | `GET /ocs/{cnpj}/atendimentos` — acrescentar no DTO: `beneficiario { precCp, nome }`, `procedimento`, `guiaNumero`, `qtdAutorizada`, `qtdRealizada`, `statusProcedimento`, `dataValidade`, `sessaoPendente { id, numeroSessao, dataRealizacao } \| null` | #92 (AtendimentoResponse) | A OCS precisa ver o que tem para fazer |
| 🔧 | `POST /atendimentos/{id}/sessoes` com `{ cnpj }` — a sessão nasce **aguardando confirmação**. Não deixa abrir outra se já tem uma pendente: 409 `SESSAO_AGUARDANDO_CONFIRMACAO` | #72 | É o "Realizar procedimento" |
| 🔧 | `qtdRealizada` conta só sessões **confirmadas** | #72, #64 | Senão a OCS sozinha dá baixa |
| 🆕 | `DELETE /atendimentos/{id}/sessoes/{sessaoId}` — a OCS cancela um pedido pendente | — | Se clicou errado |
| 🆕 | `GET /beneficiarios/{precCp}/sessoes-pendentes` → `[{ sessaoId, atendimentoId, numeroSessao, qtdAutorizada, procedimento, ocs { nome }, guiaNumero, dataRealizacao }]` | — | O que o beneficiário tem para confirmar |
| 🆕 | `PATCH /sessoes/{id}/confirmar` — grava a confirmação. Se for a última sessão, o procedimento vira `REALIZADA` (reaproveita a regra de recálculo da US004-3) | — | É o "dar baixa" do beneficiário |
| 🆕 | `PATCH /sessoes/{id}/recusar` — "não fui atendido": apaga a sessão pendente (a numeração continua sem buracos) | — | O beneficiário nega |

**Banco: 1 coluna.**
```sql
ALTER TABLE Sessao_Procedimento ADD COLUMN Data_Confirmacao TIMESTAMP; -- nula = aguardando o beneficiário
```

A baixa por QR (US004-3 / #69) deixa de ser necessária para o fluxo.

## 6. Auditor

| | O quê | Issue | Por quê |
|---|---|---|---|
| ✅ | `GET /espelhos` (receber) | US001-5 | Igual |
| ✅ | `GET /guias/{id}/historico` e `GET /espelhos/{id}/historico` | US001-3 | Igual — falta só a tela no front |
| 🆕 | `PATCH /espelhos/{id}/aprovar` e `PATCH /espelhos/{id}/reprovar` com `{ motivo }` | — | Escopo: auditor aprova/reprova espelho |

**Banco: 1 coluna** e 2 valores novos no enum `StatusEspelho` (`APROVADO`, `REPROVADO`; a coluna
`Status VARCHAR(20)` já comporta, sem migration):
```sql
ALTER TABLE Espelho ADD COLUMN Motivo_Reprovacao VARCHAR(255);
```

## 7. OCS — enviar espelho

| | O quê | Por quê |
|---|---|---|
| ✅ | `POST /espelhos`, `GET /espelhos?cnpj=` | Já existe. O front só passa a filtrar pelo CNPJ da OCS logada |

---

## Resumo para o time

- **Banco:** só **2 colunas novas** (`Sessao_Procedimento.Data_Confirmacao` e `Espelho.Motivo_Reprovacao`).
- **Ajustar issues existentes:** #41 (contrato do login), #75 e #76 (campos a mais no DTO),
  **#77 (aprovação dupla)**, #72 e #92 (check mútuo).
- **Criar issues novas:** autocadastro, usuários, OCS, procedimentos, contratos, médicos, busca de
  beneficiários, criar/editar pré-guia, confirmar/recusar sessão, aprovar/reprovar espelho.
