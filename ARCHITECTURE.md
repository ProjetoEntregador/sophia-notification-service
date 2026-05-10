# Arquitetura

Hexagonal (Ports & Adapters) com organização **vertical por domínio**.

---

## Estrutura

```
src/
├── reminders/
│   ├── domain/                                       # puro TypeScript
│   │   ├── reminder.entity.ts
│   │   ├── reminders.repository.port.ts              # abstract class
│   │   └── due-reminder.projection.ts
│   ├── application/
│   │   ├── dtos/                                     # inputs dos use cases
│   │   └── use-cases/
│   │       ├── confirm-dose.usecase.ts
│   │       ├── skip-dose.usecase.ts
│   │       ├── create-initial-reminder.usecase.ts
│   │       ├── create-next-reminder.usecase.ts       # cross-aggregate (treatments)
│   │       ├── dispatch-due-reminders.usecase.ts
│   │       ├── auto-skip-expired-reminders.usecase.ts
│   │       ├── list-reminders.usecase.ts
│   │       └── delete-reminder.usecase.ts
│   ├── adapters/
│   │   ├── in/
│   │   │   ├── reminders.controller.ts               # HTTP
│   │   │   ├── reminders-dispatch.cron.ts
│   │   │   ├── reminders-auto-skip.cron.ts
│   │   │   ├── ai-tools/                             # confirm-dose, skip-dose
│   │   │   └── whatsapp/                             # confirm-dose, skip-dose
│   │   └── out/
│   │       ├── reminder.schema.ts                    # pgTable Drizzle
│   │       └── drizzle-reminders.repository.ts
│   └── reminders.module.ts                           # wiring DI
│
├── treatments/
│   ├── domain/
│   │   ├── treatment.entity.ts
│   │   └── treatment.repository.port.ts
│   ├── application/
│   │   ├── dtos/
│   │   └── use-cases/
│   │       ├── register-treatment.usecase.ts
│   │       ├── update-treatment.usecase.ts
│   │       ├── delete-treatment.usecase.ts
│   │       └── list-treatments.usecase.ts
│   ├── adapters/
│   │   ├── in/
│   │   │   ├── treatments.controller.ts
│   │   │   ├── dtos/                                 # CreateTreatmentDto, etc.
│   │   │   ├── ai-tools/                             # register-treatment
│   │   │   └── whatsapp/                             # start-treatment + constants + types
│   │   └── out/
│   │       ├── treatment.schema.ts
│   │       ├── treatment-medication-link.schema.ts   # tabela N:M (mora aqui por convenção)
│   │       └── drizzle-treatments.repository.ts
│   └── treatments.module.ts
│
├── medications/
│   ├── domain/                                       # entity + port + medication-status type
│   ├── application/
│   │   ├── dtos/
│   │   └── use-cases/
│   │       ├── register-medication.usecase.ts
│   │       ├── update-medication.usecase.ts
│   │       ├── delete-medication.usecase.ts
│   │       ├── find-medication-by-name.usecase.ts
│   │       ├── list-medications.usecase.ts
│   │       └── get-medication-status.usecase.ts     # cálculo de consumo
│   ├── adapters/
│   │   ├── in/
│   │   │   ├── medications.controller.ts
│   │   │   ├── dtos/
│   │   │   └── ai-tools/                             # register-medication
│   │   └── out/
│   │       ├── medication.schema.ts
│   │       └── drizzle-medications.repository.ts
│   └── medications.module.ts
│
├── users/                                            # mesma estrutura, surface pequena
│
├── bot/                                              # adapter "lateral" (canais I/O)
│   ├── connection/                                   # sessão Baileys
│   ├── presenters/                                   # QR code presenter
│   ├── messaging/
│   │   ├── message.service.ts                        # implementação de MessageSender
│   │   ├── message-router.service.ts
│   │   ├── static-message-handler-registry.ts
│   │   ├── log-message.handler.ts
│   │   └── state/
│   ├── ai/
│   │   ├── ai-orchestrator.handler.ts
│   │   ├── ai-tools.registry.ts
│   │   ├── chat-history.service.ts
│   │   ├── local-ai.service.ts
│   │   └── interfaces/                               # AiServiceInterface, AiToolInterface
│   ├── interfaces/                                   # MessageHandler, MessageRouter, etc.
│   ├── bot.controller.ts
│   ├── bot.service.ts
│   └── bot.module.ts
│
├── shared/
│   ├── ports/
│   │   ├── clock.port.ts                             # abstract class Clock
│   │   └── message-sender.port.ts                    # abstract class MessageSender
│   └── adapters/
│       └── system-clock.adapter.ts
│
├── infra/
│   ├── nest/
│   │   └── tokens.ts                                 # vazio: ports são classes
│   └── messaging/                                    # RabbitMQ
│       ├── rabbitmq.module.ts
│       ├── publisher/
│       └── consumer/
│
├── @types/                                           # tipos cross-cutting (whatsapp, ai, conversation)
├── db/
│   ├── schema/                                       # barrels que re-exportam dos adapters
│   └── relations.ts
├── utils/
├── database.module.ts                                # DRIZZLE token (Pool pg + drizzle())
├── app.module.ts
└── main.ts
```

