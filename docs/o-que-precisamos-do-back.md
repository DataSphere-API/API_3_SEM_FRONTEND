# O que o front precisa do back para entregar o escopo da Sprint

Regra combinada: **mexer o mínimo no back**. O front foi adaptado para usar o que as issues já
preveem e o banco que já existe. Só entra aqui o que não tem como evitar.

Legenda:
- ✅ **Já existe** (no `dev` ou num PR aberto) — o back não precisa fazer nada.
- 🔧 **Ajuste pequeno** numa issue que já existe — uma regra ou um campo a mais no DTO.
- 🆕 **Novo** — não tem issue. Precisa criar.

Erros sempre no formato da US000-12: `{ "codigo": "...", "mensagem": "..." }`. A tela mostra a `mensagem`.

## Resumo para o time

- **Banco:** só **2 colunas novas** — `Sessao_Procedimento.Data_Confirmacao` e `Espelho.Motivo_Reprovacao`.
- **Ajustar issues existentes:** #41 (contrato do login), #75 e #76 (campos a mais no DTO),
  **#77 (aprovação dupla: médico + chefe)**, #72 e #92 (check mútuo).
- **Criar issues novas:** autocadastro, usuários, OCS, procedimentos (listar e cadastrar), contratos, médicos, busca de
  beneficiários, criar/editar pré-guia, confirmar/recusar sessão, aprovar/reprovar espelho.

## Como testar o front sem o back

`npm run dev` com `VITE_USE_MOCK=true`. Senha de todos: `fusex123`. Os mocks em `src/mocks/` seguem
exatamente os contratos abaixo e servem de referência para o back.

| Perfil | CPF |
|---|---|
| Chefe do FUSEx | 526.018.159-06 |
| Médico | 083.016.613-05 |
| Emissor | 186.091.390-34 |
| Auditor | 996.030.824-30 |
| OCS (Clínica Imagem Centro) | 628.194.821-12 |
| Beneficiário | 993.518.190-19 |

Militares da equipe também são beneficiários (ver item 1), então escolhem o perfil depois de entrar.
Autocadastro: Prec-CP `123456` + nascimento `21/07/1990`. Para zerar os dados, apague a chave
`fusex-banco-mock-v3` do Local Storage. Para testar o check mútuo, abra a OCS e o beneficiário em duas
abas do mesmo navegador (cada aba tem o seu login).

---

## 1. Login e níveis de acesso

| | O quê | Por quê |
|---|---|---|
| 🆕 | **Definir o contrato da #41**: `POST /auth/login` com `{ cpf, senha }` → `{ token, usuario: { id, nome, cpf, perfis: [...], precCp, crm, ocsCnpj, cargo } }`. Erro 401 `CREDENCIAIS_INVALIDAS` | A issue não diz o formato. Sem isso nenhuma tela funciona com o back |
| 🆕 | Cada endpoint confere o perfil do token (ex.: só CHEFE cadastra usuário) | Hoje qualquer um chama qualquer endpoint |

O front manda `Authorization: Bearer <token>` em toda chamada e volta para o login num 401.

**Banco: nada.** `Usuario.Login` guarda o CPF. Os perfis saem das tabelas que já existem:
`Chefe_Fusex` → CHEFE · `Medico` → MEDICO · `Analista` → EMISSOR · `Auditor` → AUDITOR ·
`FunOcs` → OCS · `Beneficiario.Usuario_ID` preenchido → BENEFICIARIO.

Consequência do banco: `Medico`, `Analista`, `Chefe_Fusex` e `Auditor` só se ligam ao `Usuario` pelo
`Benef_ID` → `Beneficiario.Usuario_ID`. Então **todo militar da equipe também tem o perfil BENEFICIARIO**.
O `nome` do usuário vem do `Beneficiario`; para funcionário de OCS (que não tem nome no banco), o front
mostra `cargo · nome da OCS`.

## 2. Criação de usuários

