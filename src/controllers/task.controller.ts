import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services';
import { AuthRequest, CreateTaskRequest, UpdateTaskRequest } from '../types';
import { UnauthorizedError, BadRequestError } from '../middleware/error';

export class TaskController {
  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const taskData: CreateTaskRequest = req.body;
      const createdBy = req.user?.userId;

      if (!createdBy) {
        throw new UnauthorizedError('Usuario no autenticado');
      }

      const task = await TaskService.createTask({ ...taskData, createdBy });

      res.status(201).json({
        success: true,
        message: 'Tarea creada exitosamente',
        data: { task }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const projectId = req.query.project as string;

      const filter: any = {};
      
      if (projectId) {
        filter.project = projectId;
      }

      if (req.query.status) {
        filter.status = req.query.status;
      }

      if (req.query.priority) {
        filter.priority = req.query.priority;
      }
      const result = await TaskService.getUserTasks(
        req.user?.userId!,
        req.user?.role!,
        filter,
        page,
        limit
      );

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
        throw new BadRequestError('Faltan parámetros requeridos');
      }

      const task = await TaskService.getTaskById(id);
      await TaskService.checkTaskPermission(id, userId, role);

      res.json({
        success: true,
        data: { task }
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
        throw new BadRequestError('Faltan parámetros requeridos');
      }

      const updates: UpdateTaskRequest = req.body;
      await TaskService.checkTaskPermission(id, userId, role);
      const updatedTask = await TaskService.updateTask(id, updates);

      res.json({
        success: true,
        message: 'Tarea actualizada exitosamente',
        data: { task: updatedTask }
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
        throw new BadRequestError('Faltan parámetros requeridos');
      }

      await TaskService.checkTaskPermission(id, userId, role);
      await TaskService.deleteTask(id);

      res.json({
        success: true,
        message: 'Tarea eliminada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const userId = req.user?.userId;
      const role = req.user?.role;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!projectId || !userId || !role) {
        throw new BadRequestError('Faltan parámetros requeridos');
      }

      const result = await TaskService.getTasksByProject(projectId, userId, role, page, limit);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}