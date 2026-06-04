import { Response } from 'express';
import { UsersService } from './users.service';
import { AuthRequest } from '../auth/jwt.middleware';
import * as bcrypt from 'bcrypt';

const usersService = new UsersService();

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }

    const user = await usersService.findById(userId);
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el perfil" });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await usersService.findAll();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

export const updateRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const user = await usersService.updateRole(id, role);
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar rol" });
  }
};

export const banUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { banned } = req.body;
    const user = await usersService.banUser(id, banned);
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cambiar estado de acceso" });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await usersService.deleteUser(id);
    res.json({ message: "Usuario eliminado con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
};

export const adminCreateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, full_name, role, dni, career } = req.body;

    if (!email || !password || !full_name || !role) {
      res.status(400).json({ error: "Faltan campos requeridos (email, password, full_name, role)" });
      return;
    }

    // Verificar si ya existe
    const existingUser = await usersService.findByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: "El correo electrónico ya está registrado." });
      return;
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const newUser = await usersService.createUser({
      email,
      password: hashedPassword,
      full_name,
      role,
      dni,
      career,
      email_confirmed: true
    });

    res.json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el usuario" });
  }
};
