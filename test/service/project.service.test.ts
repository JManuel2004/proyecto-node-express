import { ProjectService } from '../../src/services/project.services';
import { Project, User } from '../../src/models';
import { 
  NotFoundError, 
  ForbiddenError, 
  ValidationError, 
  ConflictError 
} from '../../src/middleware/error';
import { CreateProjectRequest, UpdateProjectRequest, IProject, ProjectStatus } from '../../src/types';

// Mock de los modelos
jest.mock('../../src/models', () => ({
  Project: jest.fn().mockImplementation(() => ({
    save: jest.fn(),
  })),
  User: {
    findById: jest.fn()
  }
}));

const mockedProject = Project as jest.MockedFunction<any>;
mockedProject.findById = jest.fn();
mockedProject.findOne = jest.fn();
mockedProject.find = jest.fn();
mockedProject.findByIdAndUpdate = jest.fn();
mockedProject.findByIdAndDelete = jest.fn();
mockedProject.countDocuments = jest.fn();
mockedProject.aggregate = jest.fn();

const mockedUser = User as jest.Mocked<typeof User>;

describe('ProjectService', () => {
  const mockUserId = '507f1f77bcf86cd799439011';
  const mockProjectId = '507f1f77bcf86cd799439012';
  const mockOtherUserId = '507f1f77bcf86cd799439013';

  const mockProject: IProject = {
    _id: mockProjectId,
    name: 'Proyecto de prueba',
    description: 'Descripción del proyecto de prueba',
    owner: mockUserId,
    status: 'active' as ProjectStatus,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockCreateProjectRequest: CreateProjectRequest = {
    name: 'Nuevo proyecto',
    description: 'Descripción del nuevo proyecto',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31')
  };

  const mockUpdateProjectRequest: UpdateProjectRequest = {
    name: 'Proyecto actualizado',
    description: 'Descripción actualizada',
    status: 'completed' as ProjectStatus
  };

  const mockUser = {
    _id: mockUserId,
    email: 'test@example.com',
    firstName: 'Juan',
    lastName: 'Pérez',
    role: 'usuario'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('debería crear un nuevo proyecto exitosamente', async () => {
      // Arrange
      mockedUser.findById.mockResolvedValue(mockUser as any);

      const savedProject = {
        _id: mockProjectId,
        name: mockCreateProjectRequest.name,
        description: mockCreateProjectRequest.description,
        owner: mockUserId,
        startDate: mockCreateProjectRequest.startDate,
        endDate: mockCreateProjectRequest.endDate,
        status: 'active',
        populate: jest.fn().mockReturnThis(),
        toObject: jest.fn().mockReturnValue({
          _id: mockProjectId,
          name: mockCreateProjectRequest.name,
          description: mockCreateProjectRequest.description,
          owner: mockUserId,
          startDate: mockCreateProjectRequest.startDate,
          endDate: mockCreateProjectRequest.endDate,
          status: 'active'
        })
      };

      const mockProjectInstance = {
        save: jest.fn().mockResolvedValue(savedProject),
        populate: jest.fn().mockReturnThis(),
        toObject: jest.fn().mockReturnValue({ ...mockProject, _id: mockProjectId })
      };

      // Mock el constructor correctamente
      mockedProject.mockImplementationOnce(() => mockProjectInstance);

      // Act
      const result = await ProjectService.createProject({
        ...mockCreateProjectRequest,
        owner: mockUserId
      });

      // Assert
      expect(mockedUser.findById).toHaveBeenCalledWith(mockUserId);
      expect(mockProjectInstance.save).toHaveBeenCalled();
      expect(result).toEqual({
        ...mockProject,
        _id: mockProjectId
      });
    });

    it('debería lanzar NotFoundError si el usuario no existe', async () => {
      // Arrange
      mockedUser.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        ProjectService.createProject({
          ...mockCreateProjectRequest,
          owner: mockUserId
        })
      ).rejects.toThrow(NotFoundError);
      
      expect(mockedUser.findById).toHaveBeenCalledWith(mockUserId);
    });

    it('debería lanzar ValidationError si la fecha de inicio es posterior a la de fin', async () => {
      // Arrange
      mockedUser.findById.mockResolvedValue(mockUser as any);

      const invalidProjectData = {
        ...mockCreateProjectRequest,
        startDate: new Date('2024-12-31'),
        endDate: new Date('2024-01-01'),
        owner: mockUserId
      };

      // Act & Assert
      await expect(
        ProjectService.createProject(invalidProjectData)
      ).rejects.toThrow(ValidationError);
    });

    it('debería lanzar ConflictError si ya existe un proyecto con el mismo nombre', async () => {
      // Arrange
      mockedUser.findById.mockResolvedValue(mockUser as any);

      const mockProjectInstance = {
        save: jest.fn().mockRejectedValue({ code: 11000 })
      };

      // Mock el constructor correctamente
      mockedProject.mockImplementationOnce(() => mockProjectInstance);

      // Act & Assert
      await expect(
        ProjectService.createProject({
          ...mockCreateProjectRequest,
          owner: mockUserId
        })
      ).rejects.toThrow(ConflictError);
    });

    it('debería crear proyecto sin fecha de fin', async () => {
      // Arrange
      mockedUser.findById.mockResolvedValue(mockUser as any);

      const projectDataWithoutEndDate = {
        ...mockCreateProjectRequest,
        owner: mockUserId
      };
      delete projectDataWithoutEndDate.endDate;

      const savedProject = {
        _id: mockProjectId,
        name: mockCreateProjectRequest.name,
        description: mockCreateProjectRequest.description,
        owner: mockUserId,
        startDate: mockCreateProjectRequest.startDate,
        endDate: undefined,
        status: 'active',
        populate: jest.fn().mockReturnThis(),
        toObject: jest.fn().mockReturnValue({
          _id: mockProjectId,
          name: mockCreateProjectRequest.name,
          description: mockCreateProjectRequest.description,
          owner: mockUserId,
          startDate: mockCreateProjectRequest.startDate,
          endDate: undefined,
          status: 'active'
        })
      };

      const mockProjectInstance = {
        save: jest.fn().mockResolvedValue(savedProject),
        populate: jest.fn().mockReturnThis(),
        toObject: jest.fn().mockReturnValue({ ...mockProject, _id: mockProjectId, endDate: undefined })
      };

      // Mock el constructor correctamente
      mockedProject.mockImplementationOnce(() => mockProjectInstance);

      // Act
      const result = await ProjectService.createProject(projectDataWithoutEndDate);

      // Assert
      expect(result).toEqual({
        ...mockProject,
        _id: mockProjectId,
        endDate: undefined
      });
    });
  });

  describe('getProjects', () => {
    it('debería obtener proyectos con paginación', async () => {
      // Arrange
      const mockProjects = [mockProject];
      const page = 1;
      const limit = 10;
      const totalProjects = 1;

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockProjects)
      };

      mockedProject.find.mockReturnValue(mockQuery as any);
      mockedProject.countDocuments.mockResolvedValue(totalProjects);

      // Act
      const result = await ProjectService.getProjects({}, page, limit);

      // Assert
      expect(mockedProject.find).toHaveBeenCalledWith({});
      expect(mockedProject.countDocuments).toHaveBeenCalledWith({});
      expect(result).toEqual({
        projects: mockProjects,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalProjects: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      });
    });

    it('debería calcular correctamente la paginación para múltiples páginas', async () => {
      // Arrange
      const mockProjects = [mockProject];
      const page = 2;
      const limit = 5;
      const totalProjects = 12;

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockProjects)
      };

      mockedProject.find.mockReturnValue(mockQuery as any);
      mockedProject.countDocuments.mockResolvedValue(totalProjects);

      // Act
      const result = await ProjectService.getProjects({}, page, limit);

      // Assert
      expect(result.pagination).toEqual({
        currentPage: 2,
        totalPages: 3,
        totalProjects: 12,
        hasNextPage: true,
        hasPrevPage: true
      });
    });
  });

  describe('getProjectById', () => {
    it('debería obtener un proyecto por ID exitosamente', async () => {
      // Arrange
      const mockQuery = {
        populate: jest.fn().mockResolvedValue({
          toObject: jest.fn().mockReturnValue({ ...mockProject, _id: mockProjectId })
        })
      };

      mockedProject.findById.mockReturnValue(mockQuery as any);

      // Act
      const result = await ProjectService.getProjectById(mockProjectId);

      // Assert
      expect(mockedProject.findById).toHaveBeenCalledWith(mockProjectId);
      expect(mockQuery.populate).toHaveBeenCalledWith('owner', 'firstName lastName email');
      expect(result).toEqual({
        ...mockProject,
        _id: mockProjectId
      });
    });

    it('debería lanzar NotFoundError si el proyecto no existe', async () => {
      // Arrange
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(null)
      };

      mockedProject.findById.mockReturnValue(mockQuery as any);

      // Act & Assert
      await expect(ProjectService.getProjectById(mockProjectId)).rejects.toThrow(NotFoundError);
      expect(mockedProject.findById).toHaveBeenCalledWith(mockProjectId);
    });
  });

  describe('updateProject', () => {
    it('debería actualizar un proyecto exitosamente', async () => {
      // Arrange
      const updatedProject = { ...mockProject, ...mockUpdateProjectRequest };
      const mockQuery = {
        populate: jest.fn().mockResolvedValue({
          toObject: jest.fn().mockReturnValue({ ...updatedProject, _id: mockProjectId })
        })
      };

      mockedProject.findByIdAndUpdate.mockReturnValue(mockQuery as any);

      // Act
      const result = await ProjectService.updateProject(mockProjectId, mockUpdateProjectRequest);

      // Assert
      expect(mockedProject.findByIdAndUpdate).toHaveBeenCalledWith(
        mockProjectId,
        mockUpdateProjectRequest,
        { new: true, runValidators: true }
      );
      expect(mockQuery.populate).toHaveBeenCalledWith('owner', 'firstName lastName email');
      expect(result).toEqual({
        ...updatedProject,
        _id: mockProjectId
      });
    });

    it('debería lanzar NotFoundError si el proyecto no existe al actualizar', async () => {
      // Arrange
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(null)
      };

      mockedProject.findByIdAndUpdate.mockReturnValue(mockQuery as any);

      // Act & Assert
      await expect(
        ProjectService.updateProject(mockProjectId, mockUpdateProjectRequest)
      ).rejects.toThrow(NotFoundError);
    });

    it('debería convertir fechas a Date objects', async () => {
      // Arrange
      const updateWithDates = {
        ...mockUpdateProjectRequest,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31')
      };

      const mockQuery = {
        populate: jest.fn().mockResolvedValue({
          toObject: jest.fn().mockReturnValue({ ...mockProject, _id: mockProjectId })
        })
      };

      mockedProject.findByIdAndUpdate.mockReturnValue(mockQuery as any);

      // Act
      await ProjectService.updateProject(mockProjectId, updateWithDates);

      // Assert
      expect(mockedProject.findByIdAndUpdate).toHaveBeenCalledWith(
        mockProjectId,
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date)
        }),
        { new: true, runValidators: true }
      );
    });

    it('debería lanzar ValidationError si startDate es posterior a endDate', async () => {
      // Arrange
      const updateWithInvalidDates = {
        ...mockUpdateProjectRequest,
        startDate: new Date('2025-12-31'),
        endDate: new Date('2025-01-01')
      };

      // Act & Assert
      await expect(
        ProjectService.updateProject(mockProjectId, updateWithInvalidDates)
      ).rejects.toThrow(ValidationError);

      // No debería llamar a findByIdAndUpdate porque falla la validación antes
      expect(mockedProject.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('deleteProject', () => {
    it('debería eliminar un proyecto exitosamente', async () => {
      // Arrange
      mockedProject.findByIdAndDelete.mockResolvedValue(mockProject as any);

      // Act
      await ProjectService.deleteProject(mockProjectId);

      // Assert
      expect(mockedProject.findByIdAndDelete).toHaveBeenCalledWith(mockProjectId);
    });

    it('debería lanzar NotFoundError si el proyecto no existe al eliminar', async () => {
      // Arrange
      mockedProject.findByIdAndDelete.mockResolvedValue(null);

      // Act & Assert
      await expect(ProjectService.deleteProject(mockProjectId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('checkProjectPermission', () => {
    it('debería permitir acceso a superadmin', async () => {
      // Act
      const result = await ProjectService.checkProjectPermission(mockProjectId, mockUserId, 'superadmin');

      // Assert
      expect(result).toBe(true);
      expect(mockedProject.findById).not.toHaveBeenCalled();
    });

    it('debería permitir acceso al propietario del proyecto', async () => {
      // Arrange
      const mockProjectResult = {
        _id: mockProjectId,
        name: 'Test Project',
        owner: mockUserId
      };

      mockedProject.findById.mockResolvedValue(mockProjectResult as any);

      // Act
      const result = await ProjectService.checkProjectPermission(mockProjectId, mockUserId, 'usuario');

      // Assert
      expect(result).toBe(true);
      expect(mockedProject.findById).toHaveBeenCalledWith(mockProjectId);
    });

    it('debería lanzar NotFoundError si el proyecto no existe', async () => {
      // Arrange
      mockedProject.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        ProjectService.checkProjectPermission(mockProjectId, mockUserId, 'usuario')
      ).rejects.toThrow(NotFoundError);
    });

    it('debería lanzar ForbiddenError si no es el propietario', async () => {
      // Arrange
      const mockProjectResult = {
        _id: mockProjectId,
        name: 'Test Project',
        owner: mockOtherUserId
      };

      mockedProject.findById.mockResolvedValue(mockProjectResult as any);

      // Act & Assert
      await expect(
        ProjectService.checkProjectPermission(mockProjectId, mockUserId, 'usuario')
      ).rejects.toThrow(ForbiddenError);
    });

    it('debería lanzar ForbiddenError si el proyecto no tiene propietario', async () => {
      // Arrange
      const mockProjectResult = {
        _id: mockProjectId,
        name: 'Test Project',
        owner: null
      };

      mockedProject.findById.mockResolvedValue(mockProjectResult as any);

      // Act & Assert
      await expect(
        ProjectService.checkProjectPermission(mockProjectId, mockUserId, 'usuario')
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('getProjectStats', () => {
    it('debería obtener estadísticas para superadmin', async () => {
      // Arrange
      const mockStats = [
        { _id: 'active', count: 5 },
        { _id: 'completed', count: 3 },
        { _id: 'archived', count: 2 }
      ];

      const totalProjects = 10;

      mockedProject.aggregate.mockResolvedValue(mockStats);
      mockedProject.countDocuments.mockResolvedValue(totalProjects);

      // Act
      const result = await ProjectService.getProjectStats(mockUserId, 'superadmin');

      // Assert
      expect(mockedProject.aggregate).toHaveBeenCalledWith([
        { $match: {} },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
      expect(mockedProject.countDocuments).toHaveBeenCalledWith({});
      expect(result).toEqual({
        totalProjects,
        stats: mockStats
      });
    });

    it('debería obtener estadísticas filtradas para usuario regular', async () => {
      // Arrange
      const mockStats = [
        { _id: 'active', count: 2 },
        { _id: 'completed', count: 1 }
      ];

      const totalProjects = 3;

      mockedProject.aggregate.mockResolvedValue(mockStats);
      mockedProject.countDocuments.mockResolvedValue(totalProjects);

      // Act
      const result = await ProjectService.getProjectStats(mockUserId, 'usuario');

      // Assert
      expect(mockedProject.aggregate).toHaveBeenCalledWith([
        { $match: { owner: mockUserId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
      expect(mockedProject.countDocuments).toHaveBeenCalledWith({ owner: mockUserId });
      expect(result).toEqual({
        totalProjects,
        stats: mockStats
      });
    });
  });
});