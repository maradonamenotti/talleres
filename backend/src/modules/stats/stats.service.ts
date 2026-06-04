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

  async getLastAccessLog(): Promise<AccessLog | null> {
    const logs = await this.logRepository.find({
      order: { fecha: "DESC" },
      take: 1
    });
    return logs.length > 0 ? logs[0] : null;
  }

  // Add more statistical queries as needed (e.g. daily, weekly active users)
}
