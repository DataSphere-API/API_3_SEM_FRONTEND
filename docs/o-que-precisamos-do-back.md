# O que o front precisa do back para entregar o escopo da Sprint

Regra combinada: **mexer o mínimo no back**. O front foi adaptado para usar o que as issues já
preveem e o banco que já existe. Só entra aqui o que não tem como evitar.

Legenda:
- ✅ **Já existe** (no `dev` ou num PR aberto) — o back não precisa fazer nada.
- 🔧 **Ajuste pequeno** numa issue que já existe — uma regra ou um campo a mais no DTO.
- 🆕 **Novo** — não tem issue. Precisa criar.

Erros sempre no formato da US000-12: `{ "codigo": "...", "mensagem": "..." }`. A tela mostra a `mensagem`.

## Resumo para o time

- **Banco: só 1 coluna nova** — `Espelho.Motivo_Reprovacao`. O resto usa tabelas e colunas que já
  existem (check mútuo pelo `Guia_Proc.Status`, espelho com vários atendimentos pelo `Espelho_Item`).
- **Ajustar issues existentes:** #41 (contrato do login), #75 e #76 (campos a mais no DTO),
  **#77 (aprovação dupla: médico + chefe)**, #72 e #92 (check mútuo), **US001-4 e US001-5 (espelho com
  vários atendimentos do mês, correção e reenvio)**, **US001-6/US001-7 e US002-3 (fatura mensal por OCS,
  sem gerar/regerar manual)**.
- **Criar issues novas:** autocadastro, usuários, OCS, procedimentos (listar e cadastrar), contratos, médicos, busca de
  beneficiários, criar/editar pré-guia, confirmar/recusar atendimento, aprovar/reprovar e reenviar espelho.

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
`fusex-banco-mock-v6` do Local Storage. Para testar o check mútuo, abra a OCS e o beneficiário em duas
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

## 5. Check mútuo (OCS ↔ beneficiário) — sem mudança no banco

A OCS clica em "Realizar procedimento", o beneficiário confirma no app, e só então a sessão conta.
O pedido da OCS fica no **status do `Guia_Proc`** (`AGUARDANDO_CONFIRMACAO`, a coluna `Status VARCHAR(30)`
já existe). A linha em `Sessao_Procedimento` (US004-6) só é gravada quando o beneficiário confirma.

