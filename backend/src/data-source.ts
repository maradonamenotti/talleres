import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

import { User } from "./modules/users/user.entity";
import { TacticalCase } from "./modules/tactical-cases/tactical-case.entity";
import { MeetRoom } from "./modules/meet-rooms/meet-room.entity";
import { MeetRoomRegistration } from "./modules/meet-rooms/meet-room-registration.entity";
import { AccessLog } from "./modules/stats/access-log.entity";
import { AuthorizedCourse } from "./modules/auth/authorized-course.entity";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_DATABASE || "talleres",
    ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false,
    synchronize: true, // Set to false in production
    logging: false,
    entities: [User, TacticalCase, MeetRoom, MeetRoomRegistration, AccessLog, AuthorizedCourse],
    migrations: [],
    subscribers: [],
});
