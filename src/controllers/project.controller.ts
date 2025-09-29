import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services';
import { AuthRequest, CreateProjectRequest, UpdateProjectRequest } from '../types';
import { UnauthorizedError, BadRequestError } from '../middleware/error'; 

export class ProjectController {
  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectData: CreateProjectRequest = req.body;
      const owner = req.user?.userId;

      if (!owner) {
        throw new UnauthorizedError('Usuario no autenticado');
      }

      const project = await ProjectService.createProject({ ...projectData, owner });

      res.status(201).json({
        success: true,
        message: 'Proyecto creado exitosamente',
        data: { project }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const filter: any = {};
      
      if (req.query.status) {
        filter.status = req.query.status;
      }

      if (req.query.startDate) {
        filter.startDate = { $gte: new Date(req.query.startDate as string) };
      }

      if (req.user?.role !== 'superadmin') {
        filter.owner = req.user?.userId;
      }

      const result = await ProjectService.getProjects(filter, page, limit);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const role = req.user?.role;
      
      if (!id || !userId || !role) {
        throw new BadRequestError('Faltan parámetros requeridos'); // ✅ Usa importación directa
      }

      const project = await ProjectService.getProjectById(id);
      await ProjectService.checkProjectPermission(id, userId, role);

      res.json({
        success: true,
        data: { project }
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const role = req.user?.role;
      
      if (!id || !userId || !role) {
        throw new BadRequestError('Faltan parámetros requeridos'); // ✅ Usa importación directa
      }

      const updates: UpdateProjectRequest = req.body;
      await ProjectService.checkProjectPermission(id, userId, role);
      const updatedProject = await ProjectService.updateProject(id, updates);

      res.json({
        success: true,
        message: 'Proyecto actualizado exitosamente',
        data: { project: updatedProject }
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const role = req.user?.role;
      
      if (!id || !userId || !role) {
        throw new BadRequestError('Faltan parámetros requeridos'); // ✅ Usa importación directa
      }

      await ProjectService.checkProjectPermission(id, userId, role);
      await ProjectService.deleteProject(id);

      res.json({
        success: true,
        message: 'Proyecto eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyProjects(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const filter = { owner: req.user?.userId };
      const result = await ProjectService.getProjects(filter, page, limit);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await ProjectService.getProjectStats(req.user?.userId!, req.user?.role!);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}