| | O quê | Por quê |
|---|---|---|
| 🆕 | `POST /auth/cadastro` (sem login) com `{ precCp, dataNascimento, cpf, senha }`. Confere Prec-CP + data de nascimento na tabela `Beneficiario`, cria o `Usuario` e preenche `Beneficiario.Usuario_ID`. Resposta `{ id, nome }`. Erros: 422 `BENEFICIARIO_NAO_CONFERE`, 409 `BENEFICIARIO_JA_CADASTRADO`, 409 `CPF_JA_CADASTRADO` | O beneficiário se cadastra sozinho (decisão da reunião) |
| 🆕 | `GET /usuarios` → lista no formato do `usuario` do login | Tela do chefe |
| 🆕 | `POST /usuarios` — militar: `{ tipo: "MILITAR", precCp, cpf, senha, perfis: ["MEDICO", ...], crm }` → cria as linhas em `Medico`/`Analista`/`Chefe_Fusex`/`Auditor` pelo `Benef_ID`. **Se o Prec-CP já tem usuário, só acrescenta os perfis — nesse caso o front não manda `cpf` nem `senha`** (o login e a senha continuam os da pessoa). Funcionário de OCS: `{ tipo: "OCS", cpf, senha, ocsCnpj, cargo }` → linha em `FunOcs`. Erros: 404 `BENEFICIARIO_NAO_ENCONTRADO`, 409 `CPF_JA_CADASTRADO`, 422 `PERFIL_OBRIGATORIO`, 422 `MEDICO_SEM_CRM`, 422 `OCS_NAO_ENCONTRADA` | Escopo: chefe cadastra emissor e médico |
| 🆕 | `GET /medicos` → `[{ id, nome, crm }]` (o `id` é o do usuário) | O emissor escolhe o médico responsável |
| 🆕 | `GET /beneficiarios?busca=` → `[{ precCp, nome, dataNascimento, dependente, ug }]` (nome ou Prec-CP) | Escolher o paciente e o militar |

**Banco: nada.** Ficou fora das telas o que não tem coluna: e-mail, telefone, posto/graduação,
"usuário ativo", UF do CRM e edição de usuário.

## 3. OCS e contratos

| | O quê |
|---|---|
| 🆕 | `GET /ocs` e `POST /ocs` com `{ cnpj, nome }`. Erro 409 `OCS_JA_CADASTRADA` |
| 🆕 | `GET /procedimentos` → `[{ id, nome }]` e `POST /procedimentos` com `{ nome }` → `{ id, nome }`. Erro 409 `PROCEDIMENTO_JA_CADASTRADO` (mesmo nome, sem diferenciar maiúsculas) |
| 🆕 | `GET /contratos` → `[{ id, ocsCnpj, procedimentoId, valor, ocsNome, procedimentoNome }]` e `POST /contratos` com `{ ocsCnpj, procedimentoId, valor }`. Erros: 422 `VALOR_INVALIDO`, 409 `CONTRATO_DUPLICADO` (mesmo procedimento + OCS) |

**Banco: nada.** Ficou fora: nome fantasia, endereço, telefone, tipo de serviço, OCS ativa, número e
vigência do contrato.

## 4. Fluxo de aprovação da pré-guia

