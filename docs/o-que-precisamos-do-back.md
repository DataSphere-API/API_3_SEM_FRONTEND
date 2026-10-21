# O que o front precisa do back

✅ já existe · 🔧 ajustar o que existe · 🆕 criar

**Banco: só 1 coluna nova** (no fim da página). Todo erro no formato `{ "codigo": "...", "mensagem": "..." }`.

---

## 1. Login e usuários

| | Endpoint | O que faz |
|---|---|---|
| 🆕 | `POST /auth/login` | Entra com CPF e senha |
| 🆕 | `POST /auth/cadastro` | Beneficiário cria o próprio login (primeiro acesso) |
| 🆕 | `GET /usuarios` | Lista os usuários (tela do chefe) |
| 🆕 | `POST /usuarios` | Chefe dá perfis a um militar ou cria funcionário de OCS |
| 🆕 | `GET /medicos` | Lista os médicos |
| 🆕 | `GET /beneficiarios?busca=` | Busca beneficiário por nome ou Prec-CP |

**Regra:** o login do militar nasce no autocadastro. O chefe só acrescenta perfis. Funcionário de OCS
é o único que o chefe cria com CPF e senha.

<details><summary>Ver detalhes</summary>

- `POST /auth/login` `{ cpf, senha }` → `{ token, usuario: { id, nome, cpf, perfis, precCp, crm, ocsCnpj, cargo } }`. Erro 401 `CREDENCIAIS_INVALIDAS`.
- Perfis: `Chefe_Fusex` → CHEFE · `Medico` → MEDICO · `Analista` → EMISSOR · `Auditor` → AUDITOR · `FunOcs` → OCS · `Beneficiario.Usuario_ID` → BENEFICIARIO.
- `POST /auth/cadastro` `{ precCp, dataNascimento, cpf, senha }` → `{ id, nome }`. Confere Prec-CP + nascimento no `Beneficiario`. Erros: 422 `BENEFICIARIO_NAO_CONFERE`, 409 `BENEFICIARIO_JA_CADASTRADO`, 409 `CPF_JA_CADASTRADO`.
- `POST /usuarios`, militar: `{ tipo: "MILITAR", precCp, perfis, crm }`. Erros: 422 `PRIMEIRO_ACESSO_PENDENTE`, 422 `PERFIL_OBRIGATORIO`, 422 `MEDICO_SEM_CRM`.
- `POST /usuarios`, OCS: `{ tipo: "OCS", cpf, senha, ocsCnpj, cargo }`. Erros: 409 `CPF_JA_CADASTRADO`, 422 `OCS_NAO_ENCONTRADA`.
- `GET /medicos` → `[{ id, nome, crm }]`.
- `GET /beneficiarios?busca=` → `[{ precCp, nome, dataNascimento, dependente, ug }]`.

</details>

## 2. OCS e contratos

| | Endpoint | O que faz |
|---|---|---|
| 🆕 | `GET/POST /ocs` | Lista e cadastra OCS (CNPJ + nome) |
| 🆕 | `GET/POST /procedimentos` | Lista e cadastra procedimentos |
| 🆕 | `GET/POST /contratos` | Lista e cadastra o valor de um procedimento numa OCS |

<details><summary>Ver detalhes</summary>

- `POST /ocs` `{ cnpj, nome }`. Erro 409 `OCS_JA_CADASTRADA`.
- `POST /procedimentos` `{ nome }` → `{ id, nome }`. Erro 409 `PROCEDIMENTO_JA_CADASTRADO`.
- `GET /contratos` → `[{ id, ocsCnpj, procedimentoId, valor, ocsNome, procedimentoNome }]`.
- `POST /contratos` `{ ocsCnpj, procedimentoId, valor }`. Erros: 422 `VALOR_INVALIDO`, 409 `CONTRATO_DUPLICADO`.

</details>

## 3. Pré-guia

