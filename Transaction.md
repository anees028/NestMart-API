# Transactions: avoid the "Ghost" Purchase

## ✅ Summary

Junior engineers write code that works when everything goes right. Senior engineers write code that stays safe when things go wrong. This document explains the classic "ghost purchase" problem and how to fix it using database transactions in a NestJS + TypeORM app.

---

## The Problem: The "Ghost" Purchase

Imagine createOrder does two steps:

1. Decrease product stock (Inventory: 10 -> 9)
2. Save the Order to the database

If the process crashes between (1) and (2) (DB connection drops, server restarts, etc.), the stock is decreased but the Order was never saved. You lose an item without a record of who bought it — the "ghost" purchase.

---

## The Solution: Database Transactions

A transaction groups multiple DB operations into an atomic unit:

- Commit: everything succeeded → changes become permanent.
- Rollback: any failure → undo everything as if it never happened.

Use the database's transaction primitives to wrap stock update + order creation.

---

## Key TypeORM concept: queryRunner.manager vs repository

- repository.save(...) writes directly via the repository to the real DB.
- queryRunner.manager.save(...) operates inside the QueryRunner's transactional context: changes are staged and only applied when you call `commitTransaction()`.

Use a QueryRunner when you need to combine multiple actions in a single transaction.

---

## Example: Transaction-safe order creation (NestJS + TypeORM)

Important: inject `DataSource` (TypeORM 0.3.x) into the service.

```ts
// orders.service.ts (excerpt)
import { DataSource, In } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

constructor(
  private dataSource: DataSource,
  @InjectRepository(Product) private productRepo: Repository<Product>,
  @InjectRepository(Order) private orderRepo: Repository<Order>,
) {}

async create(createOrderDto: CreateOrderDto, user: User) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Use queryRunner.manager to read & write inside the transaction
    const products = await queryRunner.manager.findBy(Product, {
      id: In(createOrderDto.productIds),
    });

    if (products.length !== createOrderDto.productIds.length) {
      throw new NotFoundException('Some products were not found');
    }

    // Adjust stock (example assumes `product.stock` exists)
    for (const p of products) {
      if (p.stock == null || p.stock < 1) {
        throw new NotFoundException(`Product ${p.id} is out of stock`);
      }
      p.stock = p.stock - 1;
      await queryRunner.manager.save(p);
    }

    const order = queryRunner.manager.create(Order, {
      status: 'PENDING',
      user,
      products,
    });

    await queryRunner.manager.save(order);

    // COMMIT: make all staged changes permanent
    await queryRunner.commitTransaction();

    return order;
  } catch (err) {
    // ROLLBACK: undo any staged changes
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    // Always release queryRunner
    await queryRunner.release();
  }
}
```

---

## Concurrency & Locking

If multiple users may buy the same product concurrently, also use row-level locks (pessimistic write) to prevent overselling:

```ts
const products = await queryRunner.manager
  .createQueryBuilder(Product, 'product')
  .setLock('pessimistic_write')
  .where('product.id IN (:...ids)', { ids: createOrderDto.productIds })
  .getMany();
```

This ensures two transactions cannot decrement the same product stock simultaneously and cause race conditions.

---

## When a DB Transaction is NOT enough

- External calls (payment gateways, email providers, shipping APIs) cannot be rolled back by the DB.
  - Use Sagas or idempotent retry patterns to achieve eventual consistency.
  - Example: complete payment before committing inventory, or use a compensation action to restore stock if later steps fail.

- Distributed databases / microservices may require specialized patterns (distributed transactions are complex). Prefer application-level sagas.

---

## Testing & Validation

- Add unit/integration tests for success and failure paths:
  - Simulate DB failures to confirm rollback restores stock.
  - Test concurrent purchase attempts to verify locks prevent oversell.

- Monitor for partial failures and add alerting where appropriate.

---

## Practical Tips

- Always release the QueryRunner in `finally` to avoid leaked connections.
- Keep transactions short (no long-running external HTTP calls inside a transaction).
- Prefer database constraints (e.g., NOT NULL, CHECK) and use transactions to preserve invariants.
- Log errors and the rollback reason for easier debugging.

---

## Congratulations!

You have implemented the stack-level skills every senior backend engineer uses: runtime/Node internals, REST/NestJS, DB relations & ACID transactions, security (JWT & guards), validation & DTOs, and quality (tests). Transactions are the foundation that keeps your system correct when things go wrong.

If you want, I can implement the transactional `create()` in `OrdersService`, add stock to the `Product` entity, and write tests that assert rollback behavior. ✅
