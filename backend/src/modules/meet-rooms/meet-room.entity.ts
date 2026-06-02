import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "../users/user.entity";

@Entity("meet_rooms")
export class MeetRoom {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "varchar", nullable: true })
  meet_link: string;

  @Column({ type: "timestamp" })
  meet_time: Date;

  @Column({ name: "created_by", nullable: true })
  created_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "created_by" })
  creator: User;

  @CreateDateColumn()
  created_at: Date;
}
