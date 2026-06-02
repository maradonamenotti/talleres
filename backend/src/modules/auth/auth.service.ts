import * as crypto from "crypto";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
import { UsersService } from "../users/users.service";
import { AppDataSource } from "../../data-source";
import { AuthorizedCourse } from "./authorized-course.entity";

dotenv.config();

const ssoSecretKey = process.env.SSO_SECRET_KEY || 'clave_secreta_moodle_sso_2026';
const jwtSecret = process.env.JWT_SECRET || 'mi_super_secreto_jwt_2026';

export class AuthService {
  private usersService = new UsersService();
  private courseRepository = AppDataSource.getRepository(AuthorizedCourse);

  validateMoodleHash(username: string, email: string, courseId: string, hash: string): boolean {
    const dataToHash = `${username}${email}${courseId}${ssoSecretKey}`;
    const computedHash = crypto
      .createHash('sha256')
      .update(dataToHash)
      .digest('hex');
    return computedHash.toLowerCase() === hash.toLowerCase();
  }

  async validateCourseAuthorization(courseId: string): Promise<boolean> {
    const course = await this.courseRepository.findOneBy({ moodle_course_id: parseInt(courseId) });
    return !!course;
  }

  async processMoodleLogin(email: string, firstname: string, lastname: string): Promise<{ token: string, user: any }> {
    let user = await this.usersService.findByEmail(email);

    if (!user) {
      // Create user if they don't exist
      user = await this.usersService.createUser({
        email,
        full_name: `${firstname} ${lastname}`,
        role: "student",
        email_confirmed: true
      });
    }

    if (user.banned) {
      throw new Error("Usuario baneado.");
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '24h' }
    );

    return { token, user };
  }

  async processLocalLogin(email: string, pass: string): Promise<{ token: string, user: any }> {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ 
      where: { email },
      select: ["id", "email", "role", "banned", "full_name", "password"]
    });

    if (!user || !user.password) {
      throw new Error("Credenciales inválidas.");
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new Error("Credenciales inválidas.");
    }

    if (user.banned) {
      throw new Error("Usuario baneado.");
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // Remove password before returning
    delete user.password;

    return { token, user };
  }

  async getCourses(): Promise<AuthorizedCourse[]> {
    return this.courseRepository.find({ order: { moodle_course_id: "ASC" } });
  }

  async addCourse(moodleCourseId: number, courseName: string): Promise<AuthorizedCourse> {
    const course = this.courseRepository.create({
      moodle_course_id: moodleCourseId,
      course_name: courseName
    });
    return this.courseRepository.save(course);
  }

  async deleteCourse(moodleCourseId: number): Promise<void> {
    await this.courseRepository.delete({ moodle_course_id: moodleCourseId });
  }
}
