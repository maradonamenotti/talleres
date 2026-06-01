import { Request, Response } from 'express';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://hnqfsfjobjirbddsnfau.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhucWZzZmpvYmppcmJkZHNuZmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODEwNjQsImV4cCI6MjA5MDQ1NzA2NH0.ihTY7w6nuXdUgO0CN34EFr69nv65ahxpRsm8UWxt1zY';
const ssoSecretKey = process.env.SSO_SECRET_KEY || 'clave_secreta_moodle_sso_2026';

export const handleSSO = async (req: Request, res: Response): Promise<void> => {
  const { username, email, firstname, lastname, course_id, hash } = req.body;

  if (!username || !email || !firstname || !lastname || !course_id || !hash) {
    res.status(400).json({ error: 'Faltan parámetros requeridos para el inicio de sesión único.' });
    return;
  }

  try {
    // 1. Validar Firma (Hash)
    // Fórmula: sha256(username + email + course_id + SECRET_KEY)
    const dataToHash = `${username}${email}${course_id}${ssoSecretKey}`;
    const computedHash = crypto
      .createHash('sha256')
      .update(dataToHash)
      .digest('hex');

    if (computedHash.toLowerCase() !== hash.toLowerCase()) {
      res.status(401).json({ error: 'Firma de autenticación inválida (Hash mismatch).' });
      return;
    }

    // 2. Validar que el curso esté autorizado en la base de datos de Supabase vía REST API
    const url = `${supabaseUrl}/rest/v1/authorized_courses?moodle_course_id=eq.${parseInt(course_id)}&select=*`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Error querying Supabase REST API:', errText);
      res.status(500).json({ error: 'Error al verificar la autorización del curso.' });
      return;
    }

    const courses = await response.json() as any[];
    const course = courses[0];

    if (!course) {
      res.status(403).json({ 
        error: `El curso de Moodle (ID: ${course_id}) no está autorizado para acceder a esta plataforma.` 
      });
      return;
    }

    // 3. Generar contraseña determinista basada en el DNI y la clave secreta
    const ssoPassword = crypto
      .createHash('sha256')
      .update(`${username}_${ssoSecretKey}`)
      .digest('hex')
      .substring(0, 20); // Tomamos los primeros 20 caracteres

    // Retornamos las credenciales para que el frontend pueda iniciar sesión directamente
    res.json({
      success: true,
      email: email,
      password: ssoPassword
    });

  } catch (error) {
    console.error('Error general en SSO Controller:', error);
    res.status(500).json({ error: 'Error interno del servidor en el proceso de autenticación.' });
  }
};