Status das issues. O **"Enviar para aprovação" do emissor é a validação da US006 (#82)**.

```
Emissor/Médico cria ─► PRE_GUIA ─(Enviar = validar)─► VALIDADA ─(Médico e Chefe aprovam)─► APROVADA ─(Emissor emite)─► EMITIDA
                          ▲               │                        │
                          └── edita ── COM_PENDENCIAS              └─(Médico ou Chefe reprova)─► REPROVADA
```

| | O quê | Issue |
|---|---|---|
| 🆕 | `POST /pre-guias` com `{ beneficiarioPrecCp, medicoId, procedimentos: [{ procedimentoId, ocsCnpj, quantidade }] }` → nasce `PRE_GUIA`; devolve o detalhe. Erro 400 `DADOS_OBRIGATORIOS` | — |
| 🆕 | `PUT /pre-guias/{id}` com o mesmo corpo, só em `PRE_GUIA` ou `COM_PENDENCIAS` (volta para `PRE_GUIA`). Erro 409 `PRE_GUIA_STATUS_INVALIDO` | — |
| ✅ | `POST /pre-guias/{id}/validar` → `{ preGuiaId, status, validada, pendencias: [{ codigo, atendimentoId, mensagem }] }` | #81, #82 |
| 🔧 | `GET /pre-guias?status=` — acrescentar no resumo `medicoAprovou`, `chefeAprovou` (booleanos) e `dataEmissao`. **Para o perfil MEDICO, devolver só as pré-guias em que ele é o `Med_ID`.** O AUDITOR também lê (histórico) | #75 |
| 🔧 | `GET /pre-guias/{id}` — acrescentar `medico { id, nome, crm }`, `procedimentoId` em cada procedimento, `dataCriacao`, `dataAprovacaoMedico`, `dataAprovacaoChefe`, `motivoReprovacao`, `dataEmissao`, `validoAte` | #76 |
| 🔧 | `PATCH /pre-guias/{id}/aprovar` — **a mudança mais importante.** Aceita MEDICO (só o `Med_ID` da pré-guia; senão 403 `MEDICO_NAO_RESPONSAVEL`) **ou** CHEFE, pelo token. Grava `Data_Aprovacao_Medico` ou `Data_Aprovacao_Chefe`; só vira `APROVADA` quando as duas estão preenchidas. Resposta `{ preGuiaId, status, dataAprovacaoMedico, dataAprovacaoChefe }`. Erros: 409 `PRE_GUIA_NAO_VALIDADA`, 409 `APROVACAO_JA_REGISTRADA`. Tirar o header `X-Chefe-Id` | #77 |
| 🔧 | `PATCH /pre-guias/{id}/reprovar` com `{ motivo }` — também pelo MEDICO ou CHEFE → `REPROVADA` | #77 |
| ✅ | `POST /pre-guias/{id}/emitir` → `{ guiaId, status, dataEmissao, validoAte, procedimentos }` | #78 |

Quando o médico cria a solicitação, o front chama em seguida `validar` e `aprovar`, então a aprovação
dele já sai registrada. **Banco: nada** — a V8 (PR #23) já tem `Med_ID`/`Chefe_ID` opcionais,
`Data_Aprovacao_Medico`, `Data_Aprovacao_Chefe` e `Motivo_Reprovacao`.

Ficou fora das telas (não tem coluna): CID-10, caráter, justificativa clínica, observações do emissor,
médico externo e o "devolver" (ficou só aprovar/reprovar, como na reunião).

## 5. Check mútuo (OCS ↔ beneficiário)

A OCS clica em "Realizar procedimento", o beneficiário confirma no app, e só então a sessão conta.
Aproveita a **US004-6 (#72)**, que já registra sessões em `Sessao_Procedimento`.

| | O quê | Issue |
|---|---|---|
| 🔧 | `GET /ocs/{cnpj}/atendimentos` → `[{ atendimentoId, guiaId, beneficiario { precCp, nome }, procedimento, ocs { cnpj, nome }, qtdAutorizada, qtdRealizada, statusProcedimento, dataValidade, sessaoPendente: { id, numeroSessao, dataRealizacao } \| null }]` | #92 |
| 🔧 | `POST /atendimentos/{id}/sessoes` com `{ cnpj }` — a sessão nasce **aguardando confirmação**. Se já tem uma pendente: 409 `SESSAO_AGUARDANDO_CONFIRMACAO` | #72 |
| 🔧 | `qtdRealizada` conta **só sessões confirmadas** | #72, #64 |
| 🆕 | `DELETE /atendimentos/{id}/sessoes/{sessaoId}` — a OCS cancela um pedido pendente | — |
| 🆕 | `GET /beneficiarios/{precCp}/sessoes-pendentes` → `[{ sessaoId, atendimentoId, numeroSessao, qtdAutorizada, procedimento, ocs { nome }, guiaNumero, dataRealizacao }]` | — |
| 🆕 | `PATCH /sessoes/{id}/confirmar` — grava a confirmação; na última sessão o procedimento vira `REALIZADA` (reaproveita o recálculo da US004-3) e grava o histórico. Devolve o atendimento | — |
| 🆕 | `PATCH /sessoes/{id}/recusar` — "não fui atendido": apaga a sessão pendente (a numeração continua sem buracos) | — |

```sql
ALTER TABLE Sessao_Procedimento ADD COLUMN Data_Confirmacao TIMESTAMP; -- nula = aguardando o beneficiário
```

A baixa por QR (US004-3) deixa de ser necessária para o fluxo. O "Minhas guias" do beneficiário usa o
`GET /beneficiarios/{precCp}/guias` (#64) com o Prec-CP do login.

## 6. Auditor

| | O quê | Issue |
|---|---|---|
| ✅ | `GET /espelhos` (receber), `GET /espelhos/{id}/itens` | US001-5 |
| 🔧 | Acrescentar `motivoReprovacao` no `EspelhoResumoResponse` | US000-14 |
| 🆕 | `PATCH /espelhos/{id}/aprovar` e `PATCH /espelhos/{id}/reprovar` com `{ motivo }` → status `APROVADO` / `REPROVADO`, grava o histórico. Erros: 409 `ESPELHO_JA_AUDITADO`, 400 `MOTIVO_OBRIGATORIO` | — |
| ✅ | `GET /guias/{id}/historico` (o `id` é do Guia_Proc = atendimento) e `GET /espelhos/{id}/historico` | US001-3 |

```sql
ALTER TABLE Espelho ADD COLUMN Motivo_Reprovacao VARCHAR(255);
```
Os status `APROVADO` e `REPROVADO` entram só no enum `StatusEspelho` (a coluna `Status VARCHAR(20)` já comporta).

## 7. OCS — enviar espelho

| | O quê |
|---|---|
| ✅ | `POST /espelhos` e `GET /espelhos?cnpj=` (US001-4/5). O front manda o CNPJ do login e só lista os espelhos da OCS logada. O espelho só deve ser aceito para atendimento `REALIZADA` (já é a regra da US001-4) |

## Ainda no front, fora deste pacote

- As telas de faturas, lisura, divergências e a antiga tela de atendimento por QR ainda chamam `axios`
  com `http://localhost:8080` fixo (sem token). A tela antiga `/pre-guias` (US006-5) continua no router
  só para o CHEFE, fora do menu.
