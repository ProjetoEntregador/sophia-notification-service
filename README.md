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
   NOTIFICATION_PORT=3000                # porta INTERNA do container; não mude
   NOTIFICATION_DB_NAME=sophia_db
   NOTIFICATION_DB_USER=postgres
   NOTIFICATION_DB_PASSWORD=your-db-password
   DB_HOST=sophia-postgres  # nome do serviço no compose
   DB_PORT=5432             # porta INTERNA do container do Postgres
   NOTIFICATION_DATABASE_URL=postgres://postgres:your-db-password@sophia-postgres:5432/sophia_db

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

Para gerar SQL no host, exporte um `NOTIFICATION_DATABASE_URL` com `localhost:5433`:

```bash
NOTIFICATION_DATABASE_URL=postgres://postgres:123456789@localhost:5433/sophia_db yarn drizzle:generate
git add drizzle/
docker compose build sophia-notification-service && docker compose up -d
```

> O `entrypoint.sh` do container já roda `yarn db:create` e `yarn migrate` antes de iniciar a app.

### Como interagir

A superfície HTTP é mínima — só um health check:

```http
GET /bot/status   →   { "connected": true }   # true se o socket do WhatsApp está de pé
```

A interação de verdade acontece por dois caminhos, **não por HTTP**:

- **WhatsApp** — mande mensagem (texto, áudio ou localização) no número conectado. As mensagens chegam pelos _consumers_ de RabbitMQ (`src/infra/messaging/`), são roteadas pelo `MessageRouter` para um handler estruturado (ex.: `cadastrar`, `1`, `2`) e, no fallback, vão para o `AiOrchestratorHandler` (IA + tools).
- **Lembretes (cron)** — os disparos de dose e o auto-skip rodam por agendamento (`src/reminders/adapters/in/*.cron.ts`), sem chamada externa.

### Conectando ao Postgres a partir do host

```bash
docker compose exec sophia-postgres psql -U postgres -d sophia_db
# ou via cliente externo:
psql postgres://postgres:123456789@localhost:5433/sophia_db
```

---

## Arquitetura

Cada domínio (`medications`, `treatments`, `reminders`, `users`, `pharmacies`) é organizado em **arquitetura hexagonal** (Ports & Adapters), com quatro camadas. A regra que mantém tudo no lugar: **as dependências apontam sempre para dentro** — adapters dependem da aplicação, a aplicação depende do domínio, e o domínio não depende de ninguém.

```
src/<dominio>/
├── domain/                 # entidade + portas (contratos). Sem NestJS, sem Drizzle.
│   ├── <entidade>.entity.ts        # entidade imutável, com as regras invariantes
│   └── <x>.repository.port.ts      # abstract class = contrato do repositório
├── application/            # casos de uso (1 arquivo = 1 ação) + DTOs de entrada/saída
│   └── use-cases/*.usecase.ts
└── adapters/
    ├── in/                 # entradas que disparam casos de uso
    │   ├── ai-tools/       #   tools da IA (tool calling)
    │   ├── whatsapp/       #   handlers de fluxo estruturado
    │   └── messaging/      #   consumidores de eventos
    └── out/                # saídas (implementações das portas)
        ├── drizzle-<x>.repository.ts   # implementação Postgres da porta
        └── <x>.schema.ts               # mapeamento de tabela (Drizzle)
```

O `<dominio>.module.ts` é onde a inversão de dependência acontece: a porta (abstract class) é o token, o adapter concreto é o `useClass`.

```ts
providers: [
  { provide: MedicationsRepository, useClass: DrizzleMedicationsRepository },
  // use-cases e adapters in...
];
```

### Como os princípios SOLID aparecem aqui

- **S (Responsabilidade única)** — cada caso de uso faz uma coisa: `RegisterMedicationUseCase`, `DeleteMedicationUseCase`, `RegenerateTreatmentRemindersUseCase`. Adapter não tem regra de negócio: ele traduz a entrada, chama o caso de uso e formata a saída. A regra "não apagar medicamento com tratamento ativo", por exemplo, vive em `DeleteMedicationUseCase` — não na tool da IA.
- **O (Aberto/Fechado)** — para dar uma nova capacidade à IA, crie uma classe que estende `AiToolInterface` e registre no módulo; o `AiToolsRegistry` passa a expô-la sem nenhuma alteração no orquestrador. Mesma ideia para um novo fluxo de WhatsApp (`MessageHandlerInterface`) ou um novo presenter de QR code (`QrCodePresenter`).
- **L (Substituição de Liskov)** — quem precisa do banco depende de `MedicationsRepository` (a porta), nunca de `DrizzleMedicationsRepository`. Trocar Postgres por outra implementação, ou por um fake em teste, não toca o caso de uso.
- **I (Segregação de interface)** — as portas são pequenas e específicas: `Clock` (`now()`), `MessageSender` (envio), `TransactionRunner` (transação), `PharmaciesGateway` (consulta). Nada de "service gigante" com dezenas de métodos não relacionados.
- **D (Inversão de dependência)** — injeção sempre pela abstração, no construtor. Para o banco, injete o token `DATABASE` (definido em `src/db/database.module.ts`), não o pool direto:

  ```ts
  constructor(@Inject(DATABASE) private readonly db: NodePgDatabase) {}
  ```

### Receita: novo domínio passo a passo

1. **Domínio** — entidade imutável em `domain/<entidade>.entity.ts` (com as regras que não podem ser violadas) e a porta `domain/<x>.repository.port.ts` (abstract class).
2. **Schema + migration** — tabela em `adapters/out/<x>.schema.ts` (e registre em `src/db/schema/index.ts`), depois `yarn drizzle:generate` no host e commite o SQL em `drizzle/`.
3. **Adapter de saída** — `adapters/out/drizzle-<x>.repository.ts` implementando a porta, injetando o token `DATABASE`.
4. **Casos de uso** — um arquivo por ação em `application/use-cases/`. Validação e regras moram aqui; lance `NotFoundException`/`BadRequestException`/`ConflictException` conforme o caso.
5. **Adapters de entrada** — a tool da IA (`adapters/in/ai-tools/`), o handler de WhatsApp (`adapters/in/whatsapp/`) ou o consumidor de evento que dispara os casos de uso. Mantenha-os finos.
6. **Module** — registre porta→adapter, casos de uso e adapters de entrada em `<dominio>.module.ts`; importe o módulo onde for consumido.

> A entrada HTTP é mínima neste serviço (só `GET /bot/status` e os recursos legados). O grosso das entradas é via WhatsApp/RabbitMQ e tools da IA — por isso a camada `adapters/in/` tem mais que controllers REST.

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
    ├── main.ts
    ├── @types/            # tipos compartilhados (ai, whatsapp, messaging, ...)
    ├── infra/
    │   ├── nest/app.module.ts   # raiz da composição (imports de todos os módulos)
    │   └── messaging/           # RabbitMQ (módulo, service, consumers, constants)
    ├── db/
    │   ├── database.module.ts   # provider do token DATABASE (Pool pg + drizzle())
    │   ├── schema/              # tabelas: users, treatments, medications, reminders, chat_*
    │   └── relations.ts
    ├── shared/            # portas e adapters transversais
    │   ├── ports/         #   Clock, MessageSender, TransactionRunner
    │   └── adapters/      #   SystemClock, DrizzleTransactionRunner
    ├── bot/               # entrada WhatsApp (Baileys) + roteamento + IA
    │   ├── connection/    #   conexão/sessão Baileys
    │   ├── interfaces/    #   MessageSender, MessageHandler, SocketProvider, ...
    │   ├── messaging/     #   MessageRouter + handlers estruturados + state
    │   ├── presenters/    #   QR code
    │   └── ai/            #   orquestrador, AiToolsRegistry, clientes de IA, histórico
    │
    └── <dominio>/         # medications | treatments | reminders | users | pharmacies
        ├── domain/                # entidade + portas (contratos)
        ├── application/use-cases/ # casos de uso (1 ação por arquivo)
        ├── adapters/in/           # ai-tools, whatsapp, messaging, crons
        ├── adapters/out/          # drizzle-*.repository + *.schema
        └── <dominio>.module.ts    # liga porta→adapter e registra os use cases
```

> Cada domínio segue a mesma estrutura hexagonal (ver seção **Arquitetura**). O `pharmacies` é o que mais foge: a saída é assíncrona via RabbitMQ (`rabbitmq-pharmacies.gateway.ts`) e a resposta volta pelo `IntegrationConsumer`.

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
