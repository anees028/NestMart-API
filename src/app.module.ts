import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { Product } from './products/entities/product.entity';
import { OrdersModule } from './orders/orders.module';
import { Order } from './orders/entities/order.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available everywhere
    }),
    TypeOrmModule.forRoot({
      type: process.env.DB_TYPE as 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT as string, 10) || 5432,
      username: process.env.DB_USERNAME,  
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, Product, Order],               // Add all the entities here...
      synchronize: process.env.DB_SYNCHRONIZE === 'true',          // CRITICAL: Auto-creates tables. Set to FALSE in production!
      autoLoadEntities: process.env.DB_AUTO_LOAD_ENTITIES === 'true',
    }),
    UsersModule,
    AuthModule,
    ProductsModule,
    OrdersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
