import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../enums/roles.enum';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard) // Protect endpoint
  @Roles(Role.Admin) // Only Admins can create products
  create(@Body() createProductDto: CreateProductDto, @Request() req) {
    // req.user was attached by the AuthGuard (JWT Strategy)
    return this.productsService.create(createProductDto, req.user);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }
}
