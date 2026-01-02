import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity() // 1. Tells TypeORM this class represents a SQL table
export class User {
  @PrimaryGeneratedColumn() // 2. Auto-incrementing ID (1, 2, 3...)
  id: number;

  @Column() // 3. A standard database column
  name: string;

  @Column({ unique: true }) // 4. Emails must be unique
  email: string;

  @Column()
  role: string;
  
  // Note: In a real app, we would store a 'password' column too, 
  // but we'll keep it simple for this step.
}