import { Response, NextFunction } from 'express';
import { ProjectController } from '../../src/controllers/project.controller';
import { ProjectService } from '../../src/services/project.services';
import { AuthRequest, CreateProjectRequest, UpdateProjectRequest } from '../../src/types';
import { UnauthorizedError, BadRequestError } from '../../src/middleware/error';

// Mock del ProjectService
jest.mock('../../src/services/project.services');
const mockProjectService = ProjectService as jest.Mocked<typeof ProjectService>;

describe('ProjectController', () => {
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
    it('debe crear un proyecto exitosamente', async () => {
      const projectData: CreateProjectRequest = {
        name: 'Nuevo Proyecto',
        description: 'Descripción del proyecto',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      };

      const mockProject = {
        _id: '123',
        name: 'Nuevo Proyecto',
        description: 'Descripción del proyecto',
        owner: 'user123',
        status: 'active' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest = {
        body: projectData,
        user: {
          userId: 'user123',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockProjectService.createProject.mockResolvedValue(mockProject);

      await ProjectController.create(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockProjectService.createProject).toHaveBeenCalledWith({
        ...projectData,
        owner: 'user123'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Proyecto creado exitosamente',
        data: { project: mockProject }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar usuario no autenticado', async () => {
      const projectData: CreateProjectRequest = {
        name: 'Nuevo Proyecto',
        description: 'Descripción del proyecto',
        startDate: new Date('2024-01-01')
      };

      mockRequest = {
        body: projectData,
        user: undefined
      } as unknown as AuthRequest;

      await ProjectController.create(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(UnauthorizedError)
      );
      expect(mockProjectService.createProject).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('debe manejar errores durante la creación', async () => {
      const projectData: CreateProjectRequest = {
        name: 'Nuevo Proyecto',
        description: 'Descripción del proyecto',
        startDate: new Date('2024-01-01')
      };

      const mockError = new Error('Error al crear proyecto');

      mockRequest = {
        body: projectData,
        user: {
          userId: 'user123',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockProjectService.createProject.mockRejectedValue(mockError);

      await ProjectController.create(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('getAll', () => {
    it('debe obtener proyectos con paginación por defecto para usuario regular', async () => {
      const mockResult = {
        projects: [
          {
            _id: '1',
            name: 'Proyecto 1',
            description: 'Descripción 1',
            owner: 'user123',
            status: 'active' as const,
            startDate: new Date('2024-01-01'),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalProjects: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      };

      mockRequest = {
        query: {},
        user: {
          userId: 'user123',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockProjectService.getProjects.mockResolvedValue(mockResult as any);

      await ProjectController.getAll(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockProjectService.getProjects).toHaveBeenCalledWith(
        { owner: 'user123' },
        1,
        10
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe obtener todos los proyectos para superadmin', async () => {
      const mockResult = {
        projects: [
          {
            _id: '1',
            name: 'Proyecto 1',
            description: 'Descripción 1',
            owner: 'user123',
            status: 'active' as const,
            startDate: new Date('2024-01-01'),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalProjects: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      };

      mockRequest = {
        query: {},
        user: {
          userId: 'admin123',
          email: 'admin@example.com',
          role: 'superadmin'
        }
      } as unknown as AuthRequest;

      mockProjectService.getProjects.mockResolvedValue(mockResult as any);

      await ProjectController.getAll(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockProjectService.getProjects).toHaveBeenCalledWith(
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

    it('debe aplicar filtros de query', async () => {
      const mockResult = {
        projects: [],
        pagination: {
          currentPage: 2,
          totalPages: 1,
          totalProjects: 0,
          hasNextPage: false,
          hasPrevPage: true
        }
      };

      mockRequest = {
        query: {
          page: '2',
          limit: '5',
          status: 'completed',
          startDate: '2024-01-01'
        },
        user: {
          userId: 'user123',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockProjectService.getProjects.mockResolvedValue(mockResult as any);

      await ProjectController.getAll(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockProjectService.getProjects).toHaveBeenCalledWith(
        {
          owner: 'user123',
          status: 'completed',
          startDate: { $gte: new Date('2024-01-01') }
        },
        2,
        5
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar errores al obtener proyectos', async () => {
      const mockError = new Error('Error al obtener proyectos');

      mockRequest = {
        query: {},
        user: {
          userId: 'user123',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockProjectService.getProjects.mockRejectedValue(mockError);

      await ProjectController.getAll(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('debe obtener un proyecto por ID exitosamente', async () => {
      const mockProject = {
        _id: '123',
        name: 'Proyecto Test',
        description: 'Descripción test',
        owner: 'user123',
        status: 'active' as const,
        startDate: new Date('2024-01-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest = {
        params: { id: '123' },
        user: {
          userId: 'user123',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockProjectService.getProjectById.mockResolvedValue(mockProject);
      mockProjectService.checkProjectPermission.mockResolvedValue(true);

      await ProjectController.getById(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockProjectService.getProjectById).toHaveBeenCalledWith('123');
      expect(mockProjectService.checkProjectPermission).toHaveBeenCalledWith('123', 'user123', 'usuario');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { project: mockProject }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar parámetros faltantes', async () => {
      mockRequest = {
        params: {},
        user: {
          userId: 'user123',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      await ProjectController.getById(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(BadRequestError)
      );
      expect(mockProjectService.getProjectById).not.toHaveBeenCalled();
    });

    it('debe manejar usuario no autenticado', async () => {
      mockRequest = {
        params: { id: '123' },
        user: undefined
      } as unknown as AuthRequest;

      await ProjectController.getById(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(BadRequestError)
      );
      expect(mockProjectService.getProjectById).not.toHaveBeenCalled();
    });

    it('debe manejar errores al obtener proyecto', async () => {
      const mockError = new Error('Proyecto no encontrado');

      mockRequest = {
        params: { id: '999' },
        user: {
          userId: 'user123',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockProjectService.getProjectById.mockRejectedValue(mockError);

      await ProjectController.getById(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('debe actualizar un proyecto exitosamente', async () => {
      const updates: UpdateProjectRequest = {
        name: 'Proyecto Actualizado',
        description: 'Nueva descripción',
        status: 'completed'
      };

      const mockUpdatedProject = {
        _id: '123',
        name: 'Proyecto Actualizado',
        description: 'Nueva descripción',
        owner: 'user123',
        status: 'completed' as const,
        startDate: new Date('2024-01-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest = {
        params: { id: '123' },
        body: updates,
        user: {
          userId: 'user123',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockProjectService.checkProjectPermission.mockResolvedValue(true);
      mockProjectService.updateProject.mockResolvedValue(mockUpdatedProject);

      await ProjectController.update(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockProjectService.checkProjectPermission).toHaveBeenCalledWith('123', 'user123', 'usuario');
      expect(mockProjectService.updateProject).toHaveBeenCalledWith('123', updates);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Proyecto actualizado exitosamente',
        data: { project: mockUpdatedProject }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar parámetros faltantes', async () => {
      const updates: UpdateProjectRequest = {
        name: 'Proyecto Actualizado'
      };

      mockRequest = {
        params: {},
        body: updates,
        user: {
          userId: 'user123',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      await ProjectController.update(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(BadRequestError)
      );
      expect(mockProjectService.checkProjectPermission).not.toHaveBeenCalled();
    });

    it('debe manejar errores de permisos', async () => {
      const updates: UpdateProjectRequest = {
        name: 'Proyecto Actualizado'
      };

      const mockError = new Error('Sin permisos');

      mockRequest = {
        params: { id: '123' },
        body: updates,
        user: {
          userId: 'user456',
          email: 'other@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockProjectService.checkProjectPermission.mockRejectedValue(mockError);

      await ProjectController.update(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockProjectService.updateProject).not.toHaveBeenCalled();
    });

    it('debe manejar errores al actualizar', async () => {
      const updates: UpdateProjectRequest = {
        name: 'Proyecto Actualizado'
      };

      const mockError = new Error('Error al actualizar');

      mockRequest = {
        params: { id: '123' },
        body: updates,
        user: {
          userId: 'user123',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockProjectService.checkProjectPermission.mockResolvedValue(true);
      mockProjectService.updateProject.mockRejectedValue(mockError);

      await ProjectController.update(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('debe eliminar un proyecto exitosamente', async () => {
      mockRequest = {
        params: { id: '123' },
        user: {
          userId: 'user123',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockProjectService.checkProjectPermission.mockResolvedValue(true);
      mockProjectService.deleteProject.mockResolvedValue(undefined);

      await ProjectController.delete(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockProjectService.checkProjectPermission).toHaveBeenCalledWith('123', 'user123', 'usuario');
      expect(mockProjectService.deleteProject).toHaveBeenCalledWith('123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Proyecto eliminado exitosamente'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar parámetros faltantes', async () => {
      mockRequest = {
        params: {},
        user: {
          userId: 'user123',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      await ProjectController.delete(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(BadRequestError)
      );
      expect(mockProjectService.checkProjectPermission).not.toHaveBeenCalled();
    });

    it('debe manejar errores de permisos', async () => {
      const mockError = new Error('Sin permisos para eliminar');

      mockRequest = {
        params: { id: '123' },
        user: {
          userId: 'user456',
          email: 'other@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockProjectService.checkProjectPermission.mockRejectedValue(mockError);

      await ProjectController.delete(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockProjectService.deleteProject).not.toHaveBeenCalled();
    });
  });

  describe('getMyProjects', () => {
    it('debe obtener los proyectos del usuario con paginación', async () => {
      const mockResult = {
        projects: [
          {
            _id: '1',
            name: 'Mi Proyecto 1',
            description: 'Descripción 1',
            owner: 'user123',
            status: 'active' as const,
            startDate: new Date('2024-01-01'),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalProjects: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      };

      mockRequest = {
        query: {},
        user: {
          userId: 'user123',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockProjectService.getProjects.mockResolvedValue(mockResult as any);

      await ProjectController.getMyProjects(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockProjectService.getProjects).toHaveBeenCalledWith(
        { owner: 'user123' },
        1,
        10
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe usar paginación personalizada', async () => {
      const mockResult = {
        projects: [],
        pagination: {
          currentPage: 2,
          totalPages: 1,
          totalProjects: 0,
          hasNextPage: false,
          hasPrevPage: true
        }
      };

      mockRequest = {
        query: { page: '2', limit: '5' },
        user: {
          userId: 'user123',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockProjectService.getProjects.mockResolvedValue(mockResult as any);

      await ProjectController.getMyProjects(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockProjectService.getProjects).toHaveBeenCalledWith(
        { owner: 'user123' },
        2,
        5
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar errores al obtener mis proyectos', async () => {
      const mockError = new Error('Error al obtener proyectos');

      mockRequest = {
        query: {},
        user: {
          userId: 'user123',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockProjectService.getProjects.mockRejectedValue(mockError);

      await ProjectController.getMyProjects(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('debe obtener estadísticas de proyectos exitosamente', async () => {
      const mockStats = {
        totalProjects: 5,
        stats: [
          { _id: 'active', count: 3 },
          { _id: 'completed', count: 2 },
          { _id: 'archived', count: 0 }
        ]
      };

      mockRequest = {
        user: {
          userId: 'user123',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockProjectService.getProjectStats.mockResolvedValue(mockStats);

      await ProjectController.getStats(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockProjectService.getProjectStats).toHaveBeenCalledWith('user123', 'usuario');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar errores al obtener estadísticas', async () => {
      const mockError = new Error('Error al obtener estadísticas');

      mockRequest = {
        user: {
          userId: 'user123',
          email: 'user@example.com',
          role: 'usuario'
        }
      } as unknown as AuthRequest;

      mockProjectService.getProjectStats.mockRejectedValue(mockError);

      await ProjectController.getStats(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });
});