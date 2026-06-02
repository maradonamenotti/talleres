import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET || 'mi_super_secreto_jwt_2026';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, jwtSecret, (err, user) => {
      if (err) {
        res.sendStatus(403);
        return;
      }

      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.sendStatus(401);
      return;
    }
    if (roles.includes(req.user.role) || req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: "No tienes permisos suficientes." });
    }
  };
};
