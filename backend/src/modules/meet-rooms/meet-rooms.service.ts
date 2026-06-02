import { AppDataSource } from "../../data-source";
import { MeetRoom } from "./meet-room.entity";
import { MeetRoomRegistration } from "./meet-room-registration.entity";

export class MeetRoomsService {
  private roomRepository = AppDataSource.getRepository(MeetRoom);
  private regRepository = AppDataSource.getRepository(MeetRoomRegistration);

  async findAllActive(): Promise<MeetRoom[]> {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    return this.roomRepository.createQueryBuilder("room")
      .leftJoinAndSelect("room.creator", "creator")
      .where("room.meet_time >= :twoHoursAgo", { twoHoursAgo })
      .orderBy("room.meet_time", "ASC")
      .getMany();
  }

  async createRoom(data: Partial<MeetRoom>): Promise<MeetRoom> {
    const room = this.roomRepository.create(data);
    return this.roomRepository.save(room);
  }

  async getRegistrations(studentId?: string): Promise<MeetRoomRegistration[]> {
    const query = this.regRepository.createQueryBuilder("reg")
      .leftJoinAndSelect("reg.room", "room");
    if (studentId) {
      query.where("reg.student_id = :studentId", { studentId });
    }
    return query.getMany();
  }

  async registerStudent(roomId: string, studentId: string): Promise<MeetRoomRegistration> {
    const reg = this.regRepository.create({ room_id: roomId, student_id: studentId });
    return this.regRepository.save(reg);
  }

  async unregisterStudent(roomId: string, studentId: string): Promise<void> {
    await this.regRepository.delete({ room_id: roomId, student_id: studentId });
  }

  async deleteRoom(roomId: string): Promise<void> {
    await this.roomRepository.delete(roomId);
  }
}
