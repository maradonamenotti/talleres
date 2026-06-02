import { Response } from 'express';
import { UsersService } from './users.service';
import { AuthRequest } from '../auth/jwt.middleware';

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
