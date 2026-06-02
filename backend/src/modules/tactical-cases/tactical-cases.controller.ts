import { Response } from 'express';
import { TacticalCasesService } from './tactical-cases.service';
import { AuthRequest } from '../auth/jwt.middleware';

const service = new TacticalCasesService();

export const getMyCase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user.id;
    const tacticalCase = await service.findByStudent(studentId);
    res.json(tacticalCase || null);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la ficha táctica." });
  }
};

export const getAllCases = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string;
    const cases = await service.findAll(status);
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener fichas tácticas." });
  }
};

export const saveCase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user.id;
    const payload = req.body;
    payload.student_id = studentId;

    let tacticalCase = await service.findByStudent(studentId);
    if (tacticalCase) {
      tacticalCase = await service.updateCase(tacticalCase.id, payload);
    } else {
      tacticalCase = await service.createCase(payload);
    }
    
    res.json(tacticalCase);
  } catch (error) {
    res.status(500).json({ error: "Error al guardar la ficha táctica." });
  }
};

export const evaluateCase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { teacher_feedback, status } = req.body;
    const updated = await service.evaluateCase(id, teacher_feedback, status);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Error al evaluar la ficha táctica." });
  }
};
