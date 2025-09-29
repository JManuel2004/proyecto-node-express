import { Project, User } from '../models';
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from '../middleware/error';
import { CreateProjectRequest, UpdateProjectRequest, IProject } from '../types';

export class ProjectService {
  static async createProject(projectData: CreateProjectRequest & { owner: string }): Promise<IProject> {
    const { name, description, startDate, endDate, owner } = projectData;

    const userExists = await User.findById(owner);
    if (!userExists) {
      throw new NotFoundError('Usuario no encontrado');
    }

    if (endDate && new Date(startDate) > new Date(endDate)) {
      throw new ValidationError('La fecha de inicio no puede ser posterior a la fecha de fin');
    }

    try {
      const project = new Project({
        name,
        description,
        owner,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        status: 'active'
      });

  await project.save();
  await project.populate('owner', 'firstName lastName email');
  const plainProject = project.toObject();
  return { ...plainProject, _id: (plainProject._id as any).toString() };
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictError('Ya existe un proyecto con ese nombre');
      }
      throw error;
    }
  }

  static async getProjects(filter: any, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('owner', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Project.countDocuments(filter)
    ]);

    return {
      projects,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProjects: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    };
  }

  static async getProjectById(id: string): Promise<IProject> {
    const project = await Project.findById(id)
      .populate('owner', 'firstName lastName email');
    
    if (!project) {
      throw new NotFoundError('Proyecto no encontrado');
    }

    const plainProject = project.toObject();
    return { ...plainProject, _id: (plainProject._id as any).toString() };
  }

  static async updateProject(id: string, updates: UpdateProjectRequest): Promise<IProject> {
    // Validación de fechas si se proporcionan
    if (updates.startDate && updates.endDate) {
      const start = new Date(updates.startDate);
      const end = new Date(updates.endDate);
      if (start > end) {
        throw new ValidationError('La fecha de inicio no puede ser posterior a la fecha de fin');
      }
    }

    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);

    const project = await Project.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName email');

    if (!project) {
      throw new NotFoundError('Proyecto no encontrado');
    }

    const plainProject = project.toObject();
    return { ...plainProject, _id: (plainProject._id as any).toString() };
  }

  static async deleteProject(id: string): Promise<void> {
    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      throw new NotFoundError('Proyecto no encontrado');
    }
  }

  static async checkProjectPermission(projectId: string, userId: string, userRole: string): Promise<boolean> {
    if (userRole === 'superadmin') return true;

    const project = await Project.findById(projectId);
    if (!project) {
      throw new NotFoundError('Proyecto no encontrado');
    }

    if (!project.owner || project.owner.toString() !== userId) {
      throw new ForbiddenError('No tienes permisos para acceder a este proyecto');
    }

    return true;
  }

  static async getProjectStats(userId: string, userRole: string) {
    const filter: any = {};
    
    if (userRole !== 'superadmin') {
      filter.owner = userId;
    }

    const stats = await Project.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalProjects = await Project.countDocuments(filter);

    return {
      totalProjects,
      stats
    };
  }
}