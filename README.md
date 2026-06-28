# Sophia Notification Service

Serviço de notificações via WhatsApp (Baileys) construído em NestJS, com PostgreSQL gerenciado por Drizzle ORM. Além de enviar lembretes de medicamentos, conta com um **assistente de IA conversacional** que entende linguagem natural, transcreve áudios e executa ações (cadastrar tratamento, confirmar dose, etc.) via _tool use_. Toda a stack roda em Docker.

## Stack

- **NestJS 11** (Node 20)
- **Drizzle ORM** + **PostgreSQL 16**
- **Baileys** (WhatsApp)
- **RabbitMQ** (mensageria entre serviços — consumo de eventos internos e integração com a farmácia)
- **Redis** (placeholder de fila)
- **IA** — `sophia-ai-service` (gateway Flask) com **Groq (`llama-3.3-70b-versatile`)** como provedor primário e **fallback automático para Gemini (`gemini-2.5-flash`)**; também faz transcrição de áudio (Groq/Whisper)
- **Docker Compose** (orquestração)

> Este serviço faz parte de uma stack maior (Sophia): conversa com `sophia-ai-service` (IA), `sophia-pharmacy-service` (farmácias) e `sophia-message-broker` (RabbitMQ) pela rede Docker externa `net1`.

---

## Assistente de IA (chat conversacional)

O bot responde em linguagem natural e, quando o paciente pede uma **ação**, a IA chama uma _tool_ que executa a operação real no banco. O fluxo vive em `src/bot/ai/` e está documentado em detalhe em [`src/bot/ai/README.md`](src/bot/ai/README.md).

- **Orquestrador** (`AiOrchestratorHandler`): é o handler de fallback do bot — assume quando nenhum comando estruturado (`cadastrar`, `1`, `2`) reconhece a mensagem. Roda um loop de _tool use_ (até `MAX_TOOL_ITERATIONS`), executando as tools pedidas pela IA e devolvendo o resultado até a IA gerar a resposta final.
- **LLM** (`LocalAiService`): chama o `sophia-ai-service` em `AI_SERVICE_URL` (`/chat/completions`), que usa **Groq (`llama-3.3-70b-versatile`)** como provedor primário e cai automaticamente para **Gemini (`gemini-2.5-flash`)** se o Groq falhar ou estourar rate limit (padrão _Chain of Responsibility_ no gateway). Ambos rodam no _tier_ gratuito.
- **Transcrição de áudio** (`LocalTranscriptionService`): áudios do WhatsApp são transcritos pelo mesmo `sophia-ai-service` (Groq/Whisper) e tratados como texto pela IA.
- **Persistência de conversa** (`DrizzleChatHistoryRepository`): o histórico de cada `jid` é gravado no Postgres (tabelas `chat_conversations`, `chat_messages`, `chat_message_tool_calls`), então sobrevive a reinícios e é compartilhado entre instâncias. Cap FIFO de `MAX_HISTORY_MESSAGES` por conversa.

### Tools disponíveis

A IA pode acionar (via `AiToolsRegistry`):

| Domínio       | Tools                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Medicamentos  | `register_medication`, `update_medication_quantity`, `delete_medication`, `list_low_stock_medications`                    |
| Tratamentos   | `register_treatment`, `update_treatment`, `cancel_treatment`, `pause_treatment`, `resume_treatment`, `list_my_treatments` |
| Doses         | `confirm_dose`, `skip_dose`, `list_today_reminders`, `list_upcoming_reminders`                                            |
| Adesão/ajuste | `get_adherence_report`, `set_quiet_hours`                                                                                 |
| Farmácias     | `request_pharmacies_location` (recomenda farmácias próximas via localização do WhatsApp)                                  |