| | Endpoint | O que faz |
|---|---|---|
| 🆕 | `POST /pre-guias` | Cria a pré-guia |
| 🆕 | `PUT /pre-guias/{id}` | Edita a pré-guia |
| 🔧 | `GET /pre-guias` | Lista (#75) |
| 🔧 | `GET /pre-guias/{id}` | Detalhe (#76) |
| ✅ | `POST /pre-guias/{id}/validar` | Envia para aprovação (#82) |
| 🔧 | `PATCH /pre-guias/{id}/aprovar` | Médico **ou** chefe aprova (#77) |
| 🔧 | `PATCH /pre-guias/{id}/reprovar` | Médico ou chefe reprova (#77) |
| ✅ | `POST /pre-guias/{id}/emitir` | Emite a guia (#78) |

**Regra:** `PRE_GUIA` → `VALIDADA` → `APROVADA` (só com médico **e** chefe) → `EMITIDA`. Reprovada vira `REPROVADA`.

<details><summary>Ver detalhes</summary>

- `POST` e `PUT` `{ beneficiarioPrecCp, medicoId, procedimentos: [{ procedimentoId, ocsCnpj, quantidade }] }`. Editar só em `PRE_GUIA` ou `COM_PENDENCIAS`.
- `GET /pre-guias`: incluir `medicoAprovou`, `chefeAprovou`, `dataEmissao`. O médico vê só as dele.
- `GET /pre-guias/{id}`: incluir `medico { id, nome, crm }`, `procedimentoId`, `dataAprovacaoMedico`, `dataAprovacaoChefe`, `motivoReprovacao`, `dataEmissao`, `validoAte`.
- `aprovar`: grava `Data_Aprovacao_Medico` ou `Data_Aprovacao_Chefe` (V8). Erros: 409 `PRE_GUIA_NAO_VALIDADA`, 409 `APROVACAO_JA_REGISTRADA`, 403 `MEDICO_NAO_RESPONSAVEL`.
- `reprovar` `{ motivo }`.

</details>

## 4. Check mútuo (OCS ↔ beneficiário)

A OCS avisa que fez o procedimento; a sessão só conta quando o beneficiário confirma.

| | Endpoint | O que faz |
|---|---|---|
| 🔧 | `GET /ocs/{cnpj}/atendimentos` | Atendimentos da OCS |
| 🔧 | `POST /atendimentos/{id}/sessoes` | OCS pede a confirmação (status `AGUARDANDO_CONFIRMACAO`) |
| 🆕 | `DELETE /atendimentos/{id}/pedido-confirmacao` | OCS desfaz o pedido |
| 🆕 | `GET /beneficiarios/{precCp}/confirmacoes-pendentes` | O que o beneficiário tem para confirmar |
| 🆕 | `PATCH /atendimentos/{id}/confirmar` | Beneficiário confirma: grava a sessão |
| 🆕 | `PATCH /atendimentos/{id}/recusar` | Beneficiário diz que não foi atendido |
| 🔧 | `GET /beneficiarios/{precCp}/guias` | Minhas guias (#64) |

<details><summary>Ver detalhes</summary>

- `GET /ocs/{cnpj}/atendimentos` → `[{ atendimentoId, guiaId, beneficiario { precCp, nome }, procedimento, ocs { cnpj, nome }, qtdAutorizada, qtdRealizada, statusProcedimento, aguardandoConfirmacao, dataValidade, dataRealizacao, espelhoId }]`. Lista vazia em vez de 404.
- `POST /sessoes` `{ cnpj }`: não grava a sessão, só muda o `Guia_Proc.Status`. Erro 409 `AGUARDANDO_CONFIRMACAO`.
- `GET confirmacoes-pendentes` → `[{ atendimentoId, numeroSessao, qtdAutorizada, procedimento, ocs { nome }, guiaNumero }]`.
- `confirmar`: grava em `Sessao_Procedimento` e muda para `EM_ANDAMENTO`, ou `REALIZADA` na última sessão.
- `recusar` e `DELETE`: o status volta ao anterior (0 sessões → `PENDENTE`, senão `EM_ANDAMENTO`).

</details>

## 5. Espelho (OCS)

Um espelho junta vários atendimentos de um mês, com o valor que a OCS cobra.

| | Endpoint | O que faz |
|---|---|---|
| 🔧 | `POST /espelhos` | Cria o espelho com vários atendimentos |
| ✅ | `GET /espelhos?cnpj=` | Espelhos da OCS |
| 🔧 | `PATCH /espelhos/{id}/itens/{itemId}` | Corrige o valor de um item |
| 🔧 | `DELETE /espelhos/{id}/itens/{itemId}` | Tira um item |
| 🆕 | `POST /espelhos/{id}/reenviar` | Reenvia o espelho reprovado |

**Regra:** só atendimentos do mês atual (até o dia 5, também do mês anterior).

<details><summary>Ver detalhes</summary>

- `POST /espelhos` `{ ocsId, dataInicio, dataFim, itens: [{ atendimentoId, valor }] }`. O back preenche `beneficiarioId` e `descricao`. `Espelho.Atendimento_ID` recebe o primeiro atendimento. Erros: 422 `ATENDIMENTO_NAO_REALIZADO`, 422 `FORA_DO_PERIODO`, 422 `FORA_DO_MES`, 409 `ATENDIMENTO_JA_EM_ESPELHO`, 400 `VALOR_INVALIDO`.
- `PATCH`/`DELETE` item: liberar também com o espelho `REPROVADO`. Erro 422 `ESPELHO_SEM_ITENS`.
- `reenviar`: `REPROVADO` → `EM_ABERTO`. Erro 409 `ESPELHO_NAO_REPROVADO`.
- No resumo do espelho: `devolucoes` (quantas vezes foi reprovado) e `motivoReprovacao`.

</details>

## 6. Auditor

| | Endpoint | O que faz |
|---|---|---|
| ✅ | `GET /espelhos` | Espelhos recebidos |
| 🔧 | `GET /espelhos/{id}/itens` | Itens com o valor do contrato |
| 🆕 | `PATCH /espelhos/{id}/aprovar` | Aprova (entra na fatura do mês) |
| 🆕 | `PATCH /espelhos/{id}/reprovar` | Reprova com motivo (volta para a OCS) |
| ✅ | `GET /guias/{id}/historico` | Histórico do atendimento |
| ✅ | `GET /espelhos/{id}/historico` | Histórico do espelho |

A pontuação (contrato × cobrado) é calculada no front.

<details><summary>Ver detalhes</summary>

- `GET itens`: manter `atendimentoId` e incluir `valorContratado` (`null` sem contrato).
- `aprovar` e `reprovar { motivo }`: status `APROVADO` / `REPROVADO`. Erros: 409 `ESPELHO_JA_AUDITADO`, 400 `MOTIVO_OBRIGATORIO`, 409 `FATURA_JA_ENCAMINHADA`.

</details>

## 7. Fatura mensal

Uma fatura por OCS por mês, com os espelhos aprovados. Não tem mais gerar nem regerar fatura.

| | Endpoint | O que faz |
|---|---|---|
| 🔧 | `GET /faturas?cnpj=&competencia=` | Lista as faturas do mês |
| 🔧 | `GET /faturas/{id}` | Fatura com os espelhos e itens |
| 🔧 | `POST /faturas/{id}/encaminhar` | Encaminha para aprovação |

**Regra:** só encaminha a partir do dia 6 do mês seguinte e sem espelho pendente.

<details><summary>Ver detalhes</summary>

- A fatura é criada ou alimentada quando o auditor aprova um espelho. `Fatura.Esp_Fat` e `Guia_Proc_ID` ficam com o primeiro espelho/atendimento.
- `GET /faturas` → `[{ id, ocsId, ocsNome, competencia, status, quantidadeEspelhos, quantidadeItens, valorApresentado, valorContratado, espelhosPendentes, dataGeracao, dataEncaminhamento }]`.
- `GET /faturas/{id}` → o resumo + `espelhos: [{ espelhoId, dataInicio, dataFim, itens: [{ id, atendimentoId, descricao, beneficiarioId, valorApresentado, valorContratado, divergenciaValor }] }]` e `pendentes: [{ espelhoId, status }]`.
- `encaminhar`: erros 422 `MES_NAO_ENCERRADO`, 422 `AUDITORIA_PENDENTE`.

</details>

---

## A única mudança no banco

```sql
ALTER TABLE Espelho ADD COLUMN Motivo_Reprovacao VARCHAR(255);
```

## Usuários de teste (front com `VITE_USE_MOCK=true`, senha `fusex123`)

| Perfil | CPF |
|---|---|
| Chefe do FUSEx | 526.018.159-06 |
| Médico | 083.016.613-05 |
| Emissor | 186.091.390-34 |
| Auditor | 996.030.824-30 |
| OCS | 628.194.821-12 |
| Beneficiário | 993.518.190-19 |

Primeiro acesso: Prec-CP `123456` e nascimento `21/07/1990`.
