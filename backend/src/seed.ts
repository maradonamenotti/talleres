import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { User } from "./modules/users/user.entity";
import { AuthorizedCourse } from "./modules/auth/authorized-course.entity";

import * as bcrypt from "bcrypt";

async function runSeed() {
  try {
    // 1. Inicializar la base de datos
    await AppDataSource.initialize();
    console.log("Conexión a la base de datos establecida.");

    // 2. Crear curso autorizado por defecto
    const courseRepo = AppDataSource.getRepository(AuthorizedCourse);
    const existingCourse = await courseRepo.findOneBy({ moodle_course_id: 12 });
    
    if (!existingCourse) {
      const defaultCourse = courseRepo.create({
        moodle_course_id: 12,
        course_name: "Curso Semilla por Defecto",
      });
      await courseRepo.save(defaultCourse);
      console.log("✅ Curso autorizado (ID: 12) creado con éxito.");
    } else {
      console.log("⚠️ El curso autorizado (ID: 12) ya existe.");
    }

    // 3. Crear usuarios
    const userRepo = AppDataSource.getRepository(User);
    const hashedPassword = await bcrypt.hash("Maradona2026", 10);

    const adminEmail = "admin@maradonamenotti.com.ar"; 
    const studentEmail = "alumno@maradonamenotti.com.ar";

    // Crear Admin
    const existingAdmin = await userRepo.findOneBy({ email: adminEmail });
    if (!existingAdmin) {
      const adminUser = userRepo.create({
        email: adminEmail,
        full_name: "Administrador General",
        role: "admin",
        password: hashedPassword,
        email_confirmed: true,
      });
      await userRepo.save(adminUser);
      console.log(`✅ Administrador (${adminEmail}) creado.`);
    } else {
      console.log(`⚠️ El administrador (${adminEmail}) ya existe.`);
    }

    // Crear Alumno
    const existingStudent = await userRepo.findOneBy({ email: studentEmail });
    if (!existingStudent) {
      const studentUser = userRepo.create({
        email: studentEmail,
        full_name: "Alumno Prueba",
        role: "student",
        password: hashedPassword,
        email_confirmed: true,
      });
      await userRepo.save(studentUser);
      console.log(`✅ Alumno (${studentEmail}) creado.`);
    } else {
      console.log(`⚠️ El alumno (${studentEmail}) ya existe.`);
    }

    console.log("=== SEED COMPLETADO ===");
    process.exit(0);
  } catch (error) {
    console.error("Error durante el proceso de Seed:", error);
    process.exit(1);
  }
}

runSeed();
