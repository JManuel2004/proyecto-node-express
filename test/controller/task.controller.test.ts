import { Request, Response, NextFunction } from 'express';
import { TaskController } from '../../src/controllers/task.controller';
import { TaskService } from '../../src/services/task.services';
import { AuthRequest, CreateTaskRequest, UpdateTaskRequest, ITask } from '../../src/types';
import { UnauthorizedError, BadRequestError } from '../../src/middleware/error';

// Mock del TaskService
jest.mock('../../src/services/task.services');
const mockTaskService = TaskService as jest.Mocked<typeof TaskService>;

describe('TaskController', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debe crear una tarea exitosamente', async () => {
      const taskData: CreateTaskRequest = {
        title: 'Nueva tarea',
        description: 'Descripción de la tarea',
        priority: 'high',
        deadline: new Date('2024-12-31'),
        project: '507f1f77bcf86cd799439012',
        assignedTo: '507f1f77bcf86cd799439013'
      };

      const mockTask: ITask = {
        _id: '507f1f77bcf86cd799439014',
        title: 'Nueva tarea',
        description: 'Descripción de la tarea',
        status: 'todo',
        priority: 'high',
        deadline: new Date('2024-12-31'),
        project: '507f1f77bcf86cd799439012',
        assignedTo: '507f1f77bcf86cd799439013',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest = {
        body: taskData,
        user: {
          userId: '507f1f77bcf86cd799439011',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockTaskService.createTask.mockResolvedValue(mockTask);

      await TaskController.create(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockTaskService.createTask).toHaveBeenCalledWith({
        ...taskData,
        createdBy: '507f1f77bcf86cd799439011'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tarea creada exitosamente',
        data: { task: mockTask }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar usuario no autenticado', async () => {
      const taskData: CreateTaskRequest = {
        title: 'Nueva tarea',
        description: 'Descripción de la tarea',
        priority: 'high',
        deadline: new Date('2024-12-31'),
        project: '507f1f77bcf86cd799439012'
      };

      mockRequest = {
        body: taskData,
        user: undefined
      } as unknown as AuthRequest;

      await TaskController.create(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockTaskService.createTask).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('debe manejar errores durante la creación', async () => {
      const taskData: CreateTaskRequest = {
        title: 'Nueva tarea',
        description: 'Descripción de la tarea',
        priority: 'high',
        deadline: new Date('2024-12-31'),
        project: '507f1f77bcf86cd799439012'
      };

      const mockError = new Error('Error al crear tarea');

      mockRequest = {
        body: taskData,
        user: {
          userId: '507f1f77bcf86cd799439011',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockTaskService.createTask.mockRejectedValue(mockError);

      await TaskController.create(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('getAll', () => {
    it('debe obtener todas las tareas con parámetros por defecto', async () => {
      const mockResult = {
        tasks: [
          {
            _id: '507f1f77bcf86cd799439014',
            title: 'Tarea 1',
            description: 'Descripción 1',
            status: 'todo',
            priority: 'medium',
            deadline: new Date('2024-12-31'),
            project: '507f1f77bcf86cd799439012'
          }
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalTasks: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      };

      mockRequest = {
        query: {},
        user: {
          userId: '507f1f77bcf86cd799439011',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockTaskService.getUserTasks.mockResolvedValue(mockResult as any);

      await TaskController.getAll(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockTaskService.getUserTasks).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'usuario',
        {},
        1,
        10
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe obtener tareas con filtros y paginación personalizada', async () => {
      const mockResult = {
        tasks: [],
        pagination: {
          currentPage: 2,
          totalPages: 1,
          totalTasks: 0,
          hasNextPage: false,
          hasPrevPage: true
        }
      };

      mockRequest = {
        query: {
          page: '2',
          limit: '5',
          project: '507f1f77bcf86cd799439012',
          status: 'in_progress',
          priority: 'high'
        },
        user: {
          userId: '507f1f77bcf86cd799439011',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockTaskService.getUserTasks.mockResolvedValue(mockResult as any);

      await TaskController.getAll(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockTaskService.getUserTasks).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'usuario',
        {
          project: '507f1f77bcf86cd799439012',
          status: 'in_progress',
          priority: 'high'
        },
        2,
        5
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar errores al obtener tareas', async () => {
      const mockError = new Error('Error al obtener tareas');

      mockRequest = {
        query: {},
        user: {
          userId: '507f1f77bcf86cd799439011',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockTaskService.getUserTasks.mockRejectedValue(mockError);

      await TaskController.getAll(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('debe obtener una tarea por ID exitosamente', async () => {
      const mockTask: ITask = {
        _id: '507f1f77bcf86cd799439014',
        title: 'Tarea de prueba',
        description: 'Descripción de prueba',
        status: 'todo',
        priority: 'medium',
        deadline: new Date('2024-12-31'),
        project: '507f1f77bcf86cd799439012',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest = {
        params: { id: '507f1f77bcf86cd799439014' },
        user: {
          userId: '507f1f77bcf86cd799439011',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockTaskService.getTaskById.mockResolvedValue(mockTask);
      mockTaskService.checkTaskPermission.mockResolvedValue(true);

      await TaskController.getById(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockTaskService.getTaskById).toHaveBeenCalledWith('507f1f77bcf86cd799439014');
      expect(mockTaskService.checkTaskPermission).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439014',
        '507f1f77bcf86cd799439011',
        'usuario'
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { task: mockTask }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar parámetros faltantes', async () => {
      mockRequest = {
        params: {},
        user: {
          userId: '507f1f77bcf86cd799439011',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      await TaskController.getById(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(mockTaskService.getTaskById).not.toHaveBeenCalled();
      expect(mockTaskService.checkTaskPermission).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('debe manejar usuario no autenticado', async () => {
      mockRequest = {
        params: { id: '507f1f77bcf86cd799439014' },
        user: undefined
      } as unknown as AuthRequest;

      await TaskController.getById(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(mockTaskService.getTaskById).not.toHaveBeenCalled();
      expect(mockTaskService.checkTaskPermission).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('debe manejar errores al obtener tarea', async () => {
      const mockError = new Error('Tarea no encontrada');

      mockRequest = {
        params: { id: '507f1f77bcf86cd799439014' },
        user: {
          userId: '507f1f77bcf86cd799439011',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockTaskService.getTaskById.mockRejectedValue(mockError);

      await TaskController.getById(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('debe actualizar una tarea exitosamente', async () => {
      const updates: UpdateTaskRequest = {
        title: 'Tarea actualizada',
        status: 'in_progress',
        priority: 'low'
      };

      const mockUpdatedTask: ITask = {
        _id: '507f1f77bcf86cd799439014',
        title: 'Tarea actualizada',
        description: 'Descripción original',
        status: 'in_progress',
        priority: 'low',
        deadline: new Date('2024-12-31'),
        project: '507f1f77bcf86cd799439012',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest = {
        params: { id: '507f1f77bcf86cd799439014' },
        body: updates,
        user: {
          userId: '507f1f77bcf86cd799439011',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockTaskService.checkTaskPermission.mockResolvedValue(true);
      mockTaskService.updateTask.mockResolvedValue(mockUpdatedTask);

      await TaskController.update(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockTaskService.checkTaskPermission).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439014',
        '507f1f77bcf86cd799439011',
        'usuario'
      );
      expect(mockTaskService.updateTask).toHaveBeenCalledWith('507f1f77bcf86cd799439014', updates);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tarea actualizada exitosamente',
        data: { task: mockUpdatedTask }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar parámetros faltantes', async () => {
      const updates: UpdateTaskRequest = {
        title: 'Tarea actualizada'
      };

      mockRequest = {
        params: {},
        body: updates,
        user: {
          userId: '507f1f77bcf86cd799439011',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      await TaskController.update(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(mockTaskService.checkTaskPermission).not.toHaveBeenCalled();
      expect(mockTaskService.updateTask).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('debe manejar errores de permisos', async () => {
      const updates: UpdateTaskRequest = {
        title: 'Tarea actualizada'
      };

      const mockError = new Error('Sin permisos para actualizar esta tarea');

      mockRequest = {
        params: { id: '507f1f77bcf86cd799439014' },
        body: updates,
        user: {
          userId: '507f1f77bcf86cd799439011',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockTaskService.checkTaskPermission.mockRejectedValue(mockError);

      await TaskController.update(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockTaskService.updateTask).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('debe manejar errores al actualizar', async () => {
      const updates: UpdateTaskRequest = {
        title: 'Tarea actualizada'
      };

      const mockError = new Error('Error al actualizar tarea');

      mockRequest = {
        params: { id: '507f1f77bcf86cd799439014' },
        body: updates,
        user: {
          userId: '507f1f77bcf86cd799439011',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockTaskService.checkTaskPermission.mockResolvedValue(true);
      mockTaskService.updateTask.mockRejectedValue(mockError);

      await TaskController.update(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('debe eliminar una tarea exitosamente', async () => {
      mockRequest = {
        params: { id: '507f1f77bcf86cd799439014' },
        user: {
          userId: '507f1f77bcf86cd799439011',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockTaskService.checkTaskPermission.mockResolvedValue(true);
      mockTaskService.deleteTask.mockResolvedValue(undefined);

      await TaskController.delete(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockTaskService.checkTaskPermission).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439014',
        '507f1f77bcf86cd799439011',
        'usuario'
      );
      expect(mockTaskService.deleteTask).toHaveBeenCalledWith('507f1f77bcf86cd799439014');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tarea eliminada exitosamente'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar parámetros faltantes', async () => {
      mockRequest = {
        params: {},
        user: {
          userId: '507f1f77bcf86cd799439011',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      await TaskController.delete(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(mockTaskService.checkTaskPermission).not.toHaveBeenCalled();
      expect(mockTaskService.deleteTask).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('debe manejar errores de permisos', async () => {
      const mockError = new Error('Sin permisos para eliminar esta tarea');

      mockRequest = {
        params: { id: '507f1f77bcf86cd799439014' },
        user: {
          userId: '507f1f77bcf86cd799439011',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockTaskService.checkTaskPermission.mockRejectedValue(mockError);

      await TaskController.delete(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockTaskService.deleteTask).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('getByProject', () => {
    it('debe obtener tareas por proyecto exitosamente', async () => {
      const mockResult = {
        tasks: [
          {
            _id: '507f1f77bcf86cd799439014',
            title: 'Tarea del proyecto',
            description: 'Descripción',
            status: 'todo',
            priority: 'medium',
            deadline: new Date('2024-12-31'),
            project: '507f1f77bcf86cd799439012'
          }
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalTasks: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      };

      mockRequest = {
        params: { projectId: '507f1f77bcf86cd799439012' },
        query: {},
        user: {
          userId: '507f1f77bcf86cd799439011',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockTaskService.getTasksByProject.mockResolvedValue(mockResult as any);

      await TaskController.getByProject(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockTaskService.getTasksByProject).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439011',
        'usuario',
        1,
        10
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe obtener tareas por proyecto con paginación personalizada', async () => {
      const mockResult = {
        tasks: [],
        pagination: {
          currentPage: 2,
          totalPages: 1,
          totalTasks: 0,
          hasNextPage: false,
          hasPrevPage: true
        }
      };

      mockRequest = {
        params: { projectId: '507f1f77bcf86cd799439012' },
        query: { page: '2', limit: '5' },
        user: {
          userId: '507f1f77bcf86cd799439011',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockTaskService.getTasksByProject.mockResolvedValue(mockResult as any);

      await TaskController.getByProject(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockTaskService.getTasksByProject).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439011',
        'usuario',
        2,
        5
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar parámetros faltantes', async () => {
      mockRequest = {
        params: {},
        query: {},
        user: {
          userId: '507f1f77bcf86cd799439011',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      await TaskController.getByProject(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(mockTaskService.getTasksByProject).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('debe manejar usuario no autenticado', async () => {
      mockRequest = {
        params: { projectId: '507f1f77bcf86cd799439012' },
        query: {},
        user: undefined
      } as unknown as AuthRequest;

      await TaskController.getByProject(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(mockTaskService.getTasksByProject).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('debe manejar errores al obtener tareas por proyecto', async () => {
      const mockError = new Error('Error al obtener tareas del proyecto');

      mockRequest = {
        params: { projectId: '507f1f77bcf86cd799439012' },
        query: {},
        user: {
          userId: '507f1f77bcf86cd799439011',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockTaskService.getTasksByProject.mockRejectedValue(mockError);

      await TaskController.getByProject(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });
});