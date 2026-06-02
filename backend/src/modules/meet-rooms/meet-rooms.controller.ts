import { Response } from 'express';
import { MeetRoomsService } from './meet-rooms.service';
import { AuthRequest } from '../auth/jwt.middleware';

const service = new MeetRoomsService();

export const getActiveRooms = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rooms = await service.findAllActive();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las salas de meet." });
  }
};

export const createRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    payload.created_by = req.user.id;
    const room = await service.createRoom(payload);
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: "Error al crear la sala de meet." });
  }
};

export const getMyRegistrations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let regs;
    if (req.user.role === 'admin' || req.user.role === 'teacher') {
      regs = await service.getRegistrations();
    } else {
      regs = await service.getRegistrations(req.user.id);
    }
    res.json(regs);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener inscripciones." });
  }
};

export const registerRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // room id
    const reg = await service.registerStudent(id, req.user.id);
    res.json(reg);
  } catch (error) {
    res.status(500).json({ error: "Error al registrarse en la sala." });
  }
};

export const unregisterRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // room id
    await service.unregisterStudent(id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al cancelar la inscripción." });
  }
};

export const deleteRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await service.deleteRoom(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la sala de meet." });
  }
};
