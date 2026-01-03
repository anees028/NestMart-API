import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';

@Entity() // 1. Tells TypeORM this class represents a SQL table
export class User {
  @PrimaryGeneratedColumn() // 2. Auto-incrementing ID (1, 2, 3...)
  id: number;

  @Column() // 3. A standard database column
  name: string;

  @Column({ unique: true }) // 4. Emails must be unique
  email: string;
  
  @Column()
  @Exclude() // This tells the serializer: "Never include this field in the JSON response"
  password: string; // The hashed password will be stored here

  @Column()
  role: string;

  // AUTOMATION MAGIC:
  // TypeORM has "Listeners". This function runs automatically 
  // BEFORE the user is saved to the database.
  @BeforeInsert()
  async hashPassword() {
    // 10 is the "Salt Rounds" (Complexity cost). Higher = slower but safer.
    this.password = await bcrypt.hash(this.password, 10);
  }
}