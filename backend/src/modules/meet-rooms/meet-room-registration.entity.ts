import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from "typeorm";
import { User } from "../users/user.entity";
import { MeetRoom } from "./meet-room.entity";

@Entity("meet_room_registrations")
@Unique(["room_id", "student_id"])
export class MeetRoomRegistration {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "room_id" })
  room_id: string;

  @Column({ name: "student_id" })
  student_id: string;

  @ManyToOne(() => MeetRoom, { onDelete: "CASCADE" })
  @JoinColumn({ name: "room_id" })
  room: MeetRoom;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "student_id" })
  student: User;

  @CreateDateColumn()
  created_at: Date;
}