> Para criar uma nova tool ou plugar outro provider de IA, siga o passo a passo em [`src/bot/ai/README.md`](src/bot/ai/README.md).

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
   DB_HOST=sophia-postgres  # nome do serviço no compose
   DB_PORT=5432             # porta INTERNA do container do Postgres
   DATABASE_URL=postgres://postgres:your-db-password@sophia-postgres:5432/sophia_db

   # IA (sophia-ai-service: Groq primário -> Gemini fallback)
   AI_SERVICE_URL=http://host.docker.internal:5000
   AI_SERVICE_TIMEOUT_MS=120000   # folga para a cadeia de fallback (Groq -> Gemini)

   # Mensageria (RabbitMQ)
   MESSAGE_SERVICE_URL=amqp://admin:admin@rabbitmq:5672
   MESSAGE_EXCHANGES_NOTIFICATION=internal.exchange
   MESSAGE_EXCHANGES_PHARMACY=pharmacy.exchange
   MESSAGE_NOTIFICATION_QUEUE=internal.processing.queue
   MESSAGE_PHARMACY_INCOMING_QUEUE=pharmacy.incoming.queue
   MESSAGE_PHARMACY_OUTGOING_QUEUE=pharmacy.outgoing.queue
   MESSAGE_NOTIFICATION_ROUTING_KEY=internal.event
   MESSAGE_PHARMACY_INCOMING_ROUTING_KEY=pharmacy.incoming
   MESSAGE_PHARMACY_OUTGOING_ROUTING_KEY=pharmacy.outgoing

   # Integração com a farmácia
   PHARMACY_SERVICE_URL=http://host.docker.internal:4000
   PHARMACY_SERVICE_TIMEOUT_MS=30000
   ```

   Mapeamentos externos no `docker-compose.yml`:
   - App: `localhost:3001 → container:3000`
   - Postgres: `localhost:5433 → container:5432`
   - Redis: `localhost:6380 → container:6379`

   > A IA e a farmácia são serviços separados, alcançados via `host.docker.internal`. As chaves de API (Groq/Gemini) ficam no `.env` do próprio `sophia-ai-service`.

2. Build e subida:

   ```bash
   docker compose build sophia-notification-service
   docker compose up -d
   ```

3. Acompanhe os logs (filtra os QR codes do WhatsApp):

   ```bash
   docker compose logs -f sophia-notification-service | grep -v "█\|▄\|▀"
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
docker compose build sophia-notification-service && docker compose up -d
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

> O fluxo de conversa/IA **não** é HTTP: mensagens do WhatsApp chegam pelos _consumers_ de RabbitMQ (`src/infra/messaging/`), são roteadas pelo `MessageRouter` e, no fallback, tratadas pelo `AiOrchestratorHandler`. Para testar, basta mandar mensagem no WhatsApp conectado.

### Conectando ao Postgres a partir do host

```bash
docker compose exec sophia-postgres psql -U postgres -d sophia_db
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
docker compose build sophia-notification-service && docker compose up -d
```

Se mudou só `package.json`/scripts e a app não pegou:

```bash
docker compose build --no-cache sophia-notification-service && docker compose up -d
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
    ├── @types/            # tipos compartilhados (ai, whatsapp, messaging, ...)
    ├── db/
    │   ├── schema/        # tabelas: users, treatments, medications, reminders, chat_*
    │   └── relations.ts
    ├── infra/
    │   └── messaging/     # RabbitMQ (módulo, service, consumers, constants)
    ├── shared/            # ports/contratos compartilhados (ex.: MessageSender)
    ├── bot/               # módulo WhatsApp (Baileys)
    │   ├── connection/
    │   ├── interfaces/    # MessageSender, MessageHandler, ...
    │   ├── messaging/     # MessageRouter + handlers estruturados + state
    │   ├── presenters/
    │   └── ai/            # assistente de IA: orquestrador, tools, histórico
    │       ├── ai-orchestrator.handler.ts
    │       ├── ai-tools.registry.ts
    │       ├── local-ai.service.ts          # cliente do sophia-ai-service (chat)
    │       ├── local-transcription.service.ts  # transcrição de áudio
    │       ├── ai-tools/                     # implementações das tools
    │       ├── domain/                       # ChatHistoryRepository (port)
    │       └── adapters/out/                 # persistência Drizzle do histórico
    ├── medications/       # domínio de medicamentos
    ├── treatments/        # domínio de tratamentos
    ├── reminders/         # domínio de doses/lembretes
    ├── pharmacies/        # integração com sophia-pharmacy-service
    └── users/             # domínio de usuários/pacientes
```

> Os domínios ficam direto em `src/<dominio>/` (não em `src/modules/`). A seção SOLID acima continua valendo como guia ao criar um módulo novo.

---

## Comandos úteis

```bash
# entrar no shell do container da app
docker compose exec sophia-notification-service sh

# ver tabelas no banco
docker compose exec sophia-postgres psql -U postgres -d sophia_db -c "\dt"

# ver migrations já aplicadas
docker compose exec sophia-postgres psql -U postgres -d sophia_db -c "SELECT * FROM drizzle.__drizzle_migrations;"

# resetar tudo (apaga volume do banco!)
docker compose down -v
```
