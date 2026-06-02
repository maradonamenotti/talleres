import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("authorized_courses")
export class AuthorizedCourse {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "int", unique: true })
  moodle_course_id: number;

  @Column({ type: "varchar", nullable: true })
  course_name: string;

  @CreateDateColumn()
  created_at: Date;
}
