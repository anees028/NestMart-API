# Microservices (Kafka) — NestMart (what I implemented in this branch) 🧩🚀

This document summarizes the microservice work in this project (Kafka-based Email Service), how the pieces communicate, how to run things locally, and how to test them. It focuses on what was added/changed in this branch.

---

## Architecture (short)

- The main API (monolith) handles orders and business logic.
- When an order is created, the API emits an **event** (topic: `order_created`) into **Kafka** (pub/sub).
- The `email-service` microservice subscribes to the `order_created` topic and handles the event (simulated email send).
- This yields a **decoupled**, **async**, and **resilient** flow: the API returns quickly, and the microservice processes events independently.

---

## Key pieces (code snippets)

### 1) Kafka (Docker Compose)

A lightweight Kafka setup (in `docker-compose.yml`) is used to run Kafka locally:

```yaml
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    ports: ['2181:2181']

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    depends_on: [zookeeper]
    ports: ['9092:9092']
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
```

Start Kafka with:

```bash
docker compose up -d
```

---

### 2) Orders → Emit an event

In `src/orders/orders.module.ts` we register a Kafka client provider:

```ts
ClientsModule.register([
  {
    name: 'KAFKA_SERVICE',
    transport: Transport.KAFKA,
    options: { client: { brokers: ['localhost:9092'] }, consumer: { groupId: 'api-gateway-consumer' } }
  }
])
```

In `src/orders/orders.service.ts`, after the order is saved (and the DB transaction commits), we emit the event:

```ts
const eventData = { orderId: savedOrder.id, userEmail: user.email, totalPrice: ... };
this.kafkaClient.emit('order_created', eventData); // fire-and-forget
```

Notes:
- We emit only after `commitTransaction()` to avoid sending events for rolled-back work.
- `emit()` is non-blocking here (fire-and-forget) — the request doesn't wait for consumers.

---

### 3) Email Service (microservice) — listen to events

`apps/email-service/src/main.ts` creates a Kafka microservice:

```ts
const app = await NestFactory.createMicroservice(EmailServiceModule, {
  transport: Transport.KAFKA,
  options: { client: { brokers: ['localhost:9092'] }, consumer: { groupId: 'email-consumer' } }
});
await app.listen();
```

`apps/email-service/src/email-service.controller.ts` subscribes to `order_created`:

```ts
@EventPattern('order_created')
handleOrderCreated(@Payload() data: any) {
  console.log('📧 EMAIL SERVICE: Received Order Event!');
  console.log(`To: ${data.userEmail}`);
  console.log(`Subject: Order #${data.orderId} Confirmed`);
}
```

---

## How to run locally (commands)

- Start infrastructure (Kafka + Zookeeper):

```bash
docker compose up -d
```

- Start the API (development):

```bash
npm run start:nest-mart:dev
# or -> npm run start:nest-mart:debug  (for debug)
```

- Start the email microservice (dev or debug):

```bash
npm run start:email:dev
npm run start:email:debug
```

- VS Code: use the **Debug All Apps** compound in `.vscode/launch.json` to start both debuggers together.

---

## How to test (manual)

1. Ensure Kafka is running (`docker ps` shows `kafka` and `zookeeper`).
2. Start the API and `email-service`.
3. Create a user (POST `/users`) and log in (POST `/auth/login`) to get a token.
4. Create a product and then POST `/orders` with a body like:

```json
{ "productIds": [1] }
```

with header: `Authorization: Bearer <YOUR_JWT>`.

5. The API will return the created order. Meanwhile, `email-service` prints an email message in its logs:

```
📧 EMAIL SERVICE: Received Order Event!
To: admin@test.com
Subject: Order #5 Confirmed
```

---

## Troubleshooting tips

- If `email-service` doesn't receive events:
  - Confirm Kafka is running (`docker ps`).
  - Confirm both apps use the **same broker** address (`localhost:9092`).
  - Check that the Orders Service registered `KAFKA_SERVICE` and called `this.kafkaClient.emit(...)`.
  - Review consumer groups (`kafka-consumer-groups.sh` inside the container) to confirm consumers are connected.

- If you see connection errors, check `KAFKA_ADVERTISED_LISTENERS` in `docker-compose.yml` — the `PLAINTEXT_HOST://localhost:9092` mapping is often required to allow host (your Node apps) to connect.

---

## Why this design? (Benefits)

- **Decoupling:** Producers and consumers don't need to know about each other.
- **Reliability:** Services can crash/restart independently; the broker buffers events.
- **Scalability:** Add more consumers (scale out) by increasing consumer group members.
- **Performance:** Fire-and-forget events let API return fast while background workers handle side effects (emails, notifications, analytics).

---

## What I implemented in this branch ✅

- Added `apps/email-service/` microservice:
  - `main.ts` — Kafka microservice bootstrap
  - `email-service.controller.ts` — `@EventPattern('order_created')` handler
  - `email-service.service.ts` and tests
- Added Kafka and Zookeeper to `docker-compose.yml` (with `KAFKA_ADVERTISED_LISTENERS` configured for host access)
- Wired the Orders service to Kafka:
  - Register `KAFKA_SERVICE` in `src/orders/orders.module.ts` via `ClientsModule.register(...)` (Transport.KAFKA)
  - Emit `order_created` events in `src/orders/orders.service.ts` after transaction commit
- Added npm scripts to start the email service (`start:email`, `start:email:dev`, `start:email:debug`)
- Added VS Code debug configurations for running & attaching to both apps

---

## Interview questions & short answers

- Q: "Why use Kafka for this use-case?"
  - A: "Kafka is a scalable, durable pub/sub system ideal for decoupling services and processing events asynchronously (email sending, analytics, notifications)."

- Q: "Why emit events after committing a DB transaction?"
  - A: "To avoid publishing events for work that might later be rolled back (ensures at-least-once semantics align with stored data)."

- Q: "What's the difference between `emit()` and `send()` in Nest microservices?"
  - A: "`emit()` is fire-and-forget (no response expected), good for asynchronous notifications. `send()` is request/response (awaits a reply)."

- Q: "How do you handle retries and failures in consumers?"
  - A: "Use retry policies, dead-letter topics, or a supervisor pattern. Also make consumer handlers idempotent to tolerate duplicate events."

---

## Next steps & suggestions ✨

- Add retries and error handling (dead-lettering) for failed email sends.
- Create end-to-end tests that spin up Kafka & both apps (test harness using Docker Compose or TestContainers).
- Add observability: metrics and tracing (Prometheus, Jaeger) to track event latency and failures.
- Formalize event schemas (JSON Schema / Avro) and version events.

---

If you want, I can implement automated e2e tests for the order → email flow, add a retry+DLQ demo, or add instrumentation for tracing. Tell me which you'd like to tackle next.