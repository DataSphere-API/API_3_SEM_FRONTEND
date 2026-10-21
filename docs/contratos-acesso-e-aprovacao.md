# Acesso, cadastros e aprovação de pré-guias — contratos para o back-end

As telas abaixo já funcionam com `VITE_USE_MOCK=true`. Este documento diz o que cada uma
espera da API, para o back implementar no mesmo formato. Os mocks em `src/mocks/` seguem
exatamente estas regras e servem de referência.

Erros seguem o padrão da US000-12: `{ "codigo": "...", "mensagem": "..." }`. A tela mostra a `mensagem`.

## Como testar no modo mock

`npm run dev` com `VITE_USE_MOCK=true`. Senha de todos: `fusex123`.

| Perfil | CPF |
|---|---|
| Chefe do FUSEx | 526.018.159-06 |
| Médico **e** Beneficiário (escolhe o perfil) | 083.016.613-05 |
| Emissor | 186.091.390-34 |
| Auditor | 996.030.824-30 |
| OCS | 628.194.821-12 |
| Beneficiário | 993.518.190-19 |

Autocadastro: Prec-CP `123456` + nascimento `21/07/1990` (ou Prec-CP `7007` + `15/01/2001`).
Os dados mock ficam no `localStorage` (`fusex-banco-mock`); apague essa chave para voltar ao início.

## Perfis e telas

| Perfil | Telas |
|---|---|
| CHEFE | Pré-guias para aprovar, Usuários e perfis, OCS credenciadas, Contratos |
| MEDICO | Nova solicitação, Pré-guias para aprovar |
| EMISSOR | Criar pré-guia, Acompanhamento (corrigir devolvidas), Aprovadas (emitir) |
| BENEFICIARIO | Minhas guias |
| AUDITOR | Espelhos, Faturas |
| OCS | Atendimento, Espelhos |

O router bloqueia rota de outro perfil e manda para a tela inicial do perfil ativo.

## 1. Autenticação

### `POST /auth/login`
```json
{ "cpf": "52601815906", "senha": "..." }
```
200:
```json
{
  "token": "jwt...",
  "usuario": {
    "id": 1, "nome": "Carlos Albuquerque", "cpf": "52601815906",
    "perfis": ["CHEFE"], "precCp": "3003", "crm": "", "crmUf": "", "ocsCnpj": ""
  }
}
```
Erros: 401 `CREDENCIAIS_INVALIDAS`, 403 `USUARIO_INATIVO`.

O front manda `Authorization: Bearer <token>` em toda chamada feita pelo `api` (`src/services/http.js`).
Um 401 com sessão aberta derruba a sessão e volta para o login.

Perfis possíveis: `CHEFE`, `MEDICO`, `EMISSOR`, `BENEFICIARIO`, `AUDITOR`, `OCS`.
Com mais de um perfil, o usuário escolhe com qual entrar. **O back deve validar o perfil pelo token**,
não confiar no front.

### `POST /auth/cadastro` (autocadastro do beneficiário, sem login)
```json
{ "precCp": "123456", "dataNascimento": "1990-07-21", "cpf": "93786579741",
  "email": "ana@email.com", "telefone": "12999998888", "senha": "..." }
```
Regra: o Prec-CP precisa existir na tabela `Beneficiario` **e** a data de nascimento precisa bater.
O nome vem da base do FUSEx, não do formulário. Cria o `Usuario` com perfil `BENEFICIARIO`.

201: `{ "id": 7, "nome": "Ana Paula Souza" }`

Erros: 422 `BENEFICIARIO_NAO_CONFERE`, 409 `BENEFICIARIO_JA_CADASTRADO`, 409 `CPF_JA_CADASTRADO`.

## 2. Usuários (só CHEFE)

`GET /usuarios` → lista no formato do `usuario` do login, mais `postoGraduacao`, `email`, `telefone`, `ativo`.

`POST /usuarios` e `PUT /usuarios/{id}`:
```json
{ "nome": "Joana Teste", "cpf": "54323194897", "postoGraduacao": "1º Ten.",
  "email": "joana@fusex.eb.mil.br", "telefone": "", "perfis": ["MEDICO", "AUDITOR"],
  "crm": "55555", "crmUf": "SP", "ocsCnpj": "", "ativo": true, "senhaProvisoria": "..." }
```
`senhaProvisoria` só no POST. Regras:
- O chefe atribui só `CHEFE`, `MEDICO`, `EMISSOR`, `AUDITOR`, `OCS`. O perfil `BENEFICIARIO` vem do autocadastro e é preservado na edição.
- `MEDICO` exige `crm` e `crmUf`; `OCS` exige `ocsCnpj`.
- O chefe não pode se desativar nem tirar o próprio perfil `CHEFE`.

