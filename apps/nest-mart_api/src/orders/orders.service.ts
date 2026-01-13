import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm'; // Import 'In' operator
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/user.entity';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    private dataSource: DataSource,
    // Inject the Kafka Client
    @Inject('KAFKA_SERVICE') private kafkaClient: ClientKafka,
  ) {}

  // 1. Connect to Kafka when the app starts
  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  async create(createOrderDto: CreateOrderDto, user: User) {
    // initialize a query runner for transaction query management
    const queryRunner = this.dataSource.createQueryRunner();
    let orderPrice = 0;

    // 1. Connect to the DB
    await queryRunner.connect();
    // 2. Start the Transaction
    await queryRunner.startTransaction();

    try {
      // ---------------- BUSINESS LOGIC START ----------------

      // Step A: Find the products (Use the queryRunner manager, NOT the global repository!)
      const products = await queryRunner.manager.findBy(Product, {
        id: In(createOrderDto.productIds),
      });

      const users = await queryRunner.manager.findOneBy(User, { id: user.id });
      if (!users) {
        throw new BadRequestException('User not found');
      }

      if (products.length !== createOrderDto.productIds.length) {
        throw new BadRequestException('Some products were not found');
      }

      // Step B: Check and Reduce Stock
      for (const product of products) {
        if (product.stock < 1) {
          throw new BadRequestException(
            `Product ${product.title} is out of stock!`,
          );
        }
        orderPrice = orderPrice + product.price;
        // Reduce stock
        product.stock--;
        // Save the updated product using the Transaction Manager
        await queryRunner.manager.save(product);
      }

      // Step C: Create the Order
      const order = queryRunner.manager.create(Order, {
        status: 'PENDING',
        user: user,
        products: products,
      });

      // Step D: Save the Order
      const savedOrder = await queryRunner.manager.save(order);

      // ---------------- BUSINESS LOGIC END ----------------

      // 3. If we got here, everything is good. PERMANENTLY SAVE.
      await queryRunner.commitTransaction();

      // 2. FIRE AND FORGET
      // We don't wait for this. We just throw it into Kafka and return.
      const eventData = {
        orderId: savedOrder.id,
        userName: users.name,
        userEmail: user.email,
        totalPrice: orderPrice, // Use the calculated order price
      };

      this.kafkaClient.emit('order_created', eventData);

      return savedOrder;
    } catch (err) {
      // 4. If ANY error happened above (Out of stock, DB crash, etc.)
      // UNDO EVERYTHING. Reset stock to 10. Delete the Order if it was made.
      await queryRunner.rollbackTransaction();

      // Re-throw the error so the Frontend knows something failed
      throw err;
    } finally {
      // 5. Always release the connection back to the pool
      await queryRunner.release();
    }
  }

  async findAll() {
    return this.orderRepo.find({
      relations: ['products', 'user'], // Load the related data
    });
  }
}
