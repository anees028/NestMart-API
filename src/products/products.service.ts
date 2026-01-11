import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  // 1. We accept the DTO AND the User who is making the request
  async create(createProductDto: CreateProductDto, user: User) {
    const newProduct = this.productRepo.create({
      ...createProductDto,
      creator: user, // Magic: TypeORM links the ID automatically
    });

    return this.productRepo.save(newProduct);
  }

  async findAll() {
    return this.productRepo.find();
  }
}
