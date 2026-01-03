import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { Product } from './products/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'nest_user',      // Must match docker-compose
      password: 'nest',  // Must match docker-compose
      database: 'nestmart_db',    // Must match docker-compose
      entities: [User, Product],               // Add all the entities here...
      synchronize: true,          // CRITICAL: Auto-creates tables. Set to FALSE in production!
    }),
    UsersModule,
    AuthModule,
    ProductsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
