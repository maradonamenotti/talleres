import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", unique: true })
  email: string;

  @Column({ type: "varchar", nullable: true })
  full_name: string;

  @Column({ type: "varchar", nullable: true, select: false })
  password?: string;

  @Column({ type: "varchar", default: "student" })
  role: string; // 'student', 'teacher', 'admin'

  @Column({ type: "boolean", default: false })
  email_confirmed: boolean;

  @Column({ type: "boolean", default: false })
  banned: boolean;

  @Column({ type: "varchar", nullable: true })
  student_whatsapp: string;

  @Column({ type: "varchar", nullable: true })
  dni: string;

  @Column({ type: "varchar", nullable: true })
  career: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
