import { AppDataSource } from "../../data-source";
import { TacticalCase } from "./tactical-case.entity";

export class TacticalCasesService {
  private repository = AppDataSource.getRepository(TacticalCase);

  async findByStudent(studentId: string): Promise<TacticalCase | null> {
    return this.repository.findOne({ where: { student_id: studentId } });
  }

  async findAll(status?: string): Promise<TacticalCase[]> {
    const query = this.repository.createQueryBuilder("case")
      .leftJoinAndSelect("case.student", "student");
    if (status) {
      query.where("case.status = :status", { status });
    }
    return query.getMany();
  }

  async createCase(data: Partial<TacticalCase>): Promise<TacticalCase> {
    const newCase = this.repository.create(data);
    return this.repository.save(newCase);
  }

  async updateCase(id: string, data: Partial<TacticalCase>): Promise<TacticalCase | null> {
    await this.repository.update(id, data);
    return this.repository.findOneBy({ id });
  }

  async evaluateCase(id: string, teacherFeedback: string, status: string): Promise<TacticalCase | null> {
    await this.repository.update(id, { teacher_feedback: teacherFeedback, status });
    return this.repository.findOneBy({ id });
  }
}
