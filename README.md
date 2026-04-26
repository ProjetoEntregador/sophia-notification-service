# Sophia Notification Service

Serviço de notificações via WhatsApp (Baileys) construído em NestJS, com PostgreSQL gerenciado por Drizzle ORM. Toda a stack roda em Docker — Postgres, Redis e a aplicação Nest.

## Stack

- **NestJS 11** (Node 20)
- **Drizzle ORM** + **PostgreSQL 16**
- **Baileys** (WhatsApp)
- **Redis** (placeholder de fila)
- **Docker Compose** (orquestração)

---

## Como rodar

### Pré-requisitos

- Docker e Docker Compose
- Node 20 + Yarn 1.x (apenas para gerar migrations no host; a aplicação roda no container)

### Subindo a stack

1. Copie o `.env.example` (se existir) ou use o `.env` atual. As variáveis essenciais:

   ```env
   PORT=3000                # porta INTERNA do container; não mude
   DB_NAME=sophia_db
   DB_USER=postgres
   DB_PASSWORD=your-db-password
   DB_HOST=postgres         # nome do serviço no compose
   DB_PORT=5432             # porta INTERNA do container do Postgres
   DATABASE_URL=postgres://postgres:your-db-password@postgres:5432/sophia_db
   ```

   Mapeamentos externos no `docker-compose.yml`:
   - App: `localhost:3001 → container:3000`
   - Postgres: `localhost:5433 → container:5432`
   - Redis: `localhost:6380 → container:6379`

2. Build e subida:

   ```bash
   docker compose build sophia_notification_service
   docker compose up -d
   ```

3. Acompanhe os logs (filtra os QR codes do WhatsApp):

   ```bash
   docker compose logs -f sophia_notification_service | grep -v "█\|▄\|▀"
   ```

   Aguarde a linha `Nest application successfully started on port 3000`.

### Migrations

O fluxo é dividido entre host e container:

| Operação                             | Onde rodar                           | Comando                 |
| ------------------------------------ | ------------------------------------ | ----------------------- |
| Editar schema (`src/db/schema/*.ts`) | host                                 | —                       |
| Gerar SQL a partir do schema         | host                                 | `yarn drizzle:generate` |
| Aplicar SQL no banco                 | container                            | `yarn migrate:docker`   |
| Criar o banco caso não exista        | container (automático no entrypoint) | `yarn db:create:docker` |

Para gerar SQL no host, exporte um `DATABASE_URL` com `localhost:5433`:

```bash
DATABASE_URL=postgres://postgres:123456789@localhost:5433/sophia_db yarn drizzle:generate
git add drizzle/
docker compose build sophia_notification_service && docker compose up -d
```

> O `entrypoint.sh` do container já roda `yarn db:create` e `yarn migrate` antes de iniciar a app.

### Testando endpoints

A app responde em `http://localhost:3001`. Os endpoints atuais:

```http
GET  /bot/status
GET  /treatments
POST /treatments
GET  /treatments/:id
PATCH /treatments/:id
DELETE /treatments/:id

GET  /reminders
POST /reminders
GET  /reminders/:id
PATCH /reminders/:id
DELETE /reminders/:id
```

Use o arquivo `src/http.http` (extensão REST Client do VS Code), Insomnia, Postman ou `curl`.

### Conectando ao Postgres a partir do host

```bash
docker compose exec postgres psql -U postgres -d sophia_db
# ou via cliente externo:
psql postgres://postgres:123456789@localhost:5433/sophia_db
```

---

## Como adicionar novos serviços/endpoints

A arquitetura segue SOLID. Use cada princípio como guia ao criar um novo módulo.

### Estrutura de um módulo

Novos domínios vão em `src/modules/<dominio>/`:

```
src/modules/<dominio>/
  <dominio>.module.ts        # registra controller + provider(s)
  <dominio>.controller.ts    # entrada HTTP (somente delegação)
  <dominio>.service.ts       # regras de negócio + acesso a dados
```

Lembre de adicionar o módulo a `src/app.module.ts`.

### Aplicando SOLID

#### **S — Single Responsibility**

Cada classe tem **uma** razão para mudar.

- **Controller**: apenas mapeia HTTP ↔ chamadas de service. Sem lógica de negócio, sem acesso a banco, sem `try/catch` de domínio.
- **Service**: regras de negócio e queries.
- **Schema** (`src/db/schema/`): forma das tabelas; nada além disso.
- Se precisar enviar mensagens, use o `MessageSender` do `BotModule`. Não chame Baileys direto de um service de domínio.

