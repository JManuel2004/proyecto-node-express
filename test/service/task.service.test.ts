import { TaskService } from '../../src/services/task.services';
import { Task, Project, User } from '../../src/models';
import { ProjectService } from '../../src/services/project.services';
import { 
  NotFoundError, 
  ForbiddenError, 
  ValidationError, 
  ConflictError 
} from '../../src/middleware/error';
import { CreateTaskRequest, UpdateTaskRequest, ITask, TaskPriority, TaskStatus } from '../../src/types';

// Mock de los modelos
jest.mock('../../src/models', () => ({
  Task: jest.fn().mockImplementation(() => ({
    save: jest.fn(),
  })),
  Project: {
    find: jest.fn(),
    findById: jest.fn()
  },
  User: {
    findById: jest.fn()
  }
}));

// Mock del ProjectService
jest.mock('../../src/services/project.services');

const mockedTask = Task as jest.MockedFunction<any>;
mockedTask.findById = jest.fn();
mockedTask.findOne = jest.fn();
mockedTask.find = jest.fn();
mockedTask.findByIdAndUpdate = jest.fn();
mockedTask.findByIdAndDelete = jest.fn();
mockedTask.countDocuments = jest.fn();
const mockedProject = Project as jest.Mocked<typeof Project>;
const mockedUser = User as jest.Mocked<typeof User>;
const mockedProjectService = ProjectService as jest.Mocked<typeof ProjectService>;

