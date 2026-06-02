import { Request, Response } from 'express';
import { AuthService } from './auth.service';

const authService = new AuthService();

export const handleSSO = async (req: Request, res: Response): Promise<void> => {
  const { username, email, firstname, lastname, course_id, hash } = req.body;

  if (!username || !email || !firstname || !lastname || !course_id || !hash) {
    res.status(400).json({ error: 'Faltan parámetros requeridos para el inicio de sesión único.' });
    return;
  }

  try {
    // 1. Validar Firma (Hash)
    const isValidHash = authService.validateMoodleHash(username, email, course_id, hash);
    if (!isValidHash) {
      res.status(401).json({ error: 'Firma de autenticación inválida (Hash mismatch).' });
      return;
    }

    // 2. Validar que el curso esté autorizado
    const isAuthorized = await authService.validateCourseAuthorization(course_id);
    if (!isAuthorized) {
      res.status(403).json({ 
        error: `El curso de Moodle (ID: ${course_id}) no está autorizado para acceder a esta plataforma.` 
      });
      return;
    }

    // 3. Procesar Login / Registro y generar JWT
    const { token, user } = await authService.processMoodleLogin(email, firstname, lastname);

    // Retornamos el token y datos del usuario
    res.json({
      success: true,
      token,
      user
    });

  } catch (error: any) {
    console.error('Error general en SSO Controller:', error);
    if (error.message === "Usuario baneado.") {
       res.status(403).json({ error: "Tu cuenta ha sido suspendida." });
       return;
    }
    res.status(500).json({ error: 'Error interno del servidor en el proceso de autenticación.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña requeridos.' });
    return;
  }

  try {
    const { token, user } = await authService.processLocalLogin(email, password);
    res.json({ success: true, token, user });
  } catch (error: any) {
    console.error('Error en login:', error);
    if (error.message === "Usuario baneado.") {
       res.status(403).json({ error: "Tu cuenta ha sido suspendida." });
       return;
    }
    if (error.message === "Credenciales inválidas.") {
       res.status(401).json({ error: "Credenciales inválidas." });
       return;
    }
    res.status(500).json({ error: 'Error al iniciar sesión.' });
  }
};

export const getCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const courses = await authService.getCourses();
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los cursos autorizados.' });
  }
};

export const addCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { moodleCourseId, courseName } = req.body;
    if (!moodleCourseId || !courseName) {
      res.status(400).json({ error: 'Faltan parámetros requeridos.' });
      return;
    }
    const course = await authService.addCourse(Number(moodleCourseId), courseName);
    res.json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al agregar curso autorizado.' });
  }
};

export const deleteCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await authService.deleteCourse(Number(id));
    res.json({ message: 'Curso desautorizado con éxito.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar curso autorizado.' });
  }
};