> 🚫 Anti-padrão: um controller que valida regra, monta entidade e chama o repositório. Mova para o service.

#### **O — Open/Closed**

Aberto a extensão, fechado a modificação.

- Para reagir a um novo evento (ex.: enviar SMS além de WhatsApp), implemente um novo `MessageHandler` e registre-o como provider — sem editar o que já existe. Veja `LogMessageHandler` em `src/bot/messaging/log-message.handler.ts`.
- Para acrescentar um novo presenter de QR code, basta uma nova classe que implementa `QrCodePresenter` e trocar o `useClass` no `BotModule`.

#### **L — Liskov Substitution**

Toda implementação de uma interface deve ser intercambiável.

- Use as classes abstratas em `src/bot/interfaces/` (`MessageSender`, `SocketProvider`, `QrCodePresenter`, `MessageHandler`) como contratos. Não dependa de `MessageService` direto — dependa de `MessageSender`.
- Se um teste for trocar `MessageSender` por um mock, isso tem que funcionar sem alterar o consumidor.

#### **I — Interface Segregation**

Interfaces pequenas e focadas.

- Já fazemos isso ao separar `MessageSender` (envio) de `MessageHandler` (recepção) e `QrCodePresenter` (apresentação). Ao criar uma nova abstração, prefira várias interfaces pequenas a uma "Service" gigante.

#### **D — Dependency Inversion**

Módulos de alto nível dependem de abstrações.

- Injete via construtor, sempre tipado pela classe abstrata, não pela implementação concreta:

  ```ts
  constructor(private readonly messageSender: MessageSender) {}
  ```

- Para acessar o banco, injete o token `DRIZZLE` (em `src/database.module.ts`), não importe o pool diretamente:

  ```ts
  constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase) {}
  ```

### Receita: novo CRUD em 5 passos

1. **Schema** em `src/db/schema/<entidade>.ts`. Exporte o tipo em `src/db/schema/types.ts`.
2. **Migration**: `yarn drizzle:generate` no host. Commite os SQLs em `drizzle/`.
3. **Service** em `src/modules/<dominio>/<dominio>.service.ts`:
   - Injete `DRIZZLE`.
   - Use um `private toValues()` para mapear input → linha do banco (converte datas, omite `undefined`). Veja `treatments.service.ts` como referência.
   - Lance `NotFoundException` para id inexistente.
4. **Controller** em `<dominio>.controller.ts`:
   - Use `ParseUUIDPipe` para `:id`.
   - Apenas delegue para o service. DTOs como `type` no topo do arquivo (ou em `dto/` se crescerem).
5. **Module**: registre controller + service e importe em `AppModule`.

### Como rebuildar após mudanças

A imagem é multi-stage e inclui o `dist/` no estágio final. Toda mudança em `src/` exige rebuild:

```bash
docker compose build sophia_notification_service && docker compose up -d
```

Se mudou só `package.json`/scripts e a app não pegou:

```bash
docker compose build --no-cache sophia_notification_service && docker compose up -d
```

---

## Estrutura de pastas

```
.
├── compose/nest/          # Dockerfile + entrypoint da app
├── docker-compose.yml
├── drizzle/               # SQL gerado pelo drizzle-kit
├── drizzle.config.ts
├── scripts/
│   └── create-db.ts       # cria o banco se não existir (rodado pelo entrypoint)
└── src/
    ├── app.module.ts
    ├── main.ts
    ├── database.module.ts # provider DRIZZLE (Pool pg + drizzle())
    ├── db/
    │   ├── schema/        # definições das tabelas
    │   └── relations.ts
    ├── bot/               # módulo WhatsApp (Baileys)
    │   ├── connection/
    │   ├── interfaces/    # MessageSender, MessageHandler, ...
    │   ├── messaging/
    │   └── presenters/
    └── modules/
        ├── reminders/
        └── treatments/
```

---

## Comandos úteis

```bash
# entrar no shell do container da app
docker compose exec sophia_notification_service sh

# ver tabelas no banco
docker compose exec postgres psql -U postgres -d sophia_db -c "\dt"

# ver migrations já aplicadas
docker compose exec postgres psql -U postgres -d sophia_db -c "SELECT * FROM drizzle.__drizzle_migrations;"

# resetar tudo (apaga volume do banco!)
docker compose down -v
```
