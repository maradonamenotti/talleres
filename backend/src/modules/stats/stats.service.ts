import { AppDataSource } from "../../data-source";
import { AccessLog } from "./access-log.entity";

export class StatsService {
  private logRepository = AppDataSource.getRepository(AccessLog);

  async logAccess(userId: string, email: string): Promise<void> {
    const log = this.logRepository.create({ user_id: userId, email });
    await this.logRepository.save(log);
  }

  async getRecentLogs(limit: number = 10): Promise<AccessLog[]> {
    return this.logRepository.find({
      order: { fecha: "DESC" },
      take: limit,
      relations: ["user"]
    });
  }

  // Add more statistical queries as needed (e.g. daily, weekly active users)
}