### Regras de dependência

- `<dominio>/domain/` **nunca** importa Nest, Drizzle, ou outro domínio. TypeScript puro.
- `<dominio>/application/` importa do próprio `domain/`, ports de `shared/ports/` e use cases exportados de outros domínios via DI. Tem `@Injectable()` (concessão prática ao Nest); o resto é puro.
- `<dominio>/adapters/` pode importar tudo (é onde o framework "vive").
- Cross-domain via **`imports/exports` dos módulos Nest**, nunca por path direto. Se virar bagunça, troca por eventos (`@nestjs/event-emitter`).

---

## DI por classes abstratas

Ports são `abstract class`.

```ts
// shared/ports/clock.port.ts
export abstract class Clock {
  abstract now(): Date;
}

// shared/adapters/system-clock.adapter.ts
@Injectable()
export class SystemClockAdapter extends Clock {
  now() { return new Date(); }
}

// reminders/reminders.module.ts
providers: [{ provide: Clock, useClass: SystemClockAdapter }]

// reminders/application/use-cases/confirm-dose.usecase.ts
constructor(private readonly clock: Clock) {}
```

Por que abstract class e não interface: **interfaces somem após o `tsc`**. Abstract class sobrevive como construtor JS, então funciona após a compilação.

---

## Entidades

Classes imutáveis com regras de domínio em métodos. Sem ORM, sem decoradores.

```ts
// reminders/domain/reminder.entity.ts
export class Reminder {
  constructor(
    public readonly id: string,
    public readonly treatmentId: string,
    public readonly scheduledTime: Date,
    public readonly sent: boolean,
    public readonly sentAt: Date | null,
    public readonly confirmed: boolean | null,
    public readonly confirmedAt: Date | null,
  ) {}

  isAwaitingResponse(): boolean { ... }
  isExpiredWithoutResponse(now: Date, graceMinutes: number): boolean { ... }
  markSent(at: Date): Reminder { ... }
  confirm(at: Date): Reminder { ... }
  skip(at: Date): Reminder { ... }
}
```

Predicados (`isExpiredWithoutResponse`, `isDue`) substituem WHERE clauses espalhadas por services.
Mutadores (`markSent`, `confirm`, `skip`, `withExtendedEndBy`, `withMedicationIds`) retornam nova instância.

`Treatment.nextDoseAfter(reference)` e `Treatment.withExtendedEndBy(ms)` capturam a regra "criar próxima dose; estender o tratamento se passou do término" — antes era SQL inline no repositório.

`Medication.matches(query)` é o filtro substring bidirecional (case-insensitive) que busca por "Dipirona" quando cadastrado como "dipirona monoidratada" e vice-versa.

---

## Use cases

Orquestram entidades + ports. Cada um faz uma coisa. Convergem caminhos REST + WhatsApp + AI tool num único ponto.

