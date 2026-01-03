import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/user.entity'; // Import User

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('decimal') // Use 'decimal' for money, never 'float'!
  price: number;

  @Column({ default: true })
  isActive: boolean;

  // RELATIONSHIP: Many Products -> One User
  // The first function returns the Target Entity (User)
  // The second function describes the inverse side (we'll add this to User next)
  @ManyToOne(() => User, (user) => user.products, { eager: true }) 
  creator: User;
}