Erros: 409 `CPF_JA_CADASTRADO`, 422 `PERFIL_OBRIGATORIO`, 422 `DADOS_DO_PERFIL_OBRIGATORIOS`, 422 `AUTO_REMOCAO_CHEFE`, 404 `USUARIO_NAO_ENCONTRADO`.

## 3. OCS e contratos (só CHEFE)

`GET /ocs`, `POST /ocs`, `PUT /ocs/{cnpj}`:
```json
{ "cnpj": "45678901000166", "nome": "Hospital Regional Ltda", "nomeFantasia": "Hospital Regional",
  "telefone": "", "endereco": "", "tipoServico": "", "ativa": true }
```
Erro: 409 `OCS_JA_CADASTRADA`.

`GET /procedimentos` → `[{ "id": 1, "nome": "TC Abdome Superior" }]`

`GET /contratos`, `POST /contratos`, `PUT /contratos/{id}`:
```json
{ "numero": "CT 030/2026", "ocsCnpj": "45678901000166", "procedimentoId": 1,
  "valor": 650.0, "inicioVigencia": "2026-10-01", "fimVigencia": "2027-09-30" }
```
A resposta do GET traz também `id`, `procedimentoNome` e `ocsNome`.
Erros: 422 `VALOR_INVALIDO`, 422 `VIGENCIA_INVALIDA`, 409 `CONTRATO_DUPLICADO` (mesmo procedimento + OCS com vigência sobreposta).

`GET /beneficiarios?busca=` → `[{ "precCp", "nome", "dataNascimento", "dependente", "ug" }]` (busca por nome ou Prec-CP).

## 4. Fluxo da pré-guia

```
Emissor cria ──► AGUARDANDO_APROVACAO ──(Médico e Chefe aprovam, em qualquer ordem)──► APROVADA ──(Emissor emite)──► EMITIDA
                       │  ▲
       qualquer um     │  │ Emissor corrige e reenvia
       devolve ───────►DEVOLVIDA
                       │
       qualquer um nega ──► REPROVADA (fim)
```

- Médico e Chefe decidem **em paralelo**. Cada um tem a própria decisão: `PENDENTE`, `APROVADA`, `DEVOLVIDA` ou `NEGADA`.
- Só vira `APROVADA` quando as duas decisões são `APROVADA`. Aí aparece para o emissor emitir.
- Devolver ou negar exige observação.
- Ao reenviar uma devolvida, as duas decisões voltam para `PENDENTE`.
- Se o próprio médico cria a solicitação, a decisão do médico já nasce `APROVADA`.

### Formato da pré-guia (`GET /pre-guias`, `GET /pre-guias/{id}`)
```json
{
  "id": 5, "numero": "PG 2026/005", "status": "AGUARDANDO_APROVACAO",
  "criadaEm": "2026-10-20T18:57:00", "criadaPor": { "nome": "Luiz Fernandes", "perfil": "EMISSOR" },
  "beneficiario": { "precCp": "123456", "nome": "Ana Paula Souza" },
  "medicoSolicitante": { "nome": "Dr. Externo Teste", "crm": "99887", "uf": "SP" },
  "cid": "M54.5", "carater": "ELETIVO",
  "justificativa": "Dor lombar há 3 meses.",
  "observacoesEmissor": "Pedido em papel anexado.",
  "respostaEmissor": "",
  "procedimentos": [
    { "procedimentoId": 5, "nome": "Raio-X · joelho", "ocs": { "cnpj": "12345678000199", "nome": "Imagem Centro" },
      "quantidade": 2, "valorUnitario": 90.0, "valorTotal": 180.0 }
  ],
  "valorTotal": 180.0,
  "aprovacaoMedico": { "decisao": "APROVADA", "por": "Rafael Duarte", "data": "2026-10-20T19:02:00", "observacao": "" },
  "aprovacaoChefe": { "decisao": "PENDENTE", "por": null, "data": null, "observacao": "" },
  "dataEmissao": null, "validoAte": null
}
```
`GET /pre-guias` aceita `?status=` e `?pendenteDe=MEDICO|CHEFE` (opcionais; o front também filtra).