```ts
// reminders/application/use-cases/confirm-dose.usecase.ts
@Injectable()
export class ConfirmDoseUseCase {
  constructor(
    private readonly reminders: RemindersRepository,
    private readonly clock: Clock,
    private readonly createNextReminder: CreateNextReminderUseCase,
  ) {}

  async byId(id: string): Promise<Reminder> { ... }
  async byJid(jid: string): Promise<Reminder | null> { ... }

  private async confirm(reminder: Reminder): Promise<Reminder> {
    const resolved = reminder.confirm(this.clock.now());
    const saved = await this.reminders.save(resolved);
    await this.createNextReminder.execute(saved);
    return saved;
  }
}
```

**Antes:** lógica espalhada em `RemindersService.confirmReminder` (REST), `RemindersService.confirmDose → resolvePending` (WhatsApp/AI), e o tool `ConfirmDoseTool` reimplementando a chamada.
**Depois:** controller, handler, e tool injetam `ConfirmDoseUseCase`. Mudou a regra? Mexe num lugar só.

### Cross-aggregate

Quando uma operação toca duas entidades (ex.: confirmar dose + agendar próxima + estender tratamento se ultrapassou):

```ts
// reminders/application/use-cases/create-next-reminder.usecase.ts
@Injectable()
export class CreateNextReminderUseCase {
  constructor(
    private readonly reminders: RemindersRepository,
    private readonly treatments: TreatmentsRepository,
  ) {}

  async execute(currentReminder: Reminder): Promise<Reminder | null> {
    const treatment = await this.treatments.findById(currentReminder.treatmentId);
    const nextScheduledTime = treatment.nextDoseAfter(currentReminder.confirmedAt!);
    if (nextScheduledTime > treatment.endTime) {
      const delay = nextScheduledTime.getTime() - treatment.endTime.getTime();
      await this.treatments.save(treatment.withExtendedEndBy(delay));
    }
    return this.reminders.save(new Reminder(randomUUID(), treatment.id, nextScheduledTime, ...));
  }
}
```

A regra está em métodos da entidade (`nextDoseAfter`, `withExtendedEndBy`); o use case orquestra dois repositories.

**Trade-off conhecido:** as duas operações de save não estão numa transação única. Em caso de crash entre elas, fica inconsistência. Aceitável para o volume atual; trocar por outbox/UoW se virar problema mensurado.

---

## Adapters

### Out (persistência) — implementam ports do domínio

```ts
// reminders/adapters/out/drizzle-reminders.repository.ts
@Injectable()
export class DrizzleRemindersRepository extends RemindersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase) { super(); }

  async findById(id: string): Promise<Reminder | null> {
    const [row] = await this.db.select().from(reminders).where(eq(reminders.id, id));
    return row ? this.toEntity(row) : null;
  }

  async save(reminder: Reminder): Promise<Reminder> {
    const row = this.toRow(reminder);
    const [saved] = await this.db
      .insert(reminders).values(row)
      .onConflictDoUpdate({ target: reminders.id, set: row })
      .returning();
    return this.toEntity(saved);
  }

  private toEntity(row): Reminder { ... }
  private toRow(r: Reminder) { ... }
}
```

Mappers `toEntity`/`toRow` são o ponto de tradução. Trocou ORM? Mexe só aqui.

### In (entrada) — chamam use cases

- HTTP: `reminders/adapters/in/reminders.controller.ts` (controller magro, delega tudo).
- Crons: `reminders/adapters/in/reminders-dispatch.cron.ts`, `reminders-auto-skip.cron.ts`.
- AI tools: `reminders/adapters/in/ai-tools/{confirm-dose,skip-dose}.tool.ts`.
- WhatsApp handlers: `reminders/adapters/in/whatsapp/{confirm-dose,skip-dose}.handler.ts`.

---

## Módulos Nest = camada de fiação

Não hospedam regra. Amarram ports → adapters e expõem o que outros consomem.

