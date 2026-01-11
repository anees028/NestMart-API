import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../../users/user.entity';
import { Product } from '../../products/entities/product.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'PENDING' })
  status: string; // e.g., PENDING, SHIPPED

  // 1. Link Order to User (Who bought it?)
  @ManyToOne(() => User, (user) => user.orders)
  user: User;

  // 2. Link Order to Products (What did they buy?)
  @ManyToMany(() => Product)
  @JoinTable() // <--- CRITICAL: This tells TypeORM "You are the owner, create the junction table here"
  products: Product[];
}