### `POST /pre-guias` (EMISSOR ou MEDICO)
```json
{ "beneficiarioPrecCp": "123456",
  "medicoSolicitante": { "nome": "Dr. Externo Teste", "crm": "99887", "uf": "SP" },
  "cid": "M54.5", "carater": "ELETIVO", "justificativa": "...", "observacoesEmissor": "...",
  "procedimentos": [{ "procedimentoId": 5, "ocsCnpj": "12345678000199", "quantidade": 2 }] }
```
Erros: 422 `BENEFICIARIO_INVALIDO`, 400 `MEDICO_SEM_CRM`, 400 `JUSTIFICATIVA_OBRIGATORIA`,
422 `PRE_GUIA_SEM_PROCEDIMENTOS`, 422 `SESSOES_INVALIDAS`, 422 `PROCEDIMENTO_SEM_CONTRATO` (sem contrato vigente com a OCS).

### `PUT /pre-guias/{id}` (EMISSOR, só `DEVOLVIDA`)
Mesmo corpo do POST mais `"respostaEmissor": "CID ajustado."` (obrigatório). Volta para `AGUARDANDO_APROVACAO`.
Erros: 409 `PRE_GUIA_STATUS_INVALIDO`, 400 `RESPOSTA_OBRIGATORIA`.

### Decisão (MEDICO ou CHEFE, o back descobre qual pelo token)
- `PATCH /pre-guias/{id}/aprovar` (sem corpo)
- `PATCH /pre-guias/{id}/devolver` com `{ "observacao": "..." }`
- `PATCH /pre-guias/{id}/reprovar` com `{ "motivo": "..." }` (mesmo corpo da US005-4)

Resposta: a pré-guia atualizada. Erros: 403 `PERFIL_SEM_PERMISSAO`, 409 `PRE_GUIA_STATUS_INVALIDO`,
409 `DECISAO_JA_REGISTRADA`, 400 `OBSERVACAO_OBRIGATORIA`.

> Muda a US005-4: hoje o PR #27 do back só aceita pré-guia `VALIDADA`, identifica o chefe pelo header
> `X-Chefe-Id` e não tem a decisão do médico nem o "devolver".

### `POST /pre-guias/{id}/emitir` (EMISSOR, só `APROVADA`)
Igual à US005-5: `{ "guiaId": 5, "status": "EMITIDA", "dataEmissao": "2026-10-20", "validoAte": "2026-12-19" }`.
Erros: 409 `PRE_GUIA_NAO_APROVADA`, 409 `PRE_GUIA_JA_EMITIDA`.

## 5. O que falta no banco