```ts
// reminders/reminders.module.ts
@Module({
  imports: [forwardRef(() => BotModule), forwardRef(() => TreatmentsModule)],
  controllers: [RemindersController],
  providers: [
    { provide: RemindersRepository, useClass: DrizzleRemindersRepository },
    { provide: Clock, useClass: SystemClockAdapter },
    ConfirmDoseUseCase,
    SkipDoseUseCase,
    CreateNextReminderUseCase,
    CreateInitialReminderUseCase,
    DispatchDueRemindersUseCase,
    AutoSkipExpiredRemindersUseCase,
    ListRemindersUseCase,
    DeleteReminderUseCase,
    RemindersDispatchCron,
    RemindersAutoSkipCron,
    ConfirmDoseTool,
    SkipDoseTool,
    ConfirmDoseHandler,
    SkipDoseHandler,
  ],
  exports: [
    CreateInitialReminderUseCase,
    ConfirmDoseUseCase,
    SkipDoseUseCase,
    ConfirmDoseTool,
    SkipDoseTool,
    ConfirmDoseHandler,
    SkipDoseHandler,
  ],
})
export class RemindersModule {}
```

`forwardRef` é necessário porque domínios se importam mutuamente (treatments → reminders para `CreateInitialReminder`; reminders → treatments para `TreatmentsRepository`).

---

## Bot, shared, infra

**`bot/`** é adapter lateral — provê os canais de I/O do app:

- `MessageSender` (port em `shared/ports/`) é implementado por `MessageService` em `bot/messaging/`.
- O `AiOrchestratorHandler`, `AiToolsRegistry`, `StaticMessageHandlerRegistry`, `MessageRouter` e a sessão Baileys ficam todos em `bot/`. Eles agregam tools e handlers que **vêm dos domínios**. AI tools e WhatsApp handlers de cada domínio são providers exportados pelo respectivo módulo; o `BotModule` apenas importa os domínios e os registries os recebem por DI.

**`shared/`** guarda os contratos cross-domain (`Clock`, `MessageSender`) e adapters genéricos (`SystemClockAdapter`).

**`infra/`** é colagem técnica:

- `infra/nest/tokens.ts` — ponto centralizado caso surjam tokens de valor.
- `infra/messaging/` — RabbitMQ (`rabbitmq.module.ts`, `publisher/`, `consumer/`). Um adapter de mensageria; os domínios não conhecem.

---

## DB schema

`drizzle.config.ts` aponta para `src/db/schema/index.ts` (não mudou). Mas as definições reais dos `pgTable` agora moram nos adapters de cada domínio:

- `treatments/adapters/out/treatment.schema.ts`
- `treatments/adapters/out/treatment-medication-link.schema.ts` (tabela N:M)
- `reminders/adapters/out/reminder.schema.ts`
- `medications/adapters/out/medication.schema.ts`

`src/db/schema/*.ts` virou camada de re-export, mantendo `drizzle:generate` e `migrate` funcionando sem alteração.

`src/db/relations.ts` continua referenciando os schemas via `src/db/schema/`.

---

## Vantagens já entregues

1. **Caminhos convergem**: REST, WhatsApp, AI tool e cron usam o mesmo use case. Mudou a regra de "confirmar dose"? Um único arquivo.
2. **Lógica de domínio expressa em métodos da entidade** (`treatment.nextDoseAfter`, `treatment.withExtendedEndBy`, `reminder.isExpiredWithoutResponse`, `medication.matches`). Antes eram WHERE clauses e cálculos espalhados em services.
3. **Testabilidade**: `ConfirmDoseUseCase` pode rodar com `RemindersRepository` em memória. Não exige Postgres nem Nest.
4. **Trocar Groq por OpenAI** ou **WhatsApp por Telegram**: implementa novo adapter; use cases não mudam.
5. **DI por classe abstrata**: zero Symbol/string mágica. Sai do `tsc` direto pra runtime.

---

## Caminho de evolução pendente

- **Unit of Work / transações cross-aggregate**: `CreateNextReminderUseCase` salva treatment e reminder em duas operações. Se virar problema, introduzir UoW ou outbox.
- **Tabela de usuários real**: hoje `users/` deriva tudo de `treatments` e `reminders` por `userId`. Quando houver tabela própria, o port `UsersRepository` ganha `findById/save` e o `byJid` dos use cases passa a filtrar por usuário (`TODO` marcado em `confirm-dose`/`skip-dose`).
- **Eventos de domínio**: para reduzir os `forwardRef` cíclicos, dá para trocar chamadas diretas entre use cases por eventos (`@nestjs/event-emitter`).
