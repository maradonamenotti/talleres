import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "../users/user.entity";

@Entity("entrenador_access_logs")
export class AccessLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id" })
  user_id: string;

  @Column({ type: "varchar", nullable: true })
  email: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @CreateDateColumn({ name: "fecha" })
  fecha: Date;
}