A V8 (PR #23 do back, ainda não mergeado) já tem `Guia.Med_ID` e `Chefe_ID` opcionais,
`Data_Aprovacao_Medico`, `Data_Aprovacao_Chefe` e `Motivo_Reprovacao`. Para o fluxo acima ainda faltam:

| Tabela | Coluna | Para quê |
|---|---|---|
| Guia | `Medico_Aprovador_ID INT` (FK Medico) | quem aprovou como médico (`Med_ID` é o solicitante) |
| Guia | `Decisao_Medico VARCHAR(20)`, `Decisao_Chefe VARCHAR(20)` | decisão de cada um (`PENDENTE`, `APROVADA`, `DEVOLVIDA`, `NEGADA`) |
| Guia | `Obs_Medico TEXT`, `Obs_Chefe TEXT` | observação de cada um (hoje há só um `Motivo_Reprovacao`) |
| Guia | `CID VARCHAR(8)`, `Carater VARCHAR(20)`, `Justificativa TEXT` | pedido médico |
| Guia | `Obs_Emissor TEXT`, `Resposta_Emissor TEXT` | observações e resposta à devolução |
| Guia | `Data_Criacao TIMESTAMP`, `Criada_Por INT` (FK Usuario) | quem criou e quando |
| Guia | `Medico_Externo_Nome`, `Medico_Externo_CRM`, `Medico_Externo_UF` | médico de fora do FUSEx (`Medico` exige `Benef_ID`) |
| Guia_Proc | `Quantidade` | já existe como `Qtd_Autorizada` na V8 |
| Usuario | `CPF`, `Nome`, `Email`, `Telefone`, `Posto_Graduacao`, `Ativo` | login por CPF e cadastro do chefe |
| Usuario × perfil | tabela `Usuario_Perfil(Usuario_ID, Perfil)` ou as FKs de `Medico`/`Analista`/`Chefe_Fusex`/`Auditor` para `Usuario` | um CPF com vários perfis |
| Medico | `CRM_UF` | UF do CRM |
| Ocs | `Nome_Fantasia`, `Telefone`, `Endereco`, `Tipo_Servico`, `Ativa` | cadastro de OCS |
| Contrato | `Numero`, `Inicio_Vigencia`, `Fim_Vigencia` | vigência do contrato |

Proposta de SQL (o número da versão fica para depois da V8/V9/V10 serem resolvidas, porque hoje há
dois `V7` e dois `V8` em branches diferentes):

```sql
ALTER TABLE Guia
    ADD COLUMN Medico_Aprovador_ID INT,
    ADD COLUMN Decisao_Medico VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    ADD COLUMN Decisao_Chefe  VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    ADD COLUMN Obs_Medico TEXT,
    ADD COLUMN Obs_Chefe  TEXT,
    ADD COLUMN CID VARCHAR(8),
    ADD COLUMN Carater VARCHAR(20) NOT NULL DEFAULT 'ELETIVO',
    ADD COLUMN Justificativa TEXT,
    ADD COLUMN Obs_Emissor TEXT,
    ADD COLUMN Resposta_Emissor TEXT,
    ADD COLUMN Data_Criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    ADD COLUMN Criada_Por INT,
    ADD COLUMN Medico_Externo_Nome VARCHAR(150),
    ADD COLUMN Medico_Externo_CRM  VARCHAR(20),
    ADD COLUMN Medico_Externo_UF   CHAR(2),
    ADD CONSTRAINT fk_guia_medico_aprovador FOREIGN KEY (Medico_Aprovador_ID)
        REFERENCES Medico (ID) ON UPDATE CASCADE ON DELETE RESTRICT,
    ADD CONSTRAINT fk_guia_criada_por FOREIGN KEY (Criada_Por)
        REFERENCES Usuario (ID) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT ck_guia_decisao_medico CHECK (Decisao_Medico IN ('PENDENTE','APROVADA','DEVOLVIDA','NEGADA')),
    ADD CONSTRAINT ck_guia_decisao_chefe  CHECK (Decisao_Chefe  IN ('PENDENTE','APROVADA','DEVOLVIDA','NEGADA'));

ALTER TABLE Usuario
    ADD COLUMN CPF CHAR(11),
    ADD COLUMN Nome VARCHAR(150),
    ADD COLUMN Email VARCHAR(150),
    ADD COLUMN Telefone VARCHAR(20),
    ADD COLUMN Posto_Graduacao VARCHAR(40),
    ADD COLUMN Ativo BOOLEAN NOT NULL DEFAULT TRUE,
    ADD CONSTRAINT uq_usuario_cpf UNIQUE (CPF);

CREATE TABLE Usuario_Perfil (
    Usuario_ID INT         NOT NULL,
    Perfil     VARCHAR(20) NOT NULL,
    CONSTRAINT pk_usuario_perfil PRIMARY KEY (Usuario_ID, Perfil),
    CONSTRAINT fk_usuario_perfil_usuario FOREIGN KEY (Usuario_ID)
        REFERENCES Usuario (ID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT ck_usuario_perfil CHECK (Perfil IN ('CHEFE','MEDICO','EMISSOR','BENEFICIARIO','AUDITOR','OCS'))
);

ALTER TABLE Medico   ADD COLUMN CRM_UF CHAR(2);
ALTER TABLE Ocs      ADD COLUMN Nome_Fantasia VARCHAR(150), ADD COLUMN Telefone VARCHAR(20),
                     ADD COLUMN Endereco VARCHAR(255), ADD COLUMN Tipo_Servico VARCHAR(100),
                     ADD COLUMN Ativa BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE Contrato ADD COLUMN Numero VARCHAR(30), ADD COLUMN Inicio_Vigencia DATE, ADD COLUMN Fim_Vigencia DATE;
```

## 6. Fora deste pacote

- Check mútuo OCS/beneficiário: fica para depois, como combinado.
- Recusar só um procedimento da pré-guia (o protótipo do médico tem): hoje a decisão vale para a pré-guia inteira.
- Os serviços de espelhos, faturas, lisura, atendimento e guias ainda chamam `axios` com `http://localhost:8080`
  fixo, então não levam o token. Precisam passar a usar o `api` de `src/services/http.js`.
- A tela antiga `/pre-guias` (validação US006) continua no router só para o CHEFE, fora do menu.
