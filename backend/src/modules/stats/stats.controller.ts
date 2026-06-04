import { Request, Response } from 'express';
import { StatsService } from './stats.service';
import { AuthRequest } from '../auth/jwt.middleware';

const service = new StatsService();

export const getAccessLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logs = await service.getRecentLogs(50);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener historial de accesos." });
  }
};

export const getMoodleStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lastLog = await service.getLastAccessLog();
    res.json({
      last_access: lastLog ? lastLog.fecha : null
    });
  } catch (error) {
    console.error('Error al obtener estado de Moodle:', error);
    res.status(500).json({ error: "Error al obtener estado de Moodle." });
  }
};
