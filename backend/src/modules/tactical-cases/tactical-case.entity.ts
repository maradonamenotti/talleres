import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "../users/user.entity";

@Entity("tactical_cases")
export class TacticalCase {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "student_id" })
  student_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "student_id" })
  student: User;

  @Column({ type: "varchar", nullable: true })
  club_institution: string;

  @Column({ type: "varchar", nullable: true })
  student_whatsapp: string;

  @Column({ type: "text", nullable: true })
  competitive_context: string;

  @Column({ type: "text", nullable: true })
  team_strengths: string;

  @Column({ type: "text", nullable: true })
  team_limitations: string;

  @Column({ type: "text", nullable: true })
  team_functioning: string;

  @Column({ type: "jsonb", nullable: true })
  player_characteristics: any;

  @Column({ type: "text", nullable: true })
  difficulty_problem: string;

  @Column({ type: "jsonb", nullable: true })
  difficulty_questions: any;

  @Column({ type: "jsonb", nullable: true })
  difficulty_solutions: any;

  @Column({ type: "varchar", default: "A" })
  video_option: string;

  @Column({ type: "jsonb", nullable: true })
  video_cuts: any;

  @Column({ type: "jsonb", nullable: true })
  video_full_match: any;

  @Column({ type: "jsonb", nullable: true })
  tactical_lineup: any;

  @Column({ type: "varchar", default: "draft" })
  status: string; // draft, submitted, observed, approved

  @Column({ type: "text", nullable: true })
  teacher_feedback: string;

  @Column({ type: "varchar", nullable: true })
  meet_schedule_status: string;

  @Column({ type: "text", nullable: true })
  student_schedule_comment: string;

  @Column({ type: "varchar", nullable: true })
  meet_link: string;

  @Column({ type: "timestamp", nullable: true })
  meet_time: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