| | O quê | Issue |
|---|---|---|
| 🔧 | `GET /ocs/{cnpj}/atendimentos` → `[{ atendimentoId, guiaId, beneficiario { precCp, nome }, procedimento, ocs { cnpj, nome }, qtdAutorizada, qtdRealizada, statusProcedimento, aguardandoConfirmacao, dataValidade, dataRealizacao, espelhoId }]`. `dataRealizacao` = data da última sessão; `espelhoId` = espelho em que o atendimento já está, ou `null` | #92 |
| 🔧 | `POST /atendimentos/{id}/sessoes` com `{ cnpj }` — **não grava a sessão ainda**: só muda o `Guia_Proc.Status` para `AGUARDANDO_CONFIRMACAO`. Mantém as validações da #72 (OCS do contrato, validade, saldo). Já aguardando: 409 `AGUARDANDO_CONFIRMACAO` | #72 |
| 🆕 | `DELETE /atendimentos/{id}/pedido-confirmacao` — a OCS desfaz o pedido (status volta ao anterior) | — |
| 🆕 | `GET /beneficiarios/{precCp}/confirmacoes-pendentes` → `[{ atendimentoId, numeroSessao, qtdAutorizada, procedimento, ocs { nome }, guiaNumero }]` | — |
| 🆕 | `PATCH /atendimentos/{id}/confirmar` — **grava a linha em `Sessao_Procedimento`** (a lógica de numeração da #72 vem para cá) e recalcula: `EM_ANDAMENTO`, ou `REALIZADA` na última sessão (recálculo da US004-3). Grava o histórico | #72 |
| 🆕 | `PATCH /atendimentos/{id}/recusar` — "não fui atendido": nada é gravado, o status volta ao anterior | — |

O status anterior sai da contagem de sessões: 0 → `PENDENTE`, senão `EM_ANDAMENTO`. A baixa por QR
(US004-3) deixa de ser necessária. O "Minhas guias" usa o `GET /beneficiarios/{precCp}/guias` (#64).

## 6. Espelho: vários atendimentos de um período (OCS) — sem mudança no banco

O espelho é a junção dos atendimentos realizados pela OCS no período que ela escolher. Cada item
(`Espelho_Item`, que já tem `Atendimento_ID`) é um atendimento, com o valor que a OCS cobra.

| | O quê | Issue |
|---|---|---|
| 🔧 | `POST /espelhos` com `{ ocsId, dataInicio, dataFim, itens: [{ atendimentoId, valor }] }`. O back preenche `beneficiarioId` e `descricao` (nome do procedimento). Regras: atendimento da OCS e `REALIZADA` (422 `ATENDIMENTO_NAO_REALIZADO`), realizado no período (422 `FORA_DO_PERIODO`), **período inteiro dentro de um mês só, que precisa ser o mês atual ou — até o dia 5 — o mês anterior** (422 `FORA_DO_MES`: o espelho entra na fatura do mês dos atendimentos), fora de outro espelho (409 `ATENDIMENTO_JA_EM_ESPELHO`), valor > 0 (400 `VALOR_INVALIDO`). **`Espelho.Atendimento_ID` (que é `NOT NULL` e `UNIQUE`) recebe o primeiro atendimento da lista** — como cada atendimento só entra em um espelho, a trava continua valendo | US001-4 |
| ✅ | `GET /espelhos?cnpj=` — a OCS só vê os dela | US001-5 |

**Correção e reenvio pela OCS** — o espelho reprovado volta para a OCS, que corrige **o mesmo
espelho** (não cria outro, e por isso o `UNIQUE` não atrapalha) e reenvia:

| | O quê | Issue |
|---|---|---|
| 🔧 | `PATCH /espelhos/{id}/itens/{itemId}` com `{ valor }` e `DELETE /espelhos/{id}/itens/{itemId}` — liberar quando o espelho está `REPROVADO`. Ao tirar o item cujo atendimento está em `Espelho.Atendimento_ID`, trocar pelo de outro item. Não deixar o espelho sem itens (422 `ESPELHO_SEM_ITENS`) | US001-5 |
| 🆕 | `POST /espelhos/{id}/reenviar` — `REPROVADO` → `EM_ABERTO`, grava no histórico com origem `reenvio-pela-ocs`. Erro 409 `ESPELHO_NAO_REPROVADO` | — |
| 🔧 | No `EspelhoResumoResponse`, acrescentar `devolucoes` = quantas vezes o histórico tem o espelho indo para `REPROVADO`. É a **sinalização de devolução** que o auditor vê ("Reenviado após devolução") | US000-14 |

## 7. Auditor

| | O quê | Issue |
|---|---|---|
| ✅ | `GET /espelhos` (receber) | US001-5 |
| 🔧 | `GET /espelhos/{id}/itens` — voltar a mandar `atendimentoId` (a US000-14 tirou) e acrescentar `valorContratado` (o back já tem `obterValorContratado`, US001-2; `null` sem contrato) | US000-14 |
| 🔧 | Acrescentar `motivoReprovacao` no `EspelhoResumoResponse` | US000-14 |
| 🆕 | `PATCH /espelhos/{id}/aprovar` e `PATCH /espelhos/{id}/reprovar` com `{ motivo }` → status `APROVADO` / `REPROVADO` (só no enum `StatusEspelho`; a coluna `Status VARCHAR(20)` já comporta). Grava o histórico. **Ao aprovar, inclui o espelho na fatura mensal da OCS (item 8)** e devolve também `faturaId` e `competencia`. Erros: 409 `ESPELHO_JA_AUDITADO`, 400 `MOTIVO_OBRIGATORIO`, 409 `FATURA_JA_ENCAMINHADA` | — |
| ✅ | `GET /guias/{id}/historico` (o `id` é do Guia_Proc = atendimento) e `GET /espelhos/{id}/historico` | US001-3 |

**Pontuação (calculada no front, não precisa de back):** para cada atendimento, 100 quando o valor
cobrado está dentro do contrato; cai 1 ponto por ponto percentual acima; sem contrato vale 0. A faixa
usa os limites da US002-2 (baixa até 5%, média até 15%, alta acima). A pontuação do espelho é a média.

**A única coluna nova do pacote todo:**
```sql
ALTER TABLE Espelho ADD COLUMN Motivo_Reprovacao VARCHAR(255);
```
É um `ADD COLUMN` que aceita nulo: não mexe em nenhum dado existente. O cuidado é só com o **número
da migration**, que deve ser o próximo depois que o time resolver as V7/V8/V10 duplicadas.

## 8. Fatura mensal por OCS — sem mudança no banco

Uma fatura por OCS por mês, com todos os espelhos **aprovados** daquele mês. Não existe mais gerar
fatura de um espelho nem **regerar**: quem cria e alimenta a fatura é a aprovação do espelho.

| | O quê | Issue |
|---|---|---|
| 🔧 | Ao aprovar um espelho: procura a fatura `ATIVA` da OCS no mês do espelho; se não existe, cria. Cria um `Item_Fatura` para cada `Espelho_Item` (valor apresentado, valor contratado e divergência, como a US001-6 já faz). `Fatura.Esp_Fat` e `Fatura.Guia_Proc_ID` (`NOT NULL`) ficam com o primeiro espelho/atendimento; os demais entram pelos itens | US001-6 |
| 🔧 | `GET /faturas?cnpj=&competencia=AAAA-MM` → `[{ id, ocsId, ocsNome, competencia, status, quantidadeEspelhos, quantidadeItens, valorApresentado, valorContratado, espelhosPendentes, dataGeracao, dataEncaminhamento }]`. A `competencia` sai do período dos espelhos da fatura (todos do mesmo mês). `espelhosPendentes` = espelhos da OCS no mês ainda `EM_ABERTO` ou `REPROVADO` | US001-7 |
| 🔧 | `GET /faturas/{id}` → o resumo + `espelhos: [{ espelhoId, dataInicio, dataFim, itens: [{ id, atendimentoId, descricao, beneficiarioId, valorApresentado, valorContratado, divergenciaValor }] }]` e `pendentes: [{ espelhoId, status }]` | US001-7 |
| 🔧 | `POST /faturas/{id}/encaminhar` — só depois do prazo de envio dos espelhos do mês, ou seja, a partir do dia 6 do mês seguinte (422 `MES_NAO_ENCERRADO`) e sem espelho pendente do mês (422 `AUDITORIA_PENDENTE`). A regra antiga de "item não autorizado" sai: os itens já passaram pelo auditor no espelho | US002-3 |
| ❌ | **Tirar** `POST /faturas` (gerar a partir de um espelho) e `POST /faturas/{id}/regerar` do uso — o front não chama mais | US001-6, US001-7 |

Status: `ATIVA` (aberta, recebendo espelhos) → `ENCAMINHADA_APROVACAO`. O `REGERADA` deixa de ser usado.

**Tolerância de 5 dias:** do dia 1 ao dia 5 a OCS ainda pode mandar espelho do mês anterior (que entra
na fatura daquele mês). Por isso a fatura de um mês só pode ser encaminhada a partir do dia 6 do mês
seguinte. A constante fica no front em `src/utils/competencia.js` (`DIAS_DE_TOLERANCIA`); o back
precisa usar o mesmo número.

## Ainda no front, fora deste pacote

- A tela antiga de faturas (gerar/regerar, lisura, divergências) saiu do menu e da rota: o auditor usa
  "Faturas mensais". Os arquivos antigos (`src/views/Faturas/`) continuam no repositório, sem uso.
- A antiga tela de atendimento por QR ainda chama `axios` com `http://localhost:8080` fixo (sem token). A tela antiga `/pre-guias` (US006-5) continua no router
  só para o CHEFE, fora do menu.
