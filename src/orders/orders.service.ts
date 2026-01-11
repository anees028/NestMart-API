import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm'; // Import 'In' operator
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { Product } from 'src/products/entities/product.entity';
import { User } from 'src/users/user.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: User) {
    // 1. Find all products with the given IDs
    // SQL Equivalent: SELECT * FROM product WHERE id IN (1, 2)
    const products = await this.productRepo.findBy({
      id: In(createOrderDto.productIds),
    });

    // Validation: Did we find valid products?
    if (products.length !== createOrderDto.productIds.length) {
      throw new NotFoundException('Some products were not found');
    }

    // 2. Create the Order object
    const order = this.orderRepo.create({
      status: 'PENDING',
      user: user,     // Link the user
      products: products, // Link the products (TypeORM handles the junction table!)
    });

    // 3. Save
    return this.orderRepo.save(order);
  }

  async findAll() {
    return this.orderRepo.find({
      relations: ['products', 'user'], // Load the related data
    });
  }
}