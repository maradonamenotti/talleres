import { AppDataSource } from "../../data-source";
import { User } from "./user.entity";

export class UsersService {
  private userRepository = AppDataSource.getRepository(User);

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async createUser(data: Partial<User>): Promise<User> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async updateLastLogin(userId: string): Promise<void> {
    // Optionally update a last_login field if added later
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      order: { created_at: 'DESC' }
    });
  }

  async updateRole(id: string, role: string): Promise<User | null> {
    await this.userRepository.update(id, { role });
    return this.findById(id);
  }

  async banUser(id: string, banned: boolean): Promise<User | null> {
    await this.userRepository.update(id, { banned });
    return this.findById(id);
  }

  async deleteUser(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async updateUserData(id: string, data: Partial<User>): Promise<User | null> {
    await this.userRepository.update(id, data);
    return this.findById(id);
  }
}
