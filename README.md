# API REST – Alunos e Disciplinas

API em Node.js + Express + MongoDB (Mongoose) para gerenciar alunos e suas disciplinas.

## Estrutura

```
app.js                      # inicializa o Express, rotas e tratamento de erros
config/database.js          # conexão com o MongoDB
models/aluno.js             # schema do aluno (RA único, disciplinas sem código repetido)
controllers/alunoController.js
routes/alunoRoutes.js
seed.js                     # cadastra os alunos iniciais
```

## Como rodar

1. `npm install`
2. Copie `.env.example` para `.env` e preencha `MONGODB_URI` (no Atlas, libere seu IP em **Network Access**).
3. `npm run seed` – insere os alunos iniciais (`npm run seed -- --reset` apaga a coleção antes)
4. `npm start` (ou `npm run dev` para recarregar automaticamente) → `http://localhost:3000`

## Endpoints

| Método | Rota | Descrição | Sucesso |
|---|---|---|---|
| GET | `/alunos` | Lista todos os alunos | 200 |
| GET | `/alunos?nome=jo` | Busca parcial por nome (sem diferenciar maiúsculas) | 200 |
| GET | `/alunos?disciplina=MAT101` | Alunos matriculados na disciplina | 200 |
| GET | `/alunos/:ra` | Busca aluno pelo RA | 200 |
| GET | `/alunos/:ra/disciplinas` | Disciplinas do aluno | 200 |
| GET | `/alunos/:ra/resumo` | RA, nome, total de disciplinas e professores sem repetição | 200 |
| POST | `/alunos` | Cadastra aluno | 201 |
| PUT | `/alunos/:ra` | Altera somente o nome | 200 |
| DELETE | `/alunos/:ra` | Exclui o aluno e suas disciplinas | 200 |
| POST | `/alunos/:ra/disciplinas` | Adiciona disciplina | 201 |
| PUT | `/alunos/:ra/disciplinas/:codigo` | Altera nome/professor da disciplina | 200 |
| DELETE | `/alunos/:ra/disciplinas/:codigo` | Remove a disciplina | 200 |

Erros retornam JSON no formato `{ "erro": "mensagem" }` com status 400, 404 ou 409.

## Roteiro para os prints (Postman / Thunder Client)

Dados iniciais (seed): RA 1 João (MAT101, HIS101), RA 2 Maria (MAT101, FIS101, POR101), RA 3 Pedro (HIS101, GEO101), RA 4 Joana (POR101).

### `evidencias/sucesso`

| Nº | Requisição | Corpo |
|---|---|---|
| 01 | `GET /alunos` | – |
| 02 | `GET /alunos/1` | – |
| 03 | `GET /alunos/1/disciplinas` | – |
| 04 | `GET /alunos?nome=jo` | – |
| 05 | `POST /alunos` | `{ "ra": "10", "nome": "Lucas", "disciplinas": [{ "codigo": "MAT101", "nome": "Matemática", "professor": "Prof. Carlos" }] }` |
| 06 | `PUT /alunos/10` | `{ "nome": "Lucas Silva" }` |
| 07 | `DELETE /alunos/4` | – |
| 08 | `POST /alunos/1/disciplinas` | `{ "codigo": "FIS101", "nome": "Física", "professor": "Prof. Carlos" }` |
| 09 | `PUT /alunos/1/disciplinas/FIS101` | `{ "nome": "Física I", "professor": "Prof. Roberto" }` |
| 10 | `DELETE /alunos/1/disciplinas/FIS101` | – |
| 11 | `GET /alunos?disciplina=MAT101` | – |
| 12 | `GET /alunos/2/resumo` | – |

### `evidencias/erros`

| Nº | Requisição | Corpo | Esperado |
|---|---|---|---|
| 13 | `POST /alunos` | `{ "ra": "1", "nome": "Outro" }` | 409 |
| 14 | `POST /alunos` | `{ "ra": "20" }` | 400 |
| 15 | `GET /alunos/999` | – | 404 |
| 16 | `PUT /alunos/999` | `{ "nome": "Teste" }` | 404 |
| 17 | `DELETE /alunos/999` | – | 404 |
| 18 | `POST /alunos/1/disciplinas` | `{ "codigo": "MAT101", "nome": "Matemática", "professor": "Prof. Carlos" }` | 409 |
| 19 | `POST /alunos/999/disciplinas` | `{ "codigo": "QUI101", "nome": "Química", "professor": "Prof. Paula" }` | 404 |
| 20 | `POST /alunos/1/disciplinas` | `{ "codigo": "QUI101", "nome": "Química" }` | 400 |
| 21 | `PUT /alunos/1/disciplinas/XYZ999` | `{ "nome": "Nada", "professor": "Ninguém" }` | 404 |
| 22 | `DELETE /alunos/1/disciplinas/XYZ999` | – | 404 |
