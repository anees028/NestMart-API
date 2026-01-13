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
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available everywhere
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'nest_user',      // Must match docker-compose
      password: 'nest',  // Must match docker-compose
      database: 'nestmart_db',    // Must match docker-compose
      entities: [User, Product, Order],               // Add all the entities here...
      synchronize: true,          // CRITICAL: Auto-creates tables. Set to FALSE in production!
      autoLoadEntities: true,
    }),
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE', // We will inject this name later
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: 'api-gateway-consumer',
          },
        },
      },
    ]),
    UsersModule,
    AuthModule,
    ProductsModule,
    OrdersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