describe('TaskService', () => {
  const mockUserId = '507f1f77bcf86cd799439011';
  const mockProjectId = '507f1f77bcf86cd799439012';
  const mockTaskId = '507f1f77bcf86cd799439013';
  const mockAssignedUserId = '507f1f77bcf86cd799439014';

  const mockTask: ITask = {
    _id: mockTaskId,
    title: 'Tarea de prueba',
    description: 'Descripción de la tarea de prueba',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    deadline: new Date('2024-12-31'),
    project: mockProjectId,
    assignedTo: mockAssignedUserId,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockCreateTaskRequest: CreateTaskRequest = {
    title: 'Nueva tarea',
    description: 'Descripción de nueva tarea',
    priority: 'high' as TaskPriority,
    deadline: new Date('2024-12-31'),
    project: mockProjectId,
    assignedTo: mockAssignedUserId
  };

  const mockUpdateTaskRequest: UpdateTaskRequest = {
    title: 'Tarea actualizada',
    description: 'Descripción actualizada',
    status: 'in_progress' as TaskStatus,
    priority: 'low' as TaskPriority
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('debería crear una nueva tarea exitosamente', async () => {
      // Arrange
      mockedProjectService.checkProjectPermission.mockResolvedValue(true);
      mockedUser.findById.mockResolvedValue({ _id: mockAssignedUserId } as any);

      const mockTaskInstance = {
        save: jest.fn().mockResolvedValue(mockTask),
        populate: jest.fn().mockReturnThis(),
        toObject: jest.fn().mockReturnValue({ ...mockTask, _id: mockTaskId })
      };

      // Mock el constructor correctamente
      mockedTask.mockImplementationOnce(() => mockTaskInstance);

      // Act
      const result = await TaskService.createTask({
        ...mockCreateTaskRequest,
        createdBy: mockUserId
      });

      // Assert
      expect(mockedProjectService.checkProjectPermission).toHaveBeenCalledWith(
        mockProjectId,
        mockUserId,
        'usuario'
      );
      expect(mockedUser.findById).toHaveBeenCalledWith(mockAssignedUserId);
      expect(mockTaskInstance.save).toHaveBeenCalled();
      expect(result).toEqual({
        ...mockTask,
        _id: mockTaskId
      });
    });

    it('debería lanzar error si el usuario asignado no existe', async () => {
      // Arrange
      mockedProjectService.checkProjectPermission.mockResolvedValue(true);
      mockedUser.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        TaskService.createTask({
          ...mockCreateTaskRequest,
          createdBy: mockUserId
        })
      ).rejects.toThrow(NotFoundError);
      
      expect(mockedUser.findById).toHaveBeenCalledWith(mockAssignedUserId);
    });

    it('debería lanzar ConflictError si ya existe una tarea con el mismo título', async () => {
      // Arrange
      mockedProjectService.checkProjectPermission.mockResolvedValue(true);
      mockedUser.findById.mockResolvedValue({ _id: mockAssignedUserId } as any);

      const mockTaskInstance = {
        save: jest.fn().mockRejectedValue({ code: 11000 })
      };

      // Mock el constructor correctamente
      mockedTask.mockImplementationOnce(() => mockTaskInstance);

      // Act & Assert
      await expect(
        TaskService.createTask({
          ...mockCreateTaskRequest,
          createdBy: mockUserId
        })
      ).rejects.toThrow(ConflictError);
    });

    it('debería crear tarea sin usuario asignado', async () => {
      // Arrange
      mockedProjectService.checkProjectPermission.mockResolvedValue(true);

      const taskDataWithoutAssignedTo = { ...mockCreateTaskRequest };
      delete taskDataWithoutAssignedTo.assignedTo;

      const savedTask = {
        _id: mockTaskId,
        title: mockCreateTaskRequest.title,
        description: mockCreateTaskRequest.description,
        status: 'todo',
        priority: mockCreateTaskRequest.priority,
        deadline: mockCreateTaskRequest.deadline,
        project: mockProjectId,
        assignedTo: undefined,
        populate: jest.fn().mockReturnThis(),
        toObject: jest.fn().mockReturnValue({
          _id: mockTaskId,
          title: mockCreateTaskRequest.title,
          description: mockCreateTaskRequest.description,
          status: 'todo',
          priority: mockCreateTaskRequest.priority,
          deadline: mockCreateTaskRequest.deadline,
          project: mockProjectId,
          assignedTo: undefined
        })
      };

      const mockTaskInstance = {
        save: jest.fn().mockResolvedValue(savedTask),
        populate: jest.fn().mockReturnThis(),
        toObject: jest.fn().mockReturnValue({ ...mockTask, _id: mockTaskId, assignedTo: undefined })
      };

      // Mock el constructor correctamente
      mockedTask.mockImplementationOnce(() => mockTaskInstance);

      // Act
      const result = await TaskService.createTask({
        ...taskDataWithoutAssignedTo,
        createdBy: mockUserId
      });

      // Assert
      expect(mockedProjectService.checkProjectPermission).toHaveBeenCalled();
      expect(mockedUser.findById).not.toHaveBeenCalled();
      expect(result).toEqual({
        ...mockTask,
        _id: mockTaskId,
        assignedTo: undefined
      });
    });
  });

  describe('getTasks', () => {
    it('debería obtener tareas con paginación', async () => {
      // Arrange
      const mockTasks = [mockTask];
      const page = 1;
      const limit = 10;
      const totalTasks = 1;

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockTasks)
      };

      mockedTask.find.mockReturnValue(mockQuery as any);
      mockedTask.countDocuments.mockResolvedValue(totalTasks);

      // Act
      const result = await TaskService.getTasks({}, page, limit);

      // Assert
      expect(mockedTask.find).toHaveBeenCalledWith({});
      expect(mockedTask.countDocuments).toHaveBeenCalledWith({});
      expect(result).toEqual({
        tasks: mockTasks,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalTasks: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      });
    });

    it('debería calcular correctamente la paginación para múltiples páginas', async () => {
      // Arrange
      const mockTasks = [mockTask];
      const page = 2;
      const limit = 5;
      const totalTasks = 12;

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockTasks)
      };

      mockedTask.find.mockReturnValue(mockQuery as any);
      mockedTask.countDocuments.mockResolvedValue(totalTasks);

      // Act
      const result = await TaskService.getTasks({}, page, limit);

      // Assert
      expect(result.pagination).toEqual({
        currentPage: 2,
        totalPages: 3,
        totalTasks: 12,
        hasNextPage: true,
        hasPrevPage: true
      });
    });
  });

  describe('getTaskById', () => {
    it('debería obtener una tarea por ID exitosamente', async () => {
      // Arrange
      const mockTaskInstance = {
        populate: jest.fn().mockResolvedValue({
          toObject: jest.fn().mockReturnValue({ ...mockTask, _id: mockTaskId })
        })
      };

      mockedTask.findById.mockResolvedValue(mockTaskInstance as any);

      // Act
      const result = await TaskService.getTaskById(mockTaskId);

      // Assert
      expect(mockedTask.findById).toHaveBeenCalledWith(mockTaskId);
      expect(mockTaskInstance.populate).toHaveBeenCalledWith([
        { path: 'project', select: 'name description owner' },
        { path: 'assignedTo', select: 'firstName lastName email' }
      ]);
      expect(result).toEqual({
        ...mockTask,
        _id: mockTaskId
      });
    });

    it('debería lanzar NotFoundError si la tarea no existe', async () => {
      // Arrange
      mockedTask.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(TaskService.getTaskById(mockTaskId)).rejects.toThrow(NotFoundError);
      expect(mockedTask.findById).toHaveBeenCalledWith(mockTaskId);
    });
  });

  describe('updateTask', () => {
    it('debería actualizar una tarea exitosamente', async () => {
      // Arrange
      const updatedTask = { ...mockTask, ...mockUpdateTaskRequest };
      const mockTaskInstance = {
        populate: jest.fn().mockResolvedValue({
          toObject: jest.fn().mockReturnValue({ ...updatedTask, _id: mockTaskId })
        })
      };

      mockedTask.findByIdAndUpdate.mockResolvedValue(mockTaskInstance as any);

      // Act
      const result = await TaskService.updateTask(mockTaskId, mockUpdateTaskRequest);

      // Assert
      expect(mockedTask.findByIdAndUpdate).toHaveBeenCalledWith(
        mockTaskId,
        mockUpdateTaskRequest,
        { new: true, runValidators: true }
      );
      expect(mockTaskInstance.populate).toHaveBeenCalledWith([
        { path: 'project', select: 'name description' },
        { path: 'assignedTo', select: 'firstName lastName email' }
      ]);
      expect(result).toEqual({
        ...updatedTask,
        _id: mockTaskId
      });
    });

    it('debería lanzar NotFoundError si la tarea no existe al actualizar', async () => {
      // Arrange
      mockedTask.findByIdAndUpdate.mockResolvedValue(null);

      // Act & Assert
      await expect(
        TaskService.updateTask(mockTaskId, mockUpdateTaskRequest)
      ).rejects.toThrow(NotFoundError);
    });

    it('debería convertir fecha de deadline a Date object', async () => {
      // Arrange
      const updateWithDate = {
        ...mockUpdateTaskRequest,
        deadline: new Date('2025-01-01')
      };

      const mockTaskInstance = {
        populate: jest.fn().mockResolvedValue({
          toObject: jest.fn().mockReturnValue({ ...mockTask, _id: mockTaskId })
        })
      };

      mockedTask.findByIdAndUpdate.mockResolvedValue(mockTaskInstance as any);

      // Act
      await TaskService.updateTask(mockTaskId, updateWithDate);

      // Assert
      expect(mockedTask.findByIdAndUpdate).toHaveBeenCalledWith(
        mockTaskId,
        expect.objectContaining({
          deadline: expect.any(Date)
        }),
        { new: true, runValidators: true }
      );
    });
  });

  describe('deleteTask', () => {
    it('debería eliminar una tarea exitosamente', async () => {
      // Arrange
      mockedTask.findByIdAndDelete.mockResolvedValue(mockTask as any);

      // Act
      await TaskService.deleteTask(mockTaskId);

      // Assert
      expect(mockedTask.findByIdAndDelete).toHaveBeenCalledWith(mockTaskId);
    });

    it('debería lanzar NotFoundError si la tarea no existe al eliminar', async () => {
      // Arrange
      mockedTask.findByIdAndDelete.mockResolvedValue(null);

      // Act & Assert
      await expect(TaskService.deleteTask(mockTaskId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('checkTaskPermission', () => {
    it('debería permitir acceso a superadmin', async () => {
      // Act
      const result = await TaskService.checkTaskPermission(mockTaskId, mockUserId, 'superadmin');

      // Assert
      expect(result).toBe(true);
      expect(mockedTask.findById).not.toHaveBeenCalled();
    });

    it('debería permitir acceso al propietario del proyecto', async () => {
      // Arrange
      const mockProject = {
        _id: mockProjectId,
        name: 'Test Project',
        owner: mockUserId
      };

      const mockTaskResult = {
        _id: mockTaskId,
        title: 'Test Task',
        project: mockProject,
        assignedTo: 'otherUserId'
      };

      // Mock findById que retorna un objeto con populate
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockTaskResult)
      };
      
      mockedTask.findById.mockReturnValue(mockQuery as any);

      // Act
      const result = await TaskService.checkTaskPermission(mockTaskId, mockUserId, 'usuario');

      // Assert
      expect(result).toBe(true);
      expect(mockedTask.findById).toHaveBeenCalledWith(mockTaskId);
      expect(mockQuery.populate).toHaveBeenCalledWith('project');
    });

    it('debería permitir acceso al usuario asignado', async () => {
      // Arrange
      const mockProject = {
        _id: mockProjectId,
        name: 'Test Project',
        owner: 'otherUserId'
      };

      const mockTaskResult = {
        _id: mockTaskId,
        title: 'Test Task',
        project: mockProject,
        assignedTo: mockUserId
      };

      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockTaskResult)
      };
      
      mockedTask.findById.mockReturnValue(mockQuery as any);

      // Act
      const result = await TaskService.checkTaskPermission(mockTaskId, mockUserId, 'usuario');

      // Assert
      expect(result).toBe(true);
    });

    it('debería lanzar NotFoundError si la tarea no existe', async () => {
      // Arrange
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(null)
      };
      
      mockedTask.findById.mockReturnValue(mockQuery as any);

      // Act & Assert
      await expect(
        TaskService.checkTaskPermission(mockTaskId, mockUserId, 'usuario')
      ).rejects.toThrow(NotFoundError);
    });

    it('debería lanzar ForbiddenError si no tiene permisos', async () => {
      // Arrange
      const mockProject = {
        _id: mockProjectId,
        name: 'Test Project',
        owner: 'otherUserId'
      };

      const mockTaskResult = {
        _id: mockTaskId,
        title: 'Test Task',
        project: mockProject,
        assignedTo: 'anotherUserId'
      };

      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockTaskResult)
      };
      
      mockedTask.findById.mockReturnValue(mockQuery as any);

      // Act & Assert
      await expect(
        TaskService.checkTaskPermission(mockTaskId, mockUserId, 'usuario')
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('getTasksByProject', () => {
    it('debería obtener tareas por proyecto', async () => {
      // Arrange
      mockedProjectService.checkProjectPermission.mockResolvedValue(true);
      
      const mockTasks = [mockTask];
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockTasks)
      };

      mockedTask.find.mockReturnValue(mockQuery as any);
      mockedTask.countDocuments.mockResolvedValue(1);

      // Act
      const result = await TaskService.getTasksByProject(mockProjectId, mockUserId, 'usuario', 1, 10);

      // Assert
      expect(mockedProjectService.checkProjectPermission).toHaveBeenCalledWith(
        mockProjectId,
        mockUserId,
        'usuario'
      );
      expect(mockedTask.find).toHaveBeenCalledWith({ project: mockProjectId });
      expect(result.tasks).toEqual(mockTasks);
    });
  });

  describe('getUserTasks', () => {
    it('debería obtener tareas del usuario superadmin sin filtros adicionales', async () => {
      // Arrange
      const mockTasks = [mockTask];
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockTasks)
      };

      mockedTask.find.mockReturnValue(mockQuery as any);
      mockedTask.countDocuments.mockResolvedValue(1);

      // Act
      const result = await TaskService.getUserTasks(mockUserId, 'superadmin', {}, 1, 10);

      // Assert
      expect(mockedTask.find).toHaveBeenCalledWith({});
      expect(result.tasks).toEqual(mockTasks);
    });

    it('debería filtrar tareas para usuario regular', async () => {
      // Arrange
      const mockUserProjects = [{ _id: mockProjectId }];
      mockedProject.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserProjects)
      } as any);

      const mockTasks = [mockTask];
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockTasks)
      };

      mockedTask.find.mockReturnValue(mockQuery as any);
      mockedTask.countDocuments.mockResolvedValue(1);

      // Act
      const result = await TaskService.getUserTasks(mockUserId, 'usuario', {}, 1, 10);

      // Assert
      expect(mockedProject.find).toHaveBeenCalledWith({ owner: mockUserId });
      expect(mockedTask.find).toHaveBeenCalledWith({
        $or: [
          { assignedTo: mockUserId },
          { project: { $in: [mockProjectId] } }
        ]
      });
      expect(result.tasks).toEqual(mockTasks);
    });

    it('debería lanzar ForbiddenError si usuario no tiene acceso al proyecto específico', async () => {
      // Arrange
      const otherProjectId = '507f1f77bcf86cd799439999';
      const mockUserProjects = [{ _id: mockProjectId }];
      
      mockedProject.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserProjects)
      } as any);

      mockedTask.countDocuments.mockResolvedValue(0);

      // Act & Assert
      await expect(
        TaskService.getUserTasks(mockUserId, 'usuario', { project: otherProjectId }, 1, 10)
      ).rejects.toThrow(ForbiddenError);

      expect(mockedTask.countDocuments).toHaveBeenCalledWith({
        project: otherProjectId,
        assignedTo: mockUserId
      });
    });
  